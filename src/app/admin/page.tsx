
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Users, Tv, CreditCard, ArrowUpRight, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminDashboard() {
  const stats = [
    { title: "Total Users", value: "1,284", icon: Users, color: "text-blue-400" },
    { title: "Movies", value: "452", icon: Film, color: "text-primary" },
    { title: "Series", value: "128", icon: Tv, color: "text-secondary" },
    { title: "Active Subs", value: "856", icon: CreditCard, color: "text-green-400" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">Monitor and manage your streaming platform performance.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/admin/content/new">
            <PlayCircle className="mr-2 h-5 w-5" />
            Add New Content
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card/50 border-white/5 shadow-lg overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transition-transform group-hover:scale-[1.7]">
              <stat.icon className={`h-12 w-12 ${stat.color}`} />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1 text-green-400" />
                +12% from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle>Recent Content Added</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                  <div className="w-12 h-16 bg-muted rounded overflow-hidden">
                    <img src={`https://picsum.photos/seed/${i + 10}/100/150`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Cyber Punk: Reloaded</p>
                    <p className="text-xs text-muted-foreground">Movie • Sci-Fi • Added 2h ago</p>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">Edit</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle>Stream Testing Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Quickly verify if a stream URL is responsive before adding it to your library.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="https://stream-url.com/live/..." 
                className="flex-1 bg-muted/50 border-none rounded-md px-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
              />
              <Button size="sm">Test Link</Button>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-xs text-muted-foreground italic">
              Result will appear here...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
