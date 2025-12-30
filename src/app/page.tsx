"use client";
import { useState } from "react";
import { PlayerForm } from "@/components/player-form";
import { Icons } from "@/components/icons";
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { VideoPlayer } from "@/components/video-player";

export default function Home() {
  const [sourceToPlay, setSourceToPlay] = useState("https://www.canva.com/design/DAG6ONyt5ks/6DuizP3XWwr5xFWBi383CQ/view?embed");

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 p-2">
            <Icons.logo className="h-8 w-8 text-accent" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-primary font-headline">
                Léo Tv & Stream
              </h1>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <PlayerForm setSourceToPlay={setSourceToPlay} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="relative flex h-svh w-full flex-col items-center justify-center bg-muted/50">
          <div className="absolute top-4 left-4 z-20">
            <SidebarTrigger />
          </div>
          <VideoPlayer source={sourceToPlay} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
