
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, Gamepad2, X, Trophy, Play, Video, Smile, Zap, Trophy as TrophyIcon, Headphones, Info, Copy, PlayCircle, ExternalLink, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, getRemoteGames, GameItem, getContentById, formatMasterLink, Episode } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'CANAIS AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'FILMES MASTER', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'SÉRIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SÉRIES' },
  { id: 'PPV', name: 'PAY PER VIEW', icon: Zap, color: 'bg-orange-500', genre: 'LÉO TV PAY PER VIEW', specialAccess: 'isPpvEnabled' },
  { id: 'ALACARTE', name: 'ALACARTES', icon: Star, color: 'bg-blue-600', genre: 'LÉO TV ALACARTES', specialAccess: 'isAlacarteEnabled' },
  { id: 'ESPORTES', name: 'LÉO TV ESPORTES', icon: TrophyIcon, color: 'bg-orange-600', genre: 'LÉO TV ESPORTES' },
  { id: 'MUSICAS', name: 'LÉO TV MÚSICAS', icon: Headphones, color: 'bg-indigo-500', genre: 'LÉO TV MUSICAS' },
  { id: 'CLIPES', name: 'LÉO TV VÍDEO CLIPES', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV VÍDEO CLIPES' },
  { id: 'PIADAS', name: 'LÉO TV PIADAS', icon: Smile, color: 'bg-yellow-500', genre: 'LÉO TV PIADAS' },
  { id: 'REELS', name: 'LÉO TV REELS', icon: Video, color: 'bg-cyan-500', genre: 'LÉO TV REELS' },
  { id: 'NOVELAS', name: 'NOVELAS', icon: Heart, color: 'bg-red-500', genre: 'LÉO TV NOVELAS' },
  { id: 'DORAMAS', name: 'DORAMAS', icon: Sparkles, color: 'bg-indigo-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'MUNDO INFANTIL', icon: Baby, color: 'bg-sky-500', genre: 'LÉO TV DESENHOS' },
  { id: 'RADIO', name: 'LÉO TV RÁDIOS', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'GAMES', name: 'ARENA GAMES', icon: Gamepad2, color: 'bg-emerald-600', special: 'games' },
  { id: 'ADULT', name: 'ADULTOS', icon: Lock, color: 'bg-zinc-800', genre: 'LÉO TV ADULTOS', restricted: true },
]

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [games, setGames] = React.useState<GameItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [settings, setSettings] = React.useState<any>(null)
  const [activeVideo, setActiveVideo] = React.useState<{ items: any[], index: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null)
  const [isPinOpen, setIsPinOpen] = React.useState(false)
  const [pinInput, setPinInput] = React.useState("")
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [unlockTarget, setUnlockTarget] = React.useState<'ADULT' | 'GAMES' | 'ITEM' | string | null>(null)
  const [unlockTargetItem, setUnlockTargetItem] = React.useState<ContentItem | null>(null)
  const [gamesMenuOpen, setGamesMenuOpen] = React.useState(false)
  const [activeGame, setActiveGame] = React.useState<GameItem | null>(null)
  const [showAcesso, setShowAcesso] = React.useState(false)
  const [siteUrl, setSiteUrl] = React.useState('')
  const [isMounted, setIsMounted] = React.useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams ? (searchParams.get('q') || "") : ""

  const loadData = React.useCallback(async (queryStr = "", categoryId: string | null = null) => {
    try {
      const currentSettings = await getGlobalSettings();
      setSettings(currentSettings);
      const categoryObj = CATEGORIES.find(c => c.id === categoryId);
      const genreToFilter = categoryObj?.genre || "";
      const data = await getRemoteContent(false, queryStr, genreToFilter);
      setContent(data);
      if (!categoryId && !queryStr) {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) { if (cat.genre) counts[cat.id] = await getCategoryCount(cat.genre); }
        setCatCounts(counts);
      }
      const remoteGames = await getRemoteGames();
      setGames(remoteGames);
    } catch (err) { } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    setTimeout(() => setLoading(false), 1500);
    if (typeof window !== 'undefined') {
      try {
        setSiteUrl(window.location.origin);
        const session = localStorage.getItem("user_session");
        if (session) setUser(JSON.parse(session));
        else router.push("/login");
      } catch (e) { router.push("/login"); }
    }
  }, [router]);

  React.useEffect(() => {
    if (!isMounted) return;
    const delayDebounceFn = setTimeout(() => loadData(q, selectedCat), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [q, selectedCat, loadData, isMounted]);

  const verifyPassword = async () => {
    try {
      const globalSettings = await getGlobalSettings();
      if (pinInput === globalSettings.parentalPin) {
        if (unlockTarget === 'ITEM' && unlockTargetItem) {
          openItem(unlockTargetItem, true);
          setUnlockTargetItem(null);
        } else if (unlockTarget === 'GAMES') {
          setGamesMenuOpen(true);
        } else if (unlockTarget) {
          setSelectedCat(unlockTarget);
        }
        setIsPinOpen(false);
        setPinInput("");
        setUnlockTarget(null);
      } else {
        toast({ variant: "destructive", title: "SENHA INCORRETA" });
        setPinInput("");
      }
    } catch (e) { toast({ variant: "destructive", title: "ERRO DE SEGURANÇA" }); }
  };

  const openItem = async (item: ContentItem, bypassPin = false) => {
    if (!item) return;
    if (!bypassPin && item.isRestricted) {
      setUnlockTarget('ITEM');
      setUnlockTargetItem(item);
      setIsPinOpen(true);
      return;
    }
    if (item.type === 'multi-season' || item.type === 'series') {
      setLoading(true);
      try {
        const deepItem = await getContentById(item.id);
        setSelectedSeries(deepItem || item);
      } catch (e) { setSelectedSeries(item); } finally { setLoading(false); }
    } else {
      const idx = content.findIndex(i => i.id === item.id);
      const list = content.length > 0 ? content.map(i => ({ ...i, streamUrl: formatMasterLink(i.streamUrl) })) : [{ ...item, streamUrl: formatMasterLink(item.streamUrl) }];
      setActiveVideo({ items: list, index: idx !== -1 ? idx : 0 });
    }
  };

  const handleCategoryClick = (cat: any) => {
    if (cat.specialAccess && user) {
      if (!(user as any)[cat.specialAccess]) return toast({ variant: "destructive", title: "ACESSO NÃO CONTRATADO", description: "Fale com seu revendedor." });
      setSelectedCat(cat.id);
      return;
    }
    if (cat.special === 'games' || cat.restricted) {
      if (cat.special === 'games' && !user?.isGamesEnabled) return toast({ variant: "destructive", title: "ARENA BLOQUEADA" });
      if (cat.restricted && !user?.isAdultEnabled) return toast({ variant: "destructive", title: "CONTEÚDO BLOQUEADO" });
      setUnlockTarget(cat.id);
      setIsPinOpen(true);
    } else setSelectedCat(cat.id);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background pb-20 select-none">
      {loading && (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando v319...</p>
        </div>
      )}

      <header className="h-20 border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {(selectedCat || q) && <button onClick={() => { setSelectedCat(null); router.replace('/user/home'); }} className="h-12 w-12 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all"><ChevronLeft className="h-6 w-6" /></button>}
          <span className="text-xl font-black text-primary uppercase italic tracking-tighter">Léo TV Stream</span>
        </div>
        <div className="flex-1 max-w-xl mx-4"><VoiceSearch /></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowAcesso(true)} className="h-12 w-12 rounded-2xl border-primary/20 text-primary hover:bg-primary/10 transition-all"><Info className="h-6 w-6" /></Button>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-2xl hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        {!selectedCat && !q && settings?.bannerUrl && (
          <div className="mb-8 w-full group relative cursor-pointer" onClick={() => settings.bannerLink && window.open(settings.bannerLink, '_blank')}>
             <div className="relative aspect-[4/1] w-full rounded-[2rem] overflow-hidden border-4 border-primary/10 shadow-2xl transition-transform hover:scale-[1.01]">
                <Image src={settings.bannerUrl} alt="Banner" fill className="object-cover" unoptimized />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2"><Zap className="h-3 w-3 text-amber-400 animate-pulse" /><span className="text-[8px] font-black uppercase text-white tracking-widest">Publicidade Soberana</span></div>
             </div>
          </div>
        )}

        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CATEGORIES.map(c => {
              const isVisible = !c.specialAccess || (user && (user as any)[c.specialAccess]);
              if (!isVisible) return null;

              return (
                <button key={c.id} onClick={() => handleCategoryClick(c)} className="group relative h-44 rounded-[2.5rem] overflow-hidden border border-border bg-card hover:border-primary transition-all shadow-xl">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className={`p-4 rounded-3xl ${c.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><c.icon className="h-8 w-8" /></div>
                    <span className="text-sm font-black uppercase tracking-widest">{c.name}</span>
                    <span className="bg-muted px-4 py-1 rounded-full text-[9px] font-black opacity-40">{(catCounts[c.id] || 0).toLocaleString()} Sinais</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black uppercase italic text-primary">{q ? `Busca: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {content.map((item) => (
                <div key={item.id} onClick={() => openItem(item)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-border hover:border-primary transition-all shadow-2xl">
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center opacity-20"><Tv className="h-12 w-12" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-5 flex flex-col justify-end">
                    <h3 className="font-black text-xs uppercase truncate text-white leading-tight">{item.title}</h3>
                    <p className="text-[9px] font-bold text-primary uppercase mt-1 truncate">{item.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card rounded-[2.5rem] p-10 text-center shadow-2xl">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic mb-4 text-primary">Sinal Restrito</div>
          <p className="text-[10px] font-black uppercase opacity-40 mb-6 tracking-widest">Digite a Senha Parental</p>
          <input type="password" title="Senha" maxLength={4} className="h-20 w-56 bg-muted border-border text-center text-4xl font-black tracking-[0.5em] rounded-3xl outline-none focus:border-primary mb-8" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPassword()} />
          <Button onClick={verifyPassword} className="w-full h-16 bg-primary text-sm font-black uppercase rounded-2xl shadow-xl shadow-primary/20">LIBERAR AGORA</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-5xl bg-black p-0 border-0 rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl">
          {activeVideo && activeVideo.items[activeVideo.index] && <VideoPlayer url={activeVideo.items[activeVideo.index].streamUrl} title={activeVideo.items[activeVideo.index].title} onNext={() => activeVideo.index < activeVideo.items.length - 1 && setActiveVideo({...activeVideo, index: activeVideo.index + 1})} onPrev={() => activeVideo.index > 0 && setActiveVideo({...activeVideo, index: activeVideo.index - 1})} />}
        </DialogContent>
      </Dialog>

      <Dialog open={gamesMenuOpen} onOpenChange={setGamesMenuOpen}>
        <DialogContent className="max-w-[90vw] w-full h-[85vh] bg-card rounded-[3rem] p-0 overflow-hidden flex flex-col border-emerald-500/20">
          <div className="h-20 bg-emerald-600/10 border-b border-border px-10 flex items-center justify-between"><div className="flex items-center gap-4"><Gamepad2 className="h-8 w-8 text-emerald-600" /><h2 className="text-2xl font-black uppercase text-emerald-600 italic">Léo Games Arena</h2></div><button onClick={() => setGamesMenuOpen(false)} className="h-10 w-10 rounded-full hover:bg-muted transition-all flex items-center justify-center"><X className="h-6 w-6" /></button></div>
          <div className="flex-1 flex overflow-hidden">
            <div className="w-80 border-r border-border p-8 overflow-y-auto bg-black/5 custom-scroll scrollbar-visible">
               {Array.from(new Set(games.map(g => g.console))).map(c => (
                 <div key={c} className="mb-8"><div className="text-[11px] font-black uppercase opacity-40 px-3 mb-3 tracking-widest text-emerald-600">{c}</div>{games.filter(g => g.console === c).map(g => <Button key={g.id} variant="ghost" onClick={() => setActiveGame(g)} className={`w-full justify-start h-12 rounded-xl text-[11px] font-black uppercase mb-1 transition-all ${activeGame?.id === g.id ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-emerald-500/10'}`}>{g.title}</Button>)}</div>
               ))}
            </div>
            <div className="flex-1 bg-black/95 relative">{activeGame ? <iframe src={activeGame.url} className="w-full h-full border-0" allowFullScreen /> : <div className="flex flex-col items-center justify-center h-full opacity-30 text-white text-center p-10"><Trophy className="h-32 w-32 mb-6 animate-bounce" /><h3 className="text-3xl font-black uppercase italic">Escolha um Jogo Master</h3></div>}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
