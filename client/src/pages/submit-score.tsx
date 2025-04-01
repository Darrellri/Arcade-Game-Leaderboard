import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ScoreForm from "@/components/score-form";
import { apiRequest } from "@/lib/queryClient";
import type { Game, InsertScore, Score } from "@shared/schema";

export default function SubmitScore() {
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = parseInt(gameId || "0");

  const { data: game } = useQuery<Game>({
    queryKey: [`/api/games/${id}`],
  });

  const submitScore = useMutation({
    mutationFn: async (data: InsertScore) => {
      const res = await apiRequest("POST", "/api/scores", data);
      return res.json() as Promise<Score>;
    },
    onSuccess: () => {
      toast({
        title: "Score Submitted",
        description: "Your top score has been recorded!",
      });
      setLocation(`/leaderboard/${id}`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (!game) return null;

  return (
    <div className="space-y-8 max-w-md mx-auto">
      {/* Game Marquee Display */}
      <div className="w-full h-[180px] relative overflow-hidden rounded-lg">
        {game.imageUrl ? (
          <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
            <img 
              src={game.imageUrl} 
              alt={`${game.name} marquee`}
              className="w-auto h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40 rounded-lg">
            <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-center px-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
              {game.name}
            </h2>
          </div>
        )}
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight uppercase">{game.name}</h1>
      <p className="text-muted-foreground">
        Current Top Score: <span className="font-mono font-bold">{(game.currentHighScore || 0).toLocaleString()}</span>
      </p>
      <ScoreForm
        gameId={id}
        onSubmit={(data) => submitScore.mutate(data)}
        isSubmitting={submitScore.isPending}
      />
    </div>
  );
}
