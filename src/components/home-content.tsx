
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, MessageSquare, Laugh, Play, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, Episode } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'LÉO TV AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'LÉO TV FILMES', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'LÉO TV SERIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SERIES' },
  { id: 'PIADAS', name: 'LÉO TV PIADAS', icon: Laugh, color: 'bg-yellow-400', genre: 'LÉO TV PIADAS' },
  { id: 'REELS', name: 'LÉO TV REELS', icon: Play, color: 'bg-pink-500', genre: 'LÉO TV REELS', restricted: true },
  { id: 'DORAMAS', name: 'LÉO TV DORAMAS', icon: Sparkles, color: 'bg-pink-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'LÉO TV DESENHOS', icon: Baby, color: 'bg-yellow-500', genre: 'LÉO TV DESENHOS' },
  { id: 'CLIPS', name: 'LÉO TV VÍDEO CLIPES', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV VÍDEO CLIPES' },
  { id: 'MUSIC', name: 'LÉO TV MUSICAS', icon: Music, color: 'bg-indigo-500', genre: 'LÉO TV MUSICAS' },
  { id: 'RADIO', name: 'LÉO TV RÁDIOS', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'NOVELAS', name: 'LÉO TV NOVELAS', icon: Heart, color: 'bg-orange-500', genre: 'LÉO TV NOVELAS' },
  { id: 'ADULT', name: 'LÉO TV ADULTOS', icon: Lock, color: 'bg-red-600', genre: 'LÉO TV ADULTOS', restricted: true },
]

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<{ items: ContentItem[], index: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null)
  const [isPinOpen, setIsPinOpen] = React.useState(false)
  const [pinInput, setPinInput] = React.useState("")
  const [parentalPin, setParentalPin] = React.useState("1234")
  const [announcement, setAnnouncement] = React.useState("")
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [pendingCategory, setPendingCategory] = React.useState<string | null>(null)
  
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

      const settings = await getGlobalSettings();
      setParentalPin(settings.parentalPin || "1234");
      setAnnouncement(settings.announcement || "");

      const targetGenre = categoryId ? CATEGORIES.find(c => c.id === categoryId)?.genre : "";
      const data = await getRemoteContent(false, queryStr, targetGenre);
      
      const filtered = data.filter(item => !!item.streamUrl || (item.type === 'series' && item.episodes?.length) || (item.type === 'multi-season' && item.seasons?.length));
      setContent(filtered);

      if (!categoryId && !queryStr) {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) {
          counts[cat.id] = await getCategoryCount(cat.genre);
        }
        setCatCounts(counts);
      }
    } catch (err) { 
      console.error("Erro no HomeContent:", err);
    } finally { 
      setLoading(false); 
    }
  }, [router]);

  React.useEffect(() => { loadData(q, selectedCat) }, [q, selectedCat, loadData]);

  const handleItemClick = (idx: number) => {
    const item = content[idx];
    if (item.type === 'series' || item.type === 'multi-season') {
      setSelectedSeries(item);
    } else {
      setActiveVideo({ items: content, index: idx });
    }
  };

  const handleEpisodeClick = (ep: Episode, parent: ContentItem) => {
    // NAVEGAÇÃO POR EPISÓDIOS v1700: Carrega todos os episódios no player para as setas funcionarem
    const episodesToPlay = parent.episodes || parent.seasons?.flatMap(s => s.episodes) || [];
    const contentItems = episodesToPlay.map(e => ({
      ...parent,
      streamUrl: e.streamUrl,
      title: `${parent.title} - EP ${e.number} ${e.title}`
    }));
    const startIndex = episodesToPlay.findIndex(e => e.id === ep.id);
    setActiveVideo({ items: contentItems, index: startIndex });
  };

  const handleCategoryClick = (cat: any) => {
    if (cat.restricted && !user?.isAdultEnabled) {
      setPendingCategory(cat.id);
      setIsPinOpen(true);
    } else {
      setSelectedCat(cat.id);
    }
  };

  const verifyPin = () => {
    if (pinInput === parentalPin) { 
      if (pendingCategory) setSelectedCat(pendingCategory);
      setIsPinOpen(false); 
      setPinInput(""); 
      setPendingCategory(null);
    } else { 
      toast({ variant: "destructive", title: "PIN INCORRETO" }); 
      setPinInput(""); 
    }
  };

  const navigateChannel = (direction: 'next' | 'prev') => {
    if (!activeVideo) return;
    let nextIdx = direction === 'next' ? activeVideo.index + 1 : activeVideo.index - 1;
    if (nextIdx < 0) nextIdx = activeVideo.items.length - 1;
    if (nextIdx >= activeVideo.items.length) nextIdx = 0;
    setActiveVideo({ ...activeVideo, index: nextIdx });
  }

  if (loading && content.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cinematic">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-4">Sincronizando Sistema Master Léo TV...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-cinematic text-foreground pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {selectedCat || q ? (
            <Button variant="ghost" onClick={() => { setSelectedCat(null); router.replace("/user/home"); }} className="h-14 w-14 rounded-full bg-white/5 hover:bg-primary transition-all">
              <ChevronLeft className="h-8 w-8 text-white" />
            </Button>
          ) : <div className="bg-primary p-2.5 rounded-2xl rotate-2 shadow-lg shadow-primary/20"><Tv className="h-7 w-7 text-white" /></div>}
          <div className="hidden lg:block">
            <span className="text-2xl font-black text-primary uppercase italic tracking-tighter block leading-none">LÉO TV MASTER</span>
            <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Sinais Alfabéticos v1700.0</span>
          </div>
        </div>
        <div className="flex-1 max-w-xl mx-4"><VoiceSearch /></div>
        <div className="flex items-center gap-2">
           <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black uppercase text-primary italic">Sinal Ativo</span>
              <span className="text-[8px] font-bold opacity-40 uppercase">{user?.pin}</span>
           </div>
           <Button variant="ghost" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-full hover:bg-destructive/10">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-8 mt-6 space-y-4">
        {announcement && !selectedCat && !q && (
          <div className="bg-primary/10 border border-primary/30 p-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-primary p-2 rounded-xl"><MessageSquare className="h-5 w-5 text-white" /></div>
            <p className="text-[11px] font-black uppercase text-primary tracking-widest italic">{announcement}</p>
          </div>
        )}
        
        {user?.individualMessage && !selectedCat && !q && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-3xl flex items-center gap-4 animate-pulse">
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
                <button 
                  key={c.id} 
                  onClick={() => handleCategoryClick(c)} 
                  className={`group relative h-56 rounded-[2.5rem] overflow-hidden border-2 border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl ${c.color} bg-opacity-20`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                    <div className={`p-4 rounded-3xl ${c.color} text-white shadow-xl group-hover:rotate-12 transition-transform`}><c.icon className="h-10 w-10" /></div>
                    <div className="text-center">
                      <span className="text-lg font-black uppercase italic text-white block">{c.name}</span>
                      {count > 0 && (
                        <span className="bg-black/40 px-3 py-1 rounded-full text-[9px] font-black text-primary border border-primary/20 uppercase mt-2 inline-block">
                          {count.toLocaleString()} SINAIS
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                {q ? `BUSCANDO: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}
              </h2>
            </div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {content.map((item, idx) => (
                <div key={item.id} onClick={() => handleItemClick(idx)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl">
                  {item.imageUrl ? <Image src={item.imageUrl} alt="Capa" fill className="object-cover opacity-80 group-hover:opacity-100" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center bg-primary/10"><Tv className="h-12 w-12 text-primary opacity-20" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end">
                    <h3 className="font-black text-[12px] uppercase italic truncate text-white group-hover:text-primary leading-tight">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!selectedSeries} onOpenChange={() => setSelectedSeries(null)}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none">
          {selectedSeries && (
            <div className="flex flex-col h-[85vh]">
              <div className="relative h-64 shrink-0">
                {selectedSeries.imageUrl && <Image src={selectedSeries.imageUrl} alt="Capa" fill className="object-cover" unoptimized />}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent p-10 flex flex-col justify-end">
                  <div className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">{selectedSeries.title}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scroll scrollbar-visible">
                {selectedSeries.episodes && selectedSeries.episodes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedSeries.episodes.sort((a,b) => a.number - b.number).map((ep) => (
                      <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries)} className="w-full h-16 justify-start bg-white/5 border-white/5 hover:border-primary rounded-2xl px-8 group transition-all">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary mr-6">{ep.number}</div>
                        <span className="font-black uppercase text-sm">EP {ep.number} - {ep.title}</span>
                      </Button>
                    ))}
                  </div>
                ) : selectedSeries.seasons && selectedSeries.seasons.length > 0 ? (
                  selectedSeries.seasons.sort((a,b) => a.number - b.number).map(season => (
                    <div key={season.id} className="space-y-3 mb-8 last:mb-0">
                      <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] pl-4 border-l-4 border-primary mb-4">Temporada {season.number}</h4>
                      <div className="flex flex-col gap-2">
                        {season.episodes.sort((a,b) => a.number - b.number).map(ep => (
                          <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries)} className="w-full h-14 justify-start bg-white/5 border-white/5 hover:border-primary rounded-xl px-8 group transition-all">
                            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center font-black text-[10px] text-primary mr-6">{ep.number}</div>
                            <span className="font-bold uppercase text-xs">EP {ep.number} - {ep.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          {activeVideo && (
            <VideoPlayer 
              url={activeVideo.items[activeVideo.index].streamUrl || ""} 
              title={activeVideo.items[activeVideo.index].title} 
              id={activeVideo.items[activeVideo.index].id}
              onNext={() => navigateChannel('next')}
              onPrev={() => navigateChannel('prev')}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic text-primary mb-6">Trava Parental Master</div>
          <input type="password" title="PIN" maxLength={4} className="h-20 w-56 bg-black/40 border-white/10 text-center text-4xl font-black tracking-[0.6em] rounded-3xl outline-none border-2 focus:border-primary mb-6" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPin()} autoFocus />
          <Button onClick={verifyPin} className="w-full h-16 bg-primary text-lg font-black uppercase rounded-3xl shadow-xl shadow-primary/20">DESBLOQUEAR ACESSO</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
