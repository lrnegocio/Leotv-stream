
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, Laugh, Play, Gamepad2, X, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, getRemoteGames, GameItem } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'CANAIS AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'FILMES MASTER', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'SÉRIES & NOVELAS', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SERIES' },
  { id: 'CLIPES', name: 'VÍDEO CLIPES', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV VÍDEO CLIPES' },
  { id: 'PIADAS', name: 'PIADAS & HUMOR', icon: Laugh, color: 'bg-amber-400', genre: 'LÉO TV PIADAS' },
  { id: 'REELS', name: 'REELS VIP', icon: Play, color: 'bg-rose-500', genre: 'LÉO TV REELS', restricted: true },
  { id: 'DORAMAS', name: 'DORAMAS MASTER', icon: Sparkles, color: 'bg-indigo-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'MUNDO INFANTIL', icon: Baby, color: 'bg-sky-500', genre: 'LÉO TV DESENHOS' },
  { id: 'RADIO', name: 'RÁDIOS ONLINE', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'NOVELAS', name: 'NOVELAS & DRAMA', icon: Heart, color: 'bg-red-500', genre: 'LÉO TV NOVELAS' },
  { id: 'GAMES', name: 'ARENA GAMES RETRO', icon: Gamepad2, color: 'bg-emerald-600', special: 'games' },
  { id: 'ADULT', name: 'CONTEÚDO ADULTO', icon: Lock, color: 'bg-zinc-800', genre: 'LÉO TV ADULTOS', restricted: true },
]

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [games, setGames] = React.useState<GameItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<{ items: any[], index: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null)
  const [isPinOpen, setIsPinOpen] = React.useState(false)
  const [pinInput, setPinInput] = React.useState("")
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [unlockTarget, setUnlockTarget] = React.useState<'ADULT' | 'GAMES' | null>(null)
  
  const [gamesMenuOpen, setGamesMenuOpen] = React.useState(false)
  const [activeGame, setActiveGame] = React.useState<GameItem | null>(null)
  
  const isClosingRef = React.useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ""
  const channelId = searchParams.get('id') || ""

  const loadData = React.useCallback(async (queryStr = "", categoryId: string | null = null) => {
    if (isClosingRef.current) return;
    setLoading(true);
    try {
      const session = localStorage.getItem("user_session");
      if (!session) { router.push("/login"); return; }
      const currentUser = JSON.parse(session);
      
      const categoryObj = CATEGORIES.find(c => c.id === categoryId);
      const genreToFilter = categoryObj?.genre || "";
      const data = await getRemoteContent(false, queryStr, genreToFilter);
      setContent(data);

      if (channelId) {
        const item = data.find(i => i.id === channelId);
        if (item) {
          if (item.type === 'series' || item.type === 'multi-season') setSelectedSeries(item);
          else setActiveVideo({ items: data, index: data.indexOf(item) });
        }
      }

      if (!categoryId && !queryStr) {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) { if (cat.genre) counts[cat.id] = await getCategoryCount(cat.genre); }
        setCatCounts(counts);
      }

      if (games.length === 0) setGames(await getRemoteGames());
      setUser(currentUser);
    } catch (err) { } finally { setLoading(false); }
  }, [router, games.length, channelId]);

  React.useEffect(() => { loadData(q, selectedCat) }, [q, selectedCat, loadData]);

  const handleNext = () => {
    if (!activeVideo) return;
    const nextIdx = (activeVideo.index + 1) % activeVideo.items.length;
    setActiveVideo({ ...activeVideo, index: nextIdx });
  };

  const handlePrev = () => {
    if (!activeVideo) return;
    const prevIdx = (activeVideo.index - 1 + activeVideo.items.length) % activeVideo.items.length;
    setActiveVideo({ ...activeVideo, index: prevIdx });
  };

  const handleCategoryClick = (cat: any) => {
    if (cat.special === 'games' || cat.restricted) {
      if (cat.special === 'games' && !user?.isGamesEnabled) { toast({ variant: "destructive", title: "ARENA BLOQUEADA" }); return; }
      if (cat.restricted && !user?.isAdultEnabled) { toast({ variant: "destructive", title: "CONTEÚDO BLOQUEADO" }); return; }
      setUnlockTarget(cat.id === 'GAMES' ? 'GAMES' : 'ADULT');
      setIsPinOpen(true);
    } else {
      setSelectedCat(cat.id);
    }
  };

  const verifyPassword = async () => {
    const settings = await getGlobalSettings();
    if (pinInput === settings.parentalPin) {
      if (unlockTarget === 'GAMES') setGamesMenuOpen(true);
      else setSelectedCat(unlockTarget);
      setIsPinOpen(false);
      setPinInput("");
    } else {
      toast({ variant: "destructive", title: "SENHA INCORRETA" });
      setPinInput("");
    }
  };

  const closePlayer = () => {
    isClosingRef.current = true;
    setActiveVideo(null);
    setSelectedSeries(null);
    const p = new URLSearchParams(window.location.search);
    p.delete('id');
    router.replace(`${window.location.pathname}?${p.toString()}`, { scroll: false });
    setTimeout(() => { isClosingRef.current = false; }, 2000);
  };

  const closeRestricted = () => {
    setSelectedCat(null);
    setGamesMenuOpen(false);
    setPinInput("");
  };

  if (loading && content.length === 0) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 select-none">
      <header className="h-20 border-b border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {(selectedCat || q) && <button onClick={closeRestricted} className="h-12 w-12 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><ChevronLeft className="h-6 w-6" /></button>}
          <span className="text-xl font-black text-primary uppercase italic">Léo TV Stream</span>
        </div>
        <div className="flex-1 max-w-2xl mx-4"><VoiceSearch /></div>
        <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive hover:bg-destructive/10"><LogOut className="h-5 w-5" /></Button>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => handleCategoryClick(c)} className="group relative h-48 rounded-3xl overflow-hidden border border-border bg-card hover:border-primary transition-all shadow-sm">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className={`p-4 rounded-2xl ${c.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><c.icon className="h-8 w-8" /></div>
                  <span className="text-base font-black uppercase tracking-tight">{c.name}</span>
                  <span className="bg-muted px-3 py-0.5 rounded-full text-[9px] font-bold opacity-60">{(catCounts[c.id] || 0).toLocaleString()} Itens</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black uppercase italic">{q ? `Busca: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2>
               <button onClick={closeRestricted} className="text-[10px] font-black uppercase opacity-40 hover:opacity-100">Voltar ao Menu</button>
            </div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {content.map((item) => (
                <div key={item.id} onClick={() => router.push(`?id=${item.id}`, { scroll: false })} className="group relative aspect-[2/3] bg-card rounded-2xl overflow-hidden cursor-pointer border border-border hover:border-primary transition-all shadow-lg">
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-90 group-hover:opacity-100" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center opacity-20"><Tv className="h-10 w-10" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-4 flex flex-col justify-end">
                    <h3 className="font-bold text-[11px] uppercase truncate text-white">{item.title}</h3>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 truncate">{item.genre}</p>
                  </div>
                </div>
              ))}
              {content.length === 0 && <div className="col-span-full py-20 text-center opacity-20 font-black uppercase">Nenhum sinal localizado nesta pasta.</div>}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!activeVideo || !!selectedSeries} onOpenChange={(v) => !v && closePlayer()}>
        <DialogContent className="max-w-5xl bg-black p-0 border-0 rounded-3xl overflow-hidden shadow-2xl">
          {activeVideo && <VideoPlayer key={activeVideo.items[activeVideo.index].id} url={activeVideo.items[activeVideo.index].streamUrl || ""} title={activeVideo.items[activeVideo.index].title} onNext={handleNext} onPrev={handlePrev} />}
          {selectedSeries && (
            <div className="p-8 bg-card max-h-[80vh] overflow-y-auto custom-scroll">
               <h3 className="text-xl font-black uppercase text-primary mb-6 italic">Episódios: {selectedSeries.title}</h3>
               <div className="grid gap-2">
                  {(selectedSeries.episodes || selectedSeries.seasons?.flatMap(s => s.episodes) || []).sort((a,b) => a.number - b.number).map(ep => (
                    <Button key={ep.id} variant="outline" onClick={() => setActiveVideo({ items: selectedSeries.episodes || [], index: (selectedSeries.episodes || []).indexOf(ep) })} className="h-14 justify-start bg-muted rounded-xl border-border px-6 hover:border-primary transition-all">
                      <span className="font-black uppercase text-[10px]">EP {ep.number} - {ep.title}</span>
                      <Play className="ml-auto h-4 w-4 text-primary" />
                    </Button>
                  ))}
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card rounded-3xl p-10 text-center">
          <Lock className="h-12 w-12 text-primary mx-auto mb-6" />
          <div className="text-xl font-black uppercase italic mb-4">Área Restrita Master</div>
          <p className="text-[10px] font-bold opacity-40 uppercase mb-6">Acesso Protegido pela Senha Parental</p>
          <input type="password" title="Senha Parental" maxLength={4} className="h-16 w-48 bg-muted border-border text-center text-3xl font-black tracking-[0.5em] rounded-2xl outline-none focus:border-primary mb-6 shadow-inner" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPassword()} />
          <Button onClick={verifyPassword} className="w-full h-14 bg-primary text-sm font-black uppercase rounded-2xl shadow-lg shadow-primary/20">DESBLOQUEAR ACESSO</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={gamesMenuOpen} onOpenChange={closeRestricted}>
        <DialogContent className="max-w-[90vw] w-full h-[85vh] bg-card rounded-[2.5rem] p-0 overflow-hidden flex flex-col border-emerald-500/20">
          <div className="h-16 bg-emerald-600/10 border-b border-border px-8 flex items-center justify-between">
            <div className="flex items-center gap-3"><Gamepad2 className="h-6 w-6 text-emerald-600" /><h2 className="text-lg font-black uppercase text-emerald-600 italic">Léo Games Arena</h2></div>
            <button onClick={closeRestricted} className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 border-r border-border p-6 overflow-y-auto bg-black/5 custom-scroll">
               {Array.from(new Set(games.map(g => g.console))).map(c => (
                 <div key={c} className="mb-6"><div className="text-[10px] font-black uppercase opacity-40 px-2 mb-2 tracking-widest">{c}</div>
                 {games.filter(g => g.console === c).map(g => <Button key={g.id} variant="ghost" onClick={() => setActiveGame(g)} className={`w-full justify-start h-10 rounded-xl text-[10px] font-bold uppercase transition-all ${activeGame?.id === g.id ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-emerald-500/10 hover:text-emerald-600'}`}>{g.title}</Button>)}
                 </div>
               ))}
            </div>
            <div className="flex-1 bg-black/90">
               {activeGame ? <iframe src={activeGame.url} className="w-full h-full border-0" allowFullScreen /> : <div className="flex-1 flex flex-col items-center justify-center h-full opacity-20 text-white"><Trophy className="h-20 w-20 mb-4 animate-pulse" /><h3 className="text-xl font-black uppercase italic">Arena Master</h3></div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
