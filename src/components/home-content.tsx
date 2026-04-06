
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, Laugh, Play, Gamepad2, X, Trophy, Download } from "lucide-react"
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
  const [isUnlocked, setIsUnlocked] = React.useState(false)
  
  const [gamesMenuOpen, setGamesMenuOpen] = React.useState(false)
  const [activeGame, setActiveGame] = React.useState<GameItem | null>(null)
  
  const isClosingRef = React.useRef(false)
  const lastOpenedIdRef = React.useRef<string | null>(null)
  
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
      
      const data = await getRemoteContent(false, queryStr, CATEGORIES.find(c => c.id === categoryId)?.genre || "");
      setContent(data);

      if (channelId && lastOpenedIdRef.current !== channelId) {
        const item = data.find(i => i.id === channelId);
        if (item) {
          lastOpenedIdRef.current = channelId;
          if (item.type === 'series' || item.type === 'multi-season') {
            setSelectedSeries(item);
          } else {
            setActiveVideo({ items: data, index: data.indexOf(item) });
          }
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

  const handleItemClick = (idx: number, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isClosingRef.current) return;
    const item = content[idx];
    const params = new URLSearchParams(window.location.search);
    params.set('id', item.id);
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const handleEpisodeClick = (series: ContentItem, ep: any, allEps: any[]) => {
    const sortedEps = [...allEps].sort((a, b) => a.number - b.number);
    const playList = sortedEps.map(item => ({
      id: `${series.id}_ep_${item.number}`,
      title: `${series.title} - EP ${item.number}`,
      streamUrl: item.streamUrl
    }));
    const idx = sortedEps.indexOf(ep);
    setActiveVideo({ items: playList, index: idx });
  };

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

  const handleCategoryClick = (cat: any, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isClosingRef.current) return;

    if (cat.special === 'games' || cat.restricted) {
      if (cat.special === 'games' && !user?.isGamesEnabled) { toast({ variant: "destructive", title: "GAMES BLOQUEADOS" }); return; }
      if (cat.restricted && !user?.isAdultEnabled) { toast({ variant: "destructive", title: "ADULTOS BLOQUEADOS" }); return; }
      
      if (!isUnlocked) { setUnlockTarget(cat.special === 'games' ? 'GAMES' : 'ADULT'); setIsPinOpen(true); }
      else { if (cat.special === 'games') setGamesMenuOpen(true); else setSelectedCat(cat.id); }
    } else { setSelectedCat(cat.id); }
  };

  const verifyGlobalPassword = async () => {
    setLoading(true);
    const settings = await getGlobalSettings();
    setLoading(false);
    if (pinInput === settings.parentalPin) {
      setIsUnlocked(true);
      if (unlockTarget === 'ADULT') setSelectedCat('ADULT');
      else if (unlockTarget === 'GAMES') setGamesMenuOpen(true);
      setIsPinOpen(false);
      setPinInput("");
    } else { toast({ variant: "destructive", title: "SENHA INCORRETA" }); setPinInput(""); }
  };

  const closePlayer = () => {
    isClosingRef.current = true;
    lastOpenedIdRef.current = null;
    setActiveVideo(null);
    setSelectedSeries(null);
    const p = new URLSearchParams(window.location.search);
    p.delete('id');
    router.replace(`${window.location.pathname}?${p.toString()}`, { scroll: false });
    // Bloqueio de 2 segundos para evitar player fantasma
    setTimeout(() => { isClosingRef.current = false; }, 2000);
  };

  const closeRestrictedArea = () => {
    isClosingRef.current = true;
    setSelectedCat(null);
    setGamesMenuOpen(false);
    setActiveGame(null);
    setUnlockTarget(null);
    setPinInput("");
    setIsUnlocked(false); // SEGURANÇA VOLÁTIL: Reseta ao sair
    router.replace(`/user/home`);
    setTimeout(() => { isClosingRef.current = false; }, 2000);
  };

  if (loading && content.length === 0) return <div className="min-h-screen flex flex-col items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  const consolesList = Array.from(new Set(games.map(g => g.console))).sort();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 select-none">
      <header className="h-20 border-b border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {selectedCat || q ? (
            <button onClick={closeRestrictedArea} className="h-12 w-12 rounded-full bg-muted hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-sm"><ChevronLeft className="h-6 w-6" /></button>
          ) : (
            <div className="bg-primary p-2 rounded-2xl shadow-lg shadow-primary/20"><Tv className="h-6 w-6 text-white" /></div>
          )}
          <div className="hidden lg:block"><span className="text-xl font-black text-primary uppercase italic leading-none">Léo TV Stream</span></div>
        </div>
        <div className="flex-1 max-w-2xl mx-4"><VoiceSearch /></div>
        <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-muted-foreground"><LogOut className="h-5 w-5" /></Button>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={(e) => handleCategoryClick(c, e)} className="group relative h-48 rounded-3xl overflow-hidden border border-border hover:border-primary transition-all bg-card">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <div className={`p-4 rounded-2xl ${c.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><c.icon className="h-8 w-8" /></div>
                  <div className="text-center"><span className="text-base font-black uppercase tracking-tight text-foreground block">{c.name}</span><span className="bg-muted px-3 py-0.5 rounded-full text-[9px] font-bold text-muted-foreground uppercase mt-2 inline-block">{(catCounts[c.id] || 0).toLocaleString()} Itens</span></div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-300">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-foreground">{q ? `Busca: ${q.toUpperCase()}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {content.map((item, idx) => (
                <div key={item.id} onClick={(e) => handleItemClick(idx, e)} className="group relative aspect-[2/3] bg-card rounded-2xl overflow-hidden cursor-pointer border border-border hover:border-primary transition-all shadow-sm">
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-90 group-hover:opacity-100" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center bg-muted"><Tv className="h-10 w-10 opacity-20" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                    <h3 className="font-bold text-[11px] uppercase truncate text-white group-hover:text-primary">{item.title}</h3>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 truncate">{item.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!activeVideo || !!selectedSeries} onOpenChange={(val) => { if(!val) closePlayer(); }}>
        <DialogContent className="max-w-5xl bg-black border-border p-0 overflow-hidden rounded-3xl shadow-2xl">
          {activeVideo && <VideoPlayer key={`player-${activeVideo.items[activeVideo.index].id}`} url={activeVideo.items[activeVideo.index].streamUrl || ""} title={activeVideo.items[activeVideo.index].title} id={activeVideo.items[activeVideo.index].id} onNext={handleNext} onPrev={handlePrev} />}
          {selectedSeries && (
            <div className="p-8 bg-card max-h-[80vh] overflow-y-auto custom-scroll">
               <h3 className="text-xl font-black uppercase text-primary italic mb-6">Episódios: {selectedSeries.title}</h3>
               <div className="grid gap-2">
                  {selectedSeries.episodes?.sort((a,b) => a.number - b.number).map(ep => (
                    <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(selectedSeries, ep, selectedSeries.episodes!)} className="h-14 justify-start bg-muted rounded-xl border-border hover:border-primary px-6"><span className="font-black uppercase text-[10px]">EP {ep.number} - {ep.title}</span><Play className="ml-auto h-4 w-4 text-primary" /></Button>
                  ))}
                  {selectedSeries.seasons?.sort((a,b) => a.number - b.number).map(season => (
                    <div key={season.id} className="space-y-2 mb-4">
                      <p className="text-[10px] font-black text-primary uppercase pl-2 border-l-2 border-primary ml-2">Temporada {season.number}</p>
                      {season.episodes.sort((a,b) => a.number - b.number).map(ep => (
                        <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(selectedSeries, ep, season.episodes)} className="w-full h-12 justify-start bg-muted border-border hover:border-primary px-6 rounded-xl"><span className="font-bold uppercase text-[9px]">EP {ep.number} - {ep.title}</span><Play className="ml-auto h-3 w-3 text-primary" /></Button>
                      ))}
                    </div>
                  ))}
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={(val) => { if(!val) { setIsPinOpen(false); setPinInput(""); setUnlockTarget(null); } }}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-3xl p-10 text-center">
          <Lock className="h-12 w-12 text-primary mx-auto mb-6" />
          <div className="text-xl font-black uppercase italic text-foreground mb-4">Área Restrita Master</div>
          <input type="password" title="Senha Parental" maxLength={4} className="h-16 w-48 bg-muted border-border text-center text-3xl font-black tracking-[0.5em] rounded-2xl outline-none border focus:border-primary mb-6" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyGlobalPassword()} autoFocus />
          <Button onClick={verifyGlobalPassword} disabled={loading} className="w-full h-14 bg-primary text-sm font-black uppercase rounded-2xl">{loading ? <Loader2 className="animate-spin" /> : 'DESBLOQUEAR'}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={gamesMenuOpen} onOpenChange={(val) => { if(!val) { closeRestrictedArea(); } }}>
        <DialogContent className="max-w-[90vw] w-full h-[85vh] bg-card border-border rounded-[2.5rem] p-0 overflow-hidden flex flex-col">
          <div className="h-16 bg-emerald-600/10 border-b border-border px-8 flex items-center justify-between">
            <div className="flex items-center gap-3"><Gamepad2 className="h-6 w-6 text-emerald-600" /><h2 className="text-lg font-black uppercase italic text-emerald-600">Léo Games Arena</h2></div>
            <button onClick={closeRestrictedArea} className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <div className={`w-72 border-r border-border p-6 overflow-y-auto custom-scroll ${activeGame ? 'hidden lg:block' : 'block'}`}>
               <div className="space-y-6">
                  {consolesList.map(consoleName => (
                    <div key={consoleName} className="space-y-2">
                       <div className="text-[10px] font-black uppercase opacity-40 px-2">Console: {consoleName}</div>
                       <div className="grid gap-1">{games.filter(g => g.console === consoleName).map(game => (
                            <Button key={game.id} variant="ghost" onClick={() => setActiveGame(game)} className="justify-start h-10 hover:bg-emerald-600/10 hover:text-emerald-600 rounded-xl font-bold uppercase text-[10px] px-3">{game.title}</Button>
                          ))}</div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="flex-1 relative flex flex-col bg-muted/30">
               {activeGame ? (
                 <div className="flex-1 flex flex-col">
                    <div className="h-12 bg-card border-b border-border flex items-center justify-between px-6"><span className="text-[10px] font-black uppercase text-emerald-600">{activeGame.title}</span><Button size="sm" variant="ghost" onClick={() => setActiveGame(null)} className="h-8 text-[9px] font-black uppercase">Fechar Arena</Button></div>
                    {activeGame.type === 'embed' ? <iframe src={activeGame.url} className="flex-1 w-full border-0" allowFullScreen /> : <div className="flex-1 flex flex-col items-center justify-center p-10 text-center"><Download className="h-16 w-16 text-emerald-600 mb-6" /><h3 className="text-2xl font-black uppercase italic text-emerald-600">Download ROM</h3><Button className="bg-emerald-600 font-black uppercase rounded-xl h-12 px-10" onClick={() => window.open(activeGame.url, '_blank')}>BAIXAR AGORA</Button></div>}
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40"><Trophy className="h-16 w-16 text-emerald-600 mx-auto mb-6" /><h3 className="text-2xl font-black uppercase italic tracking-tight">Arena Retro Master</h3></div>
               )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
