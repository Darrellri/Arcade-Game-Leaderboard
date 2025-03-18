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
  const id = parseInt(gameId);

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
        description: "Your high score has been recorded!",
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
      <h1 className="text-4xl font-bold tracking-tight">Submit Score</h1>
      <h2 className="text-2xl">{game.name}</h2>
      <p className="text-muted-foreground">
        Current High Score: {game.currentHighScore.toLocaleString()}
      </p>
      <ScoreForm
        gameId={id}
        onSubmit={(data) => submitScore.mutate(data)}
        isSubmitting={submitScore.isPending}
      />
    </div>
  );
}
