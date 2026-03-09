"use client"

import * as React from "react"
import Link from "next/link"
import { LayoutDashboard, Film, Users, Settings, LogOut, Tv } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { VoiceSearch } from "@/components/voice-search"
import { AiAssistant } from "@/components/ai-assistant"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r border-white/5 shadow-xl bg-card">
          <SidebarHeader className="p-6">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="bg-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary font-headline uppercase tracking-tighter italic">Léo Admin</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-4 py-2 space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <span className="font-bold uppercase text-xs tracking-widest">Painel Geral</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/content">
                    <Film className="h-5 w-5 text-secondary" />
                    <span className="font-bold uppercase text-xs tracking-widest">Canais & Filmes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/users">
                    <Users className="h-5 w-5 text-blue-400" />
                    <span className="font-bold uppercase text-xs tracking-widest">Clientes & PINs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/settings">
                    <Settings className="h-5 w-5 text-orange-400" />
                    <span className="font-bold uppercase text-xs tracking-widest">Configurações</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-white/5">
            <SidebarMenuButton asChild className="text-destructive hover:bg-destructive/10 h-12 rounded-xl">
              <Link href="/login">
                <LogOut className="h-5 w-5" />
                <span className="font-bold uppercase text-xs tracking-widest">Sair do Painel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-white/5 bg-card/30 backdrop-blur-md flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="hidden md:block">
                <React.Suspense fallback={<div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />}>
                  <VoiceSearch />
                </React.Suspense>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white shadow-lg">L</div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Mestre Léo</span>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-background via-background to-black/20">
            <React.Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              {children}
            </React.Suspense>
          </div>
        </main>
      </div>
      <AiAssistant />
    </SidebarProvider>
  )
}