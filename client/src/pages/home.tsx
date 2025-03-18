import { useQuery } from "@tanstack/react-query";
import GameCard from "@/components/game-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game } from "@shared/schema";

export default function Home() {
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[300px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Arcade High Scores</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {games?.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
