
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { autoGenerateContentDescription } from "@/ai/flows/auto-generate-content-description-flow"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function NewContentPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: "",
    type: "movie" as "movie" | "series",
    genre: "",
    keywords: "",
    description: "",
    streamUrl: "",
    isRestricted: false
  })

  const generateAI = async () => {
    if (!formData.title) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter at least a title first." })
      return
    }
    setGenerating(true)
    try {
      const res = await autoGenerateContentDescription({
        title: formData.title,
        contentType: formData.type,
        genre: formData.genre,
        keywords: formData.keywords
      })
      setFormData(prev => ({ ...prev, description: res.description }))
      toast({ title: "AI Generated", description: "Content description has been generated." })
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate description." })
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Save logic here
    setTimeout(() => {
      toast({ title: "Content Saved", description: "The content has been added to the library." })
      router.push("/admin/content")
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline">Add Content</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-lg">
            <div className="space-y-2">
              <Label>Content Title</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Inception" required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Movie</SelectItem>
                    <SelectItem value="series">Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Input 
                  value={formData.genre} 
                  onChange={e => setFormData({...formData, genre: e.target.value})} 
                  placeholder="e.g. Action, Sci-Fi"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Description</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-primary border-primary/20 hover:bg-primary/10"
                  onClick={generateAI}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
                  Auto-Generate (AI)
                </Button>
              </div>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Briefly describe the content..." 
                className="h-32" 
              />
            </div>
          </div>

          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-lg">
            <h3 className="font-semibold flex items-center gap-2">Stream Source</h3>
            <div className="space-y-2">
              <Label>Main Stream URL</Label>
              <Input 
                value={formData.streamUrl} 
                onChange={e => setFormData({...formData, streamUrl: e.target.value})}
                placeholder="https://..." 
                required={formData.type === 'movie'} 
              />
              <p className="text-[10px] text-muted-foreground">Supports YouTube, Dailymotion, playcnvs.stream, visiocine.stream and direct HLS/MP4.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl shadow-lg space-y-4">
            <h3 className="font-semibold">Access & Restrictions</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Parental Lock</Label>
                <p className="text-xs text-muted-foreground">Requires PIN to watch</p>
              </div>
              <Switch 
                checked={formData.isRestricted} 
                onCheckedChange={val => setFormData({...formData, isRestricted: val})} 
              />
            </div>
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl shadow-lg space-y-4">
            <h3 className="font-semibold">Thumbnail</h3>
            <div className="aspect-[2/3] w-full bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-white/5 overflow-hidden">
               <p className="text-xs text-muted-foreground">Upload Preview</p>
            </div>
            <Button variant="outline" className="w-full">Upload Image</Button>
          </div>

          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Save Content
          </Button>
        </div>
      </form>
    </div>
  )
}
