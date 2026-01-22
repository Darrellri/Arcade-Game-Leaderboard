import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VenueSettings, Game, Score } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Square,
  List,
  Grid2X2,
  Trophy,
  Gamepad2,
  CircleDot,
  Trash2,
} from "lucide-react";

const adminScoreSchema = z.object({
  gameId: z.string().min(1, "Please select a game"),
  playerName: z.string().min(1, "Player name is required").max(50),
  score: z.string().min(1, "Score is required"),
});

type AdminScoreFormData = z.infer<typeof adminScoreSchema>;

export default function AdminScores() {
  const { toast } = useToast();

  const { data: venueSettings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: games } = useQuery<Game[]>({
    queryKey: ["/api/games", { includeHidden: true }],
    queryFn: () => apiRequest("GET", "/api/games?includeHidden=true").then(res => res.json()),
  });

  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  const { data: scores, isLoading: scoresLoading } = useQuery<Score[]>({
    queryKey: ["/api/games", selectedGameId, "scores"],
    queryFn: () => apiRequest("GET", `/api/games/${selectedGameId}/scores`).then(res => res.json()),
    enabled: !!selectedGameId,
  });

  const form = useForm<AdminScoreFormData>({
    resolver: zodResolver(adminScoreSchema),
    defaultValues: {
      gameId: "",
      playerName: "",
      score: "",
    },
  });

  const addScore = useMutation({
    mutationFn: async (data: AdminScoreFormData) => {
      const response = await apiRequest("POST", "/api/scores", {
        gameId: parseInt(data.gameId),
        playerName: data.playerName,
        score: parseInt(data.score),
        phoneNumber: "ADMIN",
        latitude: 0,
        longitude: 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      if (selectedGameId) {
        queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGameId, "scores"] });
      }
      form.reset({ gameId: form.getValues("gameId"), playerName: "", score: "" });
      toast({
        title: "Score Added",
        description: "High score has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteScore = useMutation({
    mutationFn: async (scoreId: number) => {
      const response = await apiRequest("DELETE", `/api/scores/${scoreId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      if (selectedGameId) {
        queryClient.invalidateQueries({ queryKey: ["/api/games", selectedGameId, "scores"] });
      }
      toast({
        title: "Score Deleted",
        description: "Score has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: AdminScoreFormData) => {
    addScore.mutate(data);
  };

  const handleGameChange = (value: string) => {
    form.setValue("gameId", value);
    setSelectedGameId(parseInt(value));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getVenueNameStyle = () => ({
    fontFamily: "'Oswald', 'Impact', 'Arial Black', sans-serif",
    fontWeight: "900",
    letterSpacing: '0.08em',
    lineHeight: '1.1',
    whiteSpace: 'nowrap' as const,
    textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 6px 8px rgba(0,0,0,0.5)',
  });

  return (
    <div className="space-y-2 min-h-screen flex flex-col">
      {/* Header */}
      <div className="themed-header px-5 py-4 rounded-lg mb-2 w-full">
        <div className="block md:hidden">
          <div className="flex flex-col items-center gap-3">
            {/* Row 1: Logos */}
            <div className="flex items-center justify-center gap-4 w-full">
              <img 
                src="/arcade-leaderboard-logo.png" 
                alt="Arcade Leaderboard"
                className="h-12 w-auto object-contain"
              />
              {venueSettings?.logoUrl && (
                <img 
                  src={venueSettings.logoUrl} 
                  alt={venueSettings?.name || "Venue"}
                  className="h-10 w-auto object-contain"
                />
              )}
            </div>
            
            {/* Row 2: Business name */}
            <div className="text-center">
              <h1 
                className="text-2xl text-white"
                style={getVenueNameStyle()}
              >
                {venueSettings?.name || "ARCADE VENUE"}
              </h1>
            </div>
            
            {/* Row 3: Navigation */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-1">
                <Button variant="outline" size="icon" asChild className="h-[42px] w-[42px]">
                  <Link href="/"><Square className="h-[16px] w-[16px]" /></Link>
                </Button>
                <Button variant="outline" size="icon" asChild className="h-[42px] w-[42px]">
                  <Link href="/"><List className="h-[16px] w-[16px]" /></Link>
                </Button>
                <Button variant="outline" size="icon" asChild className="h-[42px] w-[42px]">
                  <Link href="/"><Grid2X2 className="h-[16px] w-[16px]" /></Link>
                </Button>
              </div>
              <Button variant="outline" size="sm" asChild className="h-[36px] px-4">
                <Link href="/admin">Back</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-shrink-0">
              <img 
                src="/arcade-leaderboard-logo.png" 
                alt="Arcade Leaderboard"
                className="h-16 w-auto object-contain"
              />
              {venueSettings?.logoUrl && (
                <img 
                  src={venueSettings.logoUrl} 
                  alt={venueSettings?.name || "Venue"}
                  className="h-12 w-auto object-contain"
                />
              )}
            </div>
            
            <div className="flex-1 text-center">
              <h1 
                className="text-3xl text-white"
                style={getVenueNameStyle()}
              >
                {venueSettings?.name || "ARCADE VENUE"}
              </h1>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex gap-1">
                <Button variant="outline" size="icon" asChild className="h-[52px] w-[52px]">
                  <Link href="/"><Square className="h-[21px] w-[21px]" /></Link>
                </Button>
                <Button variant="outline" size="icon" asChild className="h-[52px] w-[52px]">
                  <Link href="/"><List className="h-[21px] w-[21px]" /></Link>
                </Button>
                <Button variant="outline" size="icon" asChild className="h-[52px] w-[52px]">
                  <Link href="/"><Grid2X2 className="h-[21px] w-[21px]" /></Link>
                </Button>
              </div>
              <Button variant="outline" size="sm" asChild className="h-[42px] px-5 text-lg">
                <Link href="/admin">Back</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-8">
        {/* Page Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold uppercase tracking-wide">HIGH SCORE ENTRY</h2>
          <p className="text-muted-foreground">Manually add high scores for games</p>
        </div>

        {/* Add Score Form */}
        <Card className="border-2 border-dashed border-primary/40 bg-primary/5 max-w-2xl mx-auto">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="gameId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Select Game</FormLabel>
                      <Select onValueChange={handleGameChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-lg">
                            <SelectValue placeholder="Choose a game..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {games?.map((game) => (
                            <SelectItem key={game.id} value={game.id.toString()}>
                              <div className="flex items-center gap-2">
                                {game.type === 'pinball' ? (
                                  <CircleDot className="h-4 w-4" />
                                ) : (
                                  <Gamepad2 className="h-4 w-4" />
                                )}
                                {game.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="playerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Player Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter player name"
                            className="h-12 text-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Score</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            placeholder="Enter score"
                            className="h-12 text-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-center pt-2">
                  <Button 
                    type="submit" 
                    disabled={addScore.isPending} 
                    size="lg" 
                    className="h-14 px-10 text-lg"
                  >
                    <Trophy className="h-5 w-5 mr-2" />
                    {addScore.isPending ? "Adding..." : "ADD HIGH SCORE"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Scores List */}
        {selectedGameId && (
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Scores for {games?.find(g => g.id === selectedGameId)?.name}
            </h3>
            
            {scoresLoading ? (
              <p className="text-center text-muted-foreground">Loading scores...</p>
            ) : scores && scores.length > 0 ? (
              <div className="space-y-2">
                {scores
                  .sort((a, b) => b.score - a.score)
                  .map((score, index) => (
                    <Card key={score.id} className={index === 0 ? "border-primary" : ""}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-muted-foreground w-8">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-lg">{score.playerName}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(score.submittedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-primary">
                            {score.score.toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (window.confirm("Delete this score?")) {
                                deleteScore.mutate(score.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No scores yet for this game</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
