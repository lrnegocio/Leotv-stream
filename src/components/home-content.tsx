
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, Gamepad2, X, Trophy, Play, Video, Smile, Zap, Trophy as TrophyIcon, Headphones, Info, Copy, CheckCircle2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, getRemoteGames, GameItem, getContentById, formatMasterLink } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'CANAIS AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'FILMES MASTER', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'SÉRIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SÉRIES' },
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
  const [showAcesso, setShowAcesso] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [siteUrl, setSiteUrl] = React.useState('')
  const [isMounted, setIsMounted] = React.useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ""

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setSiteUrl(window.location.origin);
      const session = localStorage.getItem("user_session");
      if (session) {
        setUser(JSON.parse(session));
      } else {
        router.push("/login");
      }
    }
  }, [router]);

  const loadData = React.useCallback(async (queryStr = "", categoryId: string | null = null) => {
    if (!isMounted) return;
    setLoading(true);
    try {
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
  }, [games.length, isMounted]);

  React.useEffect(() => {
    if (isMounted) {
      loadData(q, selectedCat);
    }
  }, [q, selectedCat, loadData, isMounted]);

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

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "LINK COPIADO!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getEpisodes = (item: ContentItem) => {
    const directEps = Array.isArray(item.episodes) ? item.episodes : [];
    const seasons = Array.isArray(item.seasons) ? item.seasons : [];
    const seasonEps = seasons.flatMap(s => Array.isArray(s.episodes) ? s.episodes : []);
    const all = [...directEps, ...seasonEps];
    return all.sort((a, b) => a.number - b.number).map(ep => ({
      ...ep,
      streamUrl: formatMasterLink(ep.streamUrl)
    }));
  };

  const openItem = async (item: ContentItem) => {
    if (item.type === 'multi-season' || item.type === 'series') {
      setLoading(true);
      const deepItem = await getContentById(item.id);
      setSelectedSeries(deepItem || item);
      setLoading(false);
    } else {
      const idx = content.findIndex(i => i.id === item.id);
      if (idx === -1) return;
      const proxiedContent = content.map(i => ({
        ...i,
        streamUrl: formatMasterLink(i.streamUrl)
      }));
      setActiveVideo({ items: proxiedContent, index: idx });
    }
  };

  if (!isMounted) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 select-none">
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
              }} className="group relative h-44 rounded-[2.5rem] overflow-hidden border border-border bg-card hover:border-primary transition-all shadow-xl hover:shadow-primary/10">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className={`p-4 rounded-3xl ${c.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><c.icon className="h-8 w-8" /></div>
                  <span className="text-sm font-black uppercase tracking-widest">{c.name}</span>
                  <span className="bg-muted px-4 py-1 rounded-full text-[9px] font-black opacity-40">{(catCounts[c.id] || 0).toLocaleString()} Sinais</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black uppercase italic text-primary">{q ? `Busca: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : (
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
            )}
          </div>
        )}
      </main>

      <Dialog open={showAcesso} onOpenChange={setShowAcesso}>
        <DialogContent className="max-w-md bg-card rounded-[2.5rem] p-8 border-primary/10">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto bg-primary/10 p-4 rounded-3xl w-fit mb-2"><Zap className="h-8 w-8 text-primary" /></div>
            <DialogTitle className="text-2xl font-black uppercase italic text-primary">Acesso ao Sistema</DialogTitle>
            <p className="text-[10px] font-bold uppercase opacity-40 tracking-widest">Seu Link Oficial Léo TV</p>
          </DialogHeader>
          
          <div className="space-y-6 py-6 text-center">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase ml-2 opacity-60">Link de Streaming</label>
              <div className="flex gap-2">
                <input readOnly value={siteUrl} className="flex-1 bg-muted h-12 rounded-xl px-4 text-[10px] font-mono border-border outline-none text-center" />
                <Button onClick={() => copyToClipboard(siteUrl)} className="h-12 rounded-xl bg-primary">{copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</Button>
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4">
              <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto"><Smartphone className="h-6 w-6 text-primary" /></div>
              <h4 className="text-xs font-black uppercase italic text-primary">Dica de Instalação</h4>
              <p className="text-[10px] font-bold uppercase leading-relaxed opacity-70">
                Ao abrir o link acima, clique nos 3 pontos do navegador e selecione <span className="text-primary">"Adicionar à Tela Inicial"</span>. O Léo TV funcionará como um Aplicativo nativo em seu aparelho!
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAcesso(false)} className="w-full h-14 bg-primary rounded-2xl font-black uppercase shadow-xl shadow-primary/20">VOLTAR AO STREAMING</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-5xl bg-black p-0 border-0 rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl">
          {activeVideo && activeVideo.items[activeVideo.index] && (
            <VideoPlayer 
              url={activeVideo.items[activeVideo.index].streamUrl} 
              title={activeVideo.items[activeVideo.index].title} 
              onNext={handleNext} 
              onPrev={handlePrev} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSeries} onOpenChange={() => setSelectedSeries(null)}>
        <DialogContent className="max-w-2xl bg-card rounded-[2.5rem] p-8 overflow-hidden">
          {selectedSeries && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-2xl font-black uppercase text-primary italic">{selectedSeries.title}</h3>
                <span className="text-[10px] font-black opacity-40 uppercase bg-muted px-4 py-1 rounded-full">{getEpisodes(selectedSeries).length} Episódios</span>
              </div>
              <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scroll scrollbar-visible">
                {getEpisodes(selectedSeries).map(ep => (
                  <Button key={ep.id} variant="outline" onClick={() => setActiveVideo({ items: getEpisodes(selectedSeries), index: getEpisodes(selectedSeries).indexOf(ep) })} className="h-16 justify-start bg-muted rounded-2xl border-border px-6 hover:border-primary transition-all group">
                    <span className="font-black uppercase text-xs">EP {ep.number} - {ep.title || 'Sem Título'}</span>
                    <Play className="ml-auto h-5 w-5 text-primary group-hover:scale-125 transition-transform" />
                  </Button>
                ))}
                {getEpisodes(selectedSeries).length === 0 && <div className="py-20 text-center opacity-20 uppercase font-black">Nenhum episódio localizado.</div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card rounded-[2.5rem] p-10 text-center">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic mb-4 text-primary">Sinal Restrito</div>
          <p className="text-[10px] font-black uppercase opacity-40 mb-6 tracking-widest">Digite a Senha de 4 Dígitos do Mestre</p>
          <input type="password" title="Senha" maxLength={4} className="h-20 w-56 bg-muted border-border text-center text-4xl font-black tracking-[0.5em] rounded-3xl outline-none focus:border-primary mb-8 shadow-inner" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPassword()} />
          <Button onClick={verifyPassword} className="w-full h-16 bg-primary text-sm font-black uppercase rounded-2xl shadow-xl shadow-primary/20">LIBERAR AGORA</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={gamesMenuOpen} onOpenChange={setGamesMenuOpen}>
        <DialogContent className="max-w-[90vw] w-full h-[85vh] bg-card rounded-[3rem] p-0 overflow-hidden flex flex-col border-emerald-500/20">
          <div className="h-20 bg-emerald-600/10 border-b border-border px-10 flex items-center justify-between">
            <div className="flex items-center gap-4"><Gamepad2 className="h-8 w-8 text-emerald-600" /><h2 className="text-2xl font-black uppercase text-emerald-600 italic">Léo Games Arena</h2></div>
            <button onClick={() => setGamesMenuOpen(false)} className="h-10 w-10 rounded-full hover:bg-muted transition-all flex items-center justify-center"><X className="h-6 w-6" /></button>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <div className="w-80 border-r border-border p-8 overflow-y-auto bg-black/5 custom-scroll scrollbar-visible">
               {Array.from(new Set(games.map(g => g.console))).map(c => (
                 <div key={c} className="mb-8"><div className="text-[11px] font-black uppercase opacity-40 px-3 mb-3 tracking-widest text-emerald-600">{c}</div>
                 {games.filter(g => g.console === c).map(g => <Button key={g.id} variant="ghost" onClick={() => setActiveGame(g)} className={`w-full justify-start h-12 rounded-xl text-[11px] font-black uppercase mb-1 transition-all ${activeGame?.id === g.id ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-emerald-500/10'}`}>{g.title}</Button>)}
                 </div>
               ))}
            </div>
            <div className="flex-1 bg-black/95 relative">
               {activeGame ? <iframe src={activeGame.url} className="w-full h-full border-0" allowFullScreen /> : <div className="flex flex-col items-center justify-center h-full opacity-30 text-white text-center p-10"><Trophy className="h-32 w-32 mb-6 animate-bounce" /><h3 className="text-3xl font-black uppercase italic">Escolha um Jogo para Iniciar o Combate</h3><p className="text-xs uppercase font-bold mt-4 tracking-widest">Arena Master Léo TV v2.0</p></div>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
