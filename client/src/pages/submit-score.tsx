import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import ScoreForm from "@/components/score-form";
import { apiRequest } from "@/lib/queryClient";
import type { Game, InsertScore, Score } from "@shared/schema";
import { Trophy } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function SubmitScore() {
  const { gameId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { venueSettings } = useTheme();
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
      <div className="relative mb-6 shadow-md rounded-lg overflow-hidden">
        <div className="w-full h-[200px] relative overflow-hidden">
          {game.imageUrl ? (
            <div className="w-full h-full bg-black rounded-t-lg flex items-center justify-center">
              <img 
                src={game.imageUrl} 
                alt={`${game.name} marquee`}
                className="w-auto h-full max-w-full object-contain transition-transform duration-700 hover:scale-105"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/40 rounded-t-lg">
              <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-center px-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
                {game.name}
              </h2>
            </div>
          )}
        </div>
      </div>
      
      <div className="section-header px-6 py-4 rounded-lg mb-6">
        <div className="relative">
          {/* Watermark logo behind the text */}
          {(venueSettings?.animatedLogoUrl || venueSettings?.logoUrl) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              {venueSettings.animatedLogoUrl ? (
                <video 
                  src={venueSettings.animatedLogoUrl} 
                  autoPlay 
                  loop 
                  muted
                  className="w-32 h-32 object-contain opacity-50 transparent-video" 
                />
              ) : (
                <img 
                  src={venueSettings.logoUrl} 
                  alt={`${venueSettings.name} watermark`} 
                  className="w-32 h-32 object-contain opacity-50" 
                />
              )}
            </div>
          )}
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight uppercase drop-shadow-sm">{game.name}</h1>
            {game.subtitle && <p className="subtitle text-muted-foreground">{game.subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="champion-icon p-1">
            <Trophy className="h-5 w-5" />
          </div>
          <p className="subtitle mt-0 flex items-center gap-2">
            Current Top Score: <span className="score-display font-bold text-lg champion-badge">{(game.currentHighScore || 0).toLocaleString()}</span>
          </p>
        </div>
      </div>
      <ScoreForm
        gameId={id}
        onSubmit={(data) => submitScore.mutate(data)}
        isSubmitting={submitScore.isPending}
      />
    </div>
  );
}
