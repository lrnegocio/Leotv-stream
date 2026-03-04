
"use client"

import * as React from "react"
import Link from "next/link"
import { LayoutDashboard, Film, Tv, Users, CreditCard, LogOut } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { VoiceSearch } from "@/components/voice-search"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r border-white/5 shadow-xl bg-card">
          <SidebarHeader className="p-6">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary font-headline uppercase tracking-tighter">Léo Admin</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-4 py-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Painel Geral</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/content">
                    <Film className="h-5 w-5" />
                    <span>Gerenciar Canais/Filmes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/users">
                    <Users className="h-5 w-5" />
                    <span>Clientes & PINs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/admin/subscriptions">
                    <CreditCard className="h-5 w-5" />
                    <span>Financeiro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-white/5">
            <SidebarMenuButton asChild className="text-destructive hover:bg-destructive/10">
              <Link href="/login">
                <LogOut className="h-5 w-5" />
                <span>Sair do Sistema</span>
              </Link>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-white/5 bg-card/30 backdrop-blur-md flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="hidden md:block">
                <VoiceSearch />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold">A</div>
                <span className="text-sm font-medium">Administrador Master</span>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
