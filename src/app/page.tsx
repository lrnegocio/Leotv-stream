import { PlayerForm } from "@/components/player-form";
import { Icons } from "@/components/icons";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8">
        <header className="flex items-center gap-3 text-center">
          <Icons.logo className="h-10 w-10 text-accent" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl font-headline">
              VideoVerse Player
            </h1>
            <p className="text-muted-foreground">
              Your universal player for YouTube and Canva content.
            </p>
          </div>
        </header>

        <PlayerForm />
      </div>
    </main>
  );
}
