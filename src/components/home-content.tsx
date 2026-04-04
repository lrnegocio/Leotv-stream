
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, MessageSquare, Laugh, Play, Bell, Gamepad2, X, Trophy, Swords, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, Episode, getGameRankings, GameRanking, updateGameScore, getWaitingPlayers, setUserSearchingMatch, validateDeviceLogin } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'LÉO TV AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'LÉO TV FILMES', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'LÉO TV SERIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SERIES' },
  { id: 'CLIPES', name: 'LÉO TV VIDEO CLIPES', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV VIDEO CLIPES' },
  { id: 'PIADAS', name: 'LÉO TV PIADAS', icon: Laugh, color: 'bg-yellow-400', genre: 'LÉO TV PIADAS' },
  { id: 'REELS', name: 'LÉO TV REELS', icon: Play, color: 'bg-pink-500', genre: 'LÉO TV REELS', restricted: true },
  { id: 'DORAMAS', name: 'LÉO TV DORAMAS', icon: Sparkles, color: 'bg-pink-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'LÉO TV DESENHOS', icon: Baby, color: 'bg-yellow-500', genre: 'LÉO TV DESENHOS' },
  { id: 'RADIO', name: 'LÉO TV RÁDIOS', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'NOVELAS', name: 'LÉO TV NOVELAS', icon: Heart, color: 'bg-orange-500', genre: 'LÉO TV NOVELAS' },
  { id: 'GAMES', name: 'ARENA GAMES RETRO', icon: Gamepad2, color: 'bg-emerald-600', special: 'games' },
  { id: 'ADULT', name: 'LÉO TV ADULTOS', icon: Lock, color: 'bg-red-600', genre: 'LÉO TV ADULTOS', restricted: true },
]

export const CONSOLES_LIBRARY = [
  { name: "PLAYSTATION (PS1/PSX/PS2)", icon: "🎮", games: [
    { name: "Resident Evil 3 Nemesis", url: "https://www.retrogames.cc/embed/41727-resident-evil-3-nemesis-usa.html" },
    { name: "Metal Gear Solid", url: "https://www.retrogames.cc/embed/41618-metal-gear-solid-usa.html" },
    { name: "Winning Eleven 2002", url: "https://www.retrogames.cc/embed/41618-winning-eleven-2002-japan.html" }
  ]},
  { name: "SUPER NINTENDO (SNES)", icon: "🔴", games: [
    { name: "Donkey Kong Country 1", url: "https://www.retrogames.cc/embed/18852-donkey-kong-country-usa.html" },
    { name: "Donkey Kong Country 2", url: "https://www.retrogames.cc/embed/18853-donkey-kong-country-2-diddy-s-kong-quest-usa.html" },
    { name: "Donkey Kong Country 3", url: "https://www.retrogames.cc/embed/18854-donkey-kong-country-3-dixie-kong-s-double-trouble-usa.html" },
    { name: "Mario Kart", url: "https://www.retrogames.cc/embed/17344-super-mario-kart-usa.html" },
    { name: "Top Gear 1", url: "https://www.retrogames.cc/embed/17441-top-gear-usa.html" },
    { name: "Mortal Kombat Ultimate", url: "https://www.retrogames.cc/embed/17462-ultimate-mortal-kombat-3-usa.html" }
  ]},
  { name: "ARCADE / MAME", icon: "🥊", games: [
    { name: "The King of Fighters 2002", url: "https://www.retrogames.cc/embed/42614-the-king-of-fighters-2002-magic-plus-ii-bootleg.html" },
    { name: "Marvel vs Capcom", url: "https://www.retrogames.cc/embed/9264-marvel-vs-capcom-clash-of-super-heroes-usa-980123.html" }
  ]},
  { name: "CLÁSSICOS & IA (ARENA)", icon: "♟️", games: [
    { name: "Damas Brasileira (IA 1-20)", url: "https://www.playok.com/pt/damas/" },
    { name: "Xadrez Master", url: "https://www.sparkchess.com/play-chess-online.html" },
    { name: "Sinuca 8 Ball", url: "https://games.atribuna.com.br/jogos/8ballpool/" },
    { name: "Dominó Online", url: "https://www.coolmathgames.com/0-dominoes" },
    { name: "Snake Retro", url: "https://www.google.com/search?q=play+snake" }
  ]}
]

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<{ items: ContentItem[], index: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null)
  const [isPinOpen, setIsPinOpen] = React.useState(false)
  const [pinInput, setPinInput] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [unlockTarget, setUnlockTarget] = React.useState<'ADULT' | 'GAMES' | null>(null)
  
  const [gamesMenuOpen, setGamesMenuOpen] = React.useState(false)
  const [activeGame, setActiveGame] = React.useState<{name: string, url: string} | null>(null)
  const [gameRankings, setGameRankings] = React.useState<GameRanking[]>([])
  const [waitingPlayers, setWaitingPlayers] = React.useState<User[]>([])
  const [iaLevel, setIaLevel] = React.useState(5)
  const [searchingOpponent, setSearchingOpponent] = React.useState(false)
  const [opponent, setOpponent] = React.useState<{pin: string, rank: number} | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ""
  const channelId = searchParams.get('id') || ""

  const loadData = React.useCallback(async (queryStr = "", categoryId: string | null = null) => {
    setLoading(true);
    try {
      const session = localStorage.getItem("user_session");
      if (!session) { router.push("/login"); return; }
      const currentUser = JSON.parse(session);
      
      const fresh = await validateDeviceLogin(currentUser.pin, currentUser.deviceId || "web");
      if (!fresh.error && fresh.user) {
        setUser(fresh.user);
        localStorage.setItem("user_session", JSON.stringify(fresh.user));
      } else {
        setUser(currentUser);
      }

      const settings = await getGlobalSettings();
      setAnnouncement(settings.announcement || "");

      const targetGenre = categoryId ? CATEGORIES.find(c => c.id === categoryId)?.genre : "";
      const data = await getRemoteContent(false, queryStr, targetGenre);
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

      const ranks = await getGameRankings();
      setGameRankings(ranks);
      const waiting = await getWaitingPlayers();
      setWaitingPlayers(waiting);

    } catch (err) { } finally { setLoading(false); }
  }, [router, channelId]);

  React.useEffect(() => { loadData(q, selectedCat) }, [q, selectedCat, loadData]);

  const handleItemClick = (idx: number) => {
    const item = content[idx];
    const params = new URLSearchParams(window.location.search);
    params.set('id', item.id);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    if (item.type === 'series' || item.type === 'multi-season') setSelectedSeries(item);
    else setActiveVideo({ items: content, index: idx });
  };

  const handleCategoryClick = async (cat: any) => {
    setPinInput(""); // GARANTE QUE O CAMPO ESTEJA SEMPRE VAZIO AO CLICAR
    
    if (cat.special === 'games') {
      if (!user?.isGamesEnabled) {
        toast({ variant: "destructive", title: "ACESSO BLOQUEADO", description: "Fale com o Mestre Léo para liberar a Arena." });
        return;
      }
      setUnlockTarget('GAMES');
      setIsPinOpen(true);
      return;
    }
    
    if (cat.restricted) {
      if (!user?.isAdultEnabled) {
        toast({ variant: "destructive", title: "ACESSO BLOQUEADO", description: "Canais restritos desativados para este PIN." });
        return;
      }
      setUnlockTarget('ADULT');
      setIsPinOpen(true);
    } else {
      setSelectedCat(cat.id);
    }
  };

  const verifyGlobalPassword = async () => {
    setLoading(true);
    const settings = await getGlobalSettings();
    setLoading(false);
    
    if (pinInput === settings.parentalPin) {
      if (unlockTarget === 'ADULT') {
        setSelectedCat('ADULT');
      } else if (unlockTarget === 'GAMES') {
        setGamesMenuOpen(true);
      }
      setIsPinOpen(false);
      setPinInput(""); // LIMPA APÓS SUCESSO
      setUnlockTarget(null);
    } else {
      toast({ variant: "destructive", title: "SENHA INVÁLIDA", description: "O acesso foi recusado pelo sistema." });
      setPinInput(""); // LIMPA APÓS ERRO
    }
  }

  const startMatch = async (game: {name: string, url: string}) => {
    setSearchingOpponent(true);
    if (user) await setUserSearchingMatch(user.pin, true);
    setTimeout(async () => {
      const waiting = await getWaitingPlayers();
      const possible = waiting.filter(w => w.pin !== user?.pin);
      if (possible.length > 0) {
        setOpponent({ pin: possible[0].pin, rank: gameRankings.findIndex(r => r.pin === possible[0].pin) + 1 || 99 });
      } else {
        setOpponent({ pin: `IA LÉO TV (NÍVEL ${iaLevel})`, rank: 1 });
      }
      setActiveGame(game);
      setSearchingOpponent(false);
    }, 2000);
  };

  const finishGame = async (res: 'win' | 'draw' | 'loss') => {
    if (user) {
      await updateGameScore(user.pin, res);
      await setUserSearchingMatch(user.pin, false);
      const ranks = await getGameRankings();
      setGameRankings(ranks);
    }
    setActiveGame(null);
    setOpponent(null);
  };

  if (loading && content.length === 0) return <div className="min-h-screen flex flex-col items-center justify-center bg-cinematic"><Loader2 className="h-16 w-16 animate-spin text-primary" /><p className="text-[10px] font-black uppercase text-primary tracking-widest mt-4">Sincronizando Sistema Master Léo TV...</p></div>;

  return (
    <div className="min-h-screen bg-cinematic text-foreground pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {selectedCat || q ? (
            <Button variant="ghost" onClick={() => { setSelectedCat(null); router.replace("/user/home"); }} className="h-14 w-14 rounded-full bg-white/5 hover:bg-primary transition-all"><ChevronLeft className="h-8 w-8 text-white" /></Button>
          ) : <div className="bg-primary p-2.5 rounded-2xl rotate-2 shadow-lg shadow-primary/20"><Tv className="h-7 w-7 text-white" /></div>}
          <div className="hidden lg:block"><span className="text-2xl font-black text-primary uppercase italic tracking-tighter block leading-none">LÉO TV MASTER</span><span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Sinais Unificados v5400.0</span></div>
        </div>
        <div className="flex-1 max-w-xl mx-4"><VoiceSearch /></div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-full hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-8 mt-6 space-y-4">
        {waitingPlayers.length > 0 && user && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-3xl flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500 p-2 rounded-xl"><Swords className="h-5 w-5 text-white" /></div>
              <p className="text-[11px] font-black uppercase text-emerald-500 tracking-widest italic">ARENA ALERTA: {waitingPlayers.length} GUERREIRO(S) ESPERANDO COMBATE!</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleCategoryClick({ special: 'games' })} className="text-emerald-500 font-black uppercase text-[10px]">ACEITAR DESAFIO</Button>
          </div>
        )}
        {announcement && !selectedCat && !q && (
          <div className="bg-primary/10 border border-primary/30 p-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
            <div className="bg-primary p-2 rounded-xl"><MessageSquare className="h-5 w-5 text-white" /></div>
            <p className="text-[11px] font-black uppercase text-primary tracking-widest italic">{announcement}</p>
          </div>
        )}
        {user?.individualMessage && !selectedCat && !q && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-3xl flex items-center gap-4">
            <div className="bg-emerald-500 p-2 rounded-xl"><Bell className="h-5 w-5 text-white" /></div>
            <p className="text-[11px] font-black uppercase text-emerald-500 tracking-widest italic">NOTIFICAÇÃO VIP: {user.individualMessage}</p>
          </div>
        )}
      </div>

      <main className="p-8 max-w-[1800px] mx-auto">
        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {CATEGORIES.map(c => {
              const count = catCounts[c.id] || 0;
              return (
                <button key={c.id} onClick={() => handleCategoryClick(c)} className={`group relative h-56 rounded-[2.5rem] overflow-hidden border-2 border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl ${c.color} bg-opacity-20`}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                    <div className={`p-4 rounded-3xl ${c.color} text-white shadow-xl group-hover:rotate-12 transition-transform`}><c.icon className="h-10 w-10" /></div>
                    <div className="text-center"><span className="text-lg font-black uppercase italic text-white block">{c.name}</span>{count > 0 && <span className="bg-black/40 px-3 py-1 rounded-full text-[9px] font-black text-primary border border-primary/20 uppercase mt-2 inline-block">{count.toLocaleString()} SINAIS</span>}</div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-6"><h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{q ? `BUSCANDO: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2></div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {content.map((item, idx) => (
                <div key={item.id} onClick={() => handleItemClick(idx)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl">
                  {item.imageUrl ? <Image src={item.imageUrl} alt="Capa" fill className="object-cover opacity-80 group-hover:opacity-100" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center bg-primary/10"><Tv className="h-12 w-12 text-primary opacity-20" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end"><h3 className="font-black text-[12px] uppercase italic truncate text-white group-hover:text-primary leading-tight">{item.title}</h3></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={gamesMenuOpen} onOpenChange={(val) => { if(!val) { setGamesMenuOpen(false); if(user) setUserSearchingMatch(user.pin, false); } }}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none flex flex-col">
          <div className="h-20 bg-emerald-600/20 border-b border-white/5 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4"><Gamepad2 className="h-8 w-8 text-emerald-500" /><h2 className="text-2xl font-black uppercase italic text-emerald-500 tracking-tighter">Léo Arena Multiplayer</h2></div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5"><Trophy className="h-4 w-4 text-yellow-500" /><span className="text-[10px] font-black uppercase text-yellow-500">Rank: #{gameRankings.findIndex(r => r.pin === user?.pin) + 1 || '--'} | {user?.gamePoints || 0} Pts</span></div>
               <Button variant="ghost" onClick={() => { setActiveGame(null); if(!activeGame) setGamesMenuOpen(false); if(user) setUserSearchingMatch(user.pin, false); }} className="rounded-full hover:bg-red-500/20 text-red-500"><X className="h-6 w-6" /></Button>
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden bg-black/40">
            <div className={`w-80 border-r border-white/5 p-6 overflow-y-auto custom-scroll ${activeGame ? 'hidden lg:block' : 'block'}`}>
               <div className="space-y-8">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                     <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-emerald-500" /><span className="text-[10px] font-black uppercase">IA Nível (1-20)</span></div>
                     <Slider value={[iaLevel]} min={1} max={20} step={1} onValueChange={v => setIaLevel(v[0])} />
                  </div>
                  {CONSOLES_LIBRARY.map(console => (
                    <div key={console.name} className="space-y-3">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40">{console.icon} {console.name}</div>
                       <div className="grid gap-2">
                          {console.games.map(game => (
                            <Button key={game.name} variant="outline" onClick={() => startMatch(game)} className="justify-start h-12 bg-white/5 border-white/5 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-xl font-bold uppercase text-[9px] px-4">{game.name}</Button>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="flex-1 relative flex flex-col">
               {activeGame ? (
                 <div className="flex-1 flex flex-col">
                    <div className="h-14 bg-black/60 flex items-center justify-between px-6 border-b border-white/5">
                       <div className="flex items-center gap-4"><span className="text-[10px] font-black uppercase text-primary">{user?.pin}</span><Swords className="h-4 w-4 text-white/20" /><span className="text-[10px] font-black uppercase text-emerald-500">{opponent?.pin}</span></div>
                       <div className="flex gap-2"><Button size="sm" onClick={() => finishGame('win')} className="bg-green-600 text-[8px] font-black h-8 uppercase">Venci</Button><Button size="sm" variant="destructive" onClick={() => finishGame('loss')} className="text-[8px] font-black h-8 uppercase">Perdi</Button></div>
                    </div>
                    <iframe src={activeGame.url} className="flex-1 w-full border-0" allowFullScreen />
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    {searchingOpponent ? <div className="space-y-6 animate-pulse"><Loader2 className="h-20 w-20 animate-spin text-emerald-500 mx-auto" /><h3 className="text-2xl font-black uppercase italic text-emerald-500">Buscando Guerreiros Online...</h3></div> : <div className="max-w-md space-y-8"><Trophy className="h-24 w-24 text-yellow-500 mx-auto mb-4" /><h3 className="text-4xl font-black uppercase italic tracking-tighter">Arena dos Melhores</h3><p className="text-xs font-bold uppercase opacity-40">Escolha um jogo para iniciar. O sistema enviará um alerta para todos os jogadores ativos!</p></div>}
                 </div>
               )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={(val) => { setIsPinOpen(val); if(!val) setPinInput(""); }}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic text-primary mb-6">Trava de Segurança Master</div>
          <input 
            type="password" 
            title="PIN" 
            maxLength={4} 
            autoComplete="new-password"
            className="h-20 w-56 bg-black/40 border-white/10 text-center text-4xl font-black tracking-[0.6em] rounded-3xl outline-none border-2 focus:border-primary mb-6" 
            value={pinInput} 
            onChange={e => setPinInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && verifyGlobalPassword()} 
            autoFocus 
          />
          <Button onClick={verifyGlobalPassword} disabled={loading} className="w-full h-16 bg-primary text-lg font-black uppercase rounded-3xl shadow-xl shadow-primary/20">
            {loading ? <Loader2 className="animate-spin" /> : 'DESBLOQUEAR ACESSO'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSeries} onOpenChange={(val) => { if(!val) setSelectedSeries(null); }}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none">
          {selectedSeries && (
            <div className="flex flex-col h-[85vh]">
              <div className="relative h-64 shrink-0">
                {selectedSeries.imageUrl && <Image src={selectedSeries.imageUrl} alt="Capa" fill className="object-cover" unoptimized />}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent p-10 flex flex-col justify-end"><div className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">{selectedSeries.title}</div></div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scroll scrollbar-visible">
                {selectedSeries.episodes && selectedSeries.episodes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedSeries.episodes.sort((a,b) => a.number - b.number).map((ep) => (
                      <Button key={ep.id} variant="outline" onClick={() => { const episodes = selectedSeries.episodes!.map(e => ({...selectedSeries, streamUrl: e.streamUrl, title: `${selectedSeries.title} - EP ${e.number}`, id: e.id})); setActiveVideo({ items: episodes, index: selectedSeries.episodes!.indexOf(ep) }); }} className="w-full h-16 justify-start bg-white/5 border-white/5 hover:border-primary rounded-2xl px-8 group transition-all"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary mr-6">{ep.number}</div><span className="font-black uppercase text-sm">EP {ep.number} - {ep.title}</span></Button>
                    ))}
                  </div>
                ) : selectedSeries.seasons?.map(season => (
                  <div key={season.id} className="space-y-3 mb-8 last:mb-0">
                    <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] pl-4 border-l-4 border-primary mb-4">Temporada {season.number}</h4>
                    <div className="flex flex-col gap-2">
                      {season.episodes.sort((a,b) => a.number - b.number).map(ep => (
                        <Button key={ep.id} variant="outline" onClick={() => { const eps = season.episodes.map(e => ({...selectedSeries, streamUrl: e.streamUrl, title: `${selectedSeries.title} - T${season.number} EP ${e.number}`, id: e.id})); setActiveVideo({ items: eps, index: season.episodes.indexOf(ep) }); }} className="w-full h-14 justify-start bg-white/5 border-white/5 hover:border-primary rounded-xl px-8 group transition-all"><div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center font-black text-[10px] text-primary mr-6">{ep.number}</div><span className="font-bold uppercase text-xs">EP {ep.number} - {ep.title}</span></Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeVideo} onOpenChange={(val) => { if(!val) { setActiveVideo(null); const p = new URLSearchParams(window.location.search); p.delete('id'); window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`); } }}>
        <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          {activeVideo && <VideoPlayer url={activeVideo.items[activeVideo.index].streamUrl || ""} title={activeVideo.items[activeVideo.index].title} id={activeVideo.items[activeVideo.index].id} onNext={() => setActiveVideo({...activeVideo, index: (activeVideo.index + 1) % activeVideo.items.length})} onPrev={() => setActiveVideo({...activeVideo, index: (activeVideo.index - 1 + activeVideo.items.length) % activeVideo.items.length})} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
