"use client"

import * as React from "react"
import Link from "next/link"
import { LayoutDashboard, Film, Users, Settings, LogOut, Tv, Loader2, Briefcase, BarChart3, Gamepad2 } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { VoiceSearch } from "@/components/voice-search"

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-6">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="bg-primary p-2 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary font-headline uppercase tracking-tight italic">AdminSight</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-4 py-2 space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/admin">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <span className="font-bold uppercase text-[10px] tracking-widest">Painel Geral</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/admin/content">
                    <Film className="h-5 w-5 text-secondary" />
                    <span className="font-bold uppercase text-[10px] tracking-widest">Canais & Filmes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/admin/games">
                    <Gamepad2 className="h-5 w-5 text-emerald-500" />
                    <span className="font-bold uppercase text-[10px] tracking-widest">Arena Games</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/admin/stats">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                    <span className="font-bold uppercase text-[10px] tracking-widest">Estatísticas</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/admin/users">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="font-bold uppercase text-[10px] tracking-widest">Clientes & PINs</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/admin/resellers">
                    <Briefcase className="h-5 w-5 text-emerald-400" />
                    <span className="font-bold uppercase text-[10px] tracking-widest">Revendedores</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/admin/settings">
                    <Settings className="h-5 w-5 text-orange-400" />
                    <span className="font-bold uppercase text-[10px] tracking-widest">Segurança</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <SidebarMenuButton asChild className="text-destructive hover:bg-destructive/10 h-10 rounded-xl transition-all">
              <a href="/login">
                <LogOut className="h-5 w-5" />
                <span className="font-bold uppercase text-[10px] tracking-widest">Sair</span>
              </a>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="hidden md:block">
                <VoiceSearch />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-muted px-4 py-1.5 rounded-full border border-border shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white shadow-md">A</div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Administrador</span>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8 bg-background">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutInner>{children}</AdminLayoutInner>
  )
}