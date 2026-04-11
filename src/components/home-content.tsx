"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, Gamepad2, X, Trophy, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, getRemoteGames, GameItem, getContentById } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'CANAIS AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'FILMES MASTER', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'SÉRIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SÉRIES' },
  { id: 'MUSICA', name: 'LÉO TV MUSICAS', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV MUSICAS' },
  { id: 'RADIO', name: 'LÉO TV RÁDIOS', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'KIDS', name: 'MUNDO INFANTIL', icon: Baby, color: 'bg-sky-500', genre: 'LÉO TV DESENHOS' },
  { id: 'DORAMAS', name: 'DORAMAS', icon: Sparkles, color: 'bg-indigo-400', genre: 'LÉO TV DORAMAS' },
  { id: 'NOVELAS', name: 'NOVELAS', icon: Heart, color: 'bg-red-500', genre: 'LÉO TV NOVELAS' },
  { id: 'GAMES', name: 'ARENA GAMES', icon: Gamepad2, color: 'bg-emerald-600', special: 'games' },
  { id: 'ADULT', name: 'ADULTOS', icon: Lock, color: 'bg-zinc-800', genre: 'LÉO TV ADULTOS', restricted: true },
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
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ""

  const loadData = React.useCallback(async (queryStr = "", categoryId: string | null = null) => {
    setLoading(true);
    try {
      const session = localStorage.getItem("user_session");
      if (!session) { router.push("/login"); return; }
      const currentUser = JSON.parse(session);
      setUser(currentUser);
      
      const categoryObj = CATEGORIES.find(c => c.id === categoryId);
      const genreToFilter = categoryObj?.genre || "";
      const data = await getRemoteContent(false, queryStr, genreToFilter);
      setContent(data);

      if (!categoryId && !queryStr) {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) { if (cat.genre) counts[cat.id] = await getCategoryCount(cat.genre); }
        setCatCounts(counts);
      }
      if (games.length === 0) setGames(await getRemoteGames());
    } catch (err) { } finally { setLoading(false); }
  }, [router, games.length]);

  React.useEffect(() => { loadData(q, selectedCat) }, [q, selectedCat, loadData]);

  const handleNext = () => {
    if (!activeVideo || activeVideo.items.length <= 1) return;
    setActiveVideo({ ...activeVideo, index: (activeVideo.index + 1) % activeVideo.items.length });
  };

  const handlePrev = () => {
    if (!activeVideo || activeVideo.items.length <= 1) return;
    setActiveVideo({ ...activeVideo, index: (activeVideo.index - 1 + activeVideo.items.length) % activeVideo.items.length });
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

  /**
   * UNIFICAÇÃO DE EPISÓDIOS v144
   * Junta episódios de temporadas e episódios avulsos em uma lista única e funcional.
   */
  const getEpisodes = (item: ContentItem) => {
    const directEps = Array.isArray(item.episodes) ? item.episodes : [];
    const seasonEps = Array.isArray(item.seasons) ? item.seasons.flatMap(s => Array.isArray(s.episodes) ? s.episodes : []) : [];
    const all = [...directEps, ...seasonEps];
    return all.sort((a, b) => a.number - b.number);
  };

  /**
   * BUSCA PROFUNDA DE SÉRIE
   * Ao clicar, busca o item completo no banco para garantir que episódios/seasons existam.
   */
  const openItem = async (item: ContentItem) => {
    if (item.type === 'multi-season' || item.type === 'series') {
      setLoading(true);
      const deepItem = await getContentById(item.id);
      setSelectedSeries(deepItem || item);
      setLoading(false);
    } else {
      setActiveVideo({ items: content, index: content.indexOf(item) });
    }
  };

  if (loading && content.length === 0) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-20 select-none">
      <header className="h-20 border-b border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {(selectedCat || q) && <button onClick={() => { setSelectedCat(null); router.replace('/user/home'); }} className="h-12 w-12 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><ChevronLeft className="h-6 w-6" /></button>}
          <span className="text-xl font-black text-primary uppercase italic">Léo TV Stream</span>
        </div>
        <div className="flex-1 max-w-2xl mx-4"><VoiceSearch /></div>
        <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12"><LogOut className="h-6 w-6" /></Button>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => {
                if (c.special === 'games' || c.restricted) {
                  if (c.special === 'games' && !user?.isGamesEnabled) return toast({ variant: "destructive", title: "ARENA BLOQUEADA" });
                  if (c.restricted && !user?.isAdultEnabled) return toast({ variant: "destructive", title: "CONTEÚDO BLOQUEADO" });
                  setUnlockTarget(c.id === 'GAMES' ? 'GAMES' : 'ADULT');
                  setIsPinOpen(true);
                } else setSelectedCat(c.id);
              }} className="group relative h-48 rounded-3xl overflow-hidden border border-border bg-card hover:border-primary transition-all shadow-sm">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className={`p-4 rounded-2xl ${c.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><c.icon className="h-8 w-8" /></div>
                  <span className="text-base font-black uppercase tracking-tight">{c.name}</span>
                  <span className="bg-muted px-3 py-0.5 rounded-full text-[9px] font-bold opacity-60">{(catCounts[c.id] || 0).toLocaleString()} Itens</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-2xl font-black uppercase italic text-primary">{q ? `Busca: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {content.map((item) => (
                <div key={item.id} onClick={() => openItem(item)} className="group relative aspect-[2/3] bg-card rounded-3xl overflow-hidden cursor-pointer border border-border hover:border-primary transition-all shadow-lg">
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center opacity-20"><Tv className="h-10 w-10" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-4 flex flex-col justify-end">
                    <h3 className="font-bold text-[11px] uppercase truncate text-white">{item.title}</h3>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 truncate">{item.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-screen-2xl bg-black p-0 border-0 rounded-none md:rounded-3xl overflow-hidden shadow-2xl">
          {activeVideo && <VideoPlayer url={activeVideo.items[activeVideo.index].streamUrl || ""} title={activeVideo.items[activeVideo.index].title} onNext={handleNext} onPrev={handlePrev} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSeries} onOpenChange={() => setSelectedSeries(null)}>
        <DialogContent className="max-w-2xl bg-card rounded-3xl p-8 overflow-hidden">
          {selectedSeries && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-xl font-black uppercase text-primary italic">{selectedSeries.title}</h3>
                <span className="text-[10px] font-bold opacity-40 uppercase">{getEpisodes(selectedSeries).length} Episódios</span>
              </div>
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scroll scrollbar-visible">
                {getEpisodes(selectedSeries).map(ep => (
                  <Button key={ep.id} variant="outline" onClick={() => setActiveVideo({ items: getEpisodes(selectedSeries), index: getEpisodes(selectedSeries).indexOf(ep) })} className="h-14 justify-start bg-muted rounded-2xl border-border px-6 hover:border-primary transition-all">
                    <span className="font-black uppercase text-[10px]">EP {ep.number} - {ep.title}</span>
                    <Play className="ml-auto h-4 w-4 text-primary" />
                  </Button>
                ))}
                {getEpisodes(selectedSeries).length === 0 && <div className="py-10 text-center opacity-20 uppercase font-black">Nenhum episódio disponível.</div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card rounded-3xl p-10 text-center">
          <Lock className="h-12 w-12 text-primary mx-auto mb-6" />
          <div className="text-xl font-black uppercase italic mb-4">Área Restrita Master</div>
          <input type="password" title="Senha" maxLength={4} className="h-16 w-48 bg-muted border-border text-center text-3xl font-black tracking-[0.5em] rounded-2xl outline-none focus:border-primary mb-6" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPassword()} />
          <Button onClick={verifyPassword} className="w-full h-14 bg-primary text-sm font-black uppercase rounded-2xl">DESBLOQUEAR</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={gamesMenuOpen} onOpenChange={() => setGamesMenuOpen(false)}>
        <DialogContent className="max-w-[90vw] w-full h-[85vh] bg-card rounded-[2.5rem] p-0 overflow-hidden flex flex-col">
          <div className="h-16 bg-emerald-600/10 border-b border-border px-8 flex items-center justify-between">
            <div className="flex items-center gap-3"><Gamepad2 className="h-6 w-6 text-emerald-600" /><h2 className="text-lg font-black uppercase text-emerald-600 italic">Léo Games Arena</h2></div>
            <button onClick={() => setGamesMenuOpen(false)} className="h-8 w-8 rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 border-r border-border p-6 overflow-y-auto bg-black/5 custom-scroll scrollbar-visible">
               {Array.from(new Set(games.map(g => g.console))).map(c => (
                 <div key={c} className="mb-6"><div className="text-[10px] font-black uppercase opacity-40 px-2 mb-2 tracking-widest">{c}</div>
                 {games.filter(g => g.console === c).map(g => <Button key={g.id} variant="ghost" onClick={() => setActiveGame(g)} className={`w-full justify-start h-10 rounded-xl text-[10px] font-bold uppercase ${activeGame?.id === g.id ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/10'}`}>{g.title}</Button>)}
                 </div>
               ))}
            </div>
            <div className="flex-1 bg-black/90">
               {activeGame ? <iframe src={activeGame.url} className="w-full h-full border-0" allowFullScreen /> : <div className="flex flex-col items-center justify-center h-full opacity-20 text-white"><Trophy className="h-20 w-20 mb-4 animate-pulse" /><h3 className="text-xl font-black uppercase italic">Escolha um Combatente</h3></div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}