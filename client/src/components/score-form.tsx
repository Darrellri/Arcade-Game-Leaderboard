import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScoreSchema, type InsertScore } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ScoreFormProps {
  gameId: number;
  onSubmit: (data: InsertScore) => void;
  isSubmitting: boolean;
}

export default function ScoreForm({
  gameId,
  onSubmit,
  isSubmitting,
}: ScoreFormProps) {
  const [location, setLocation] = useState<GeolocationCoordinates>();
  const { toast } = useToast();
  
  const form = useForm<InsertScore>({
    resolver: zodResolver(insertScoreSchema),
    defaultValues: {
      gameId,
      playerName: "",
      score: 0,
      phoneNumber: "",
      imageUrl: "",
      latitude: 0,
      longitude: 0,
    },
  });

  const handleSubmit = async (data: InsertScore) => {
    if (!location) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enable location services to submit your score",
      });
      return;
    }

    onSubmit({
      ...data,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  // Get location on mount
  useState(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation(position.coords),
      (error) => {
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to get your location. Please enable location services.",
        });
      }
    );
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="playerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Player Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Score</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Score Image URL</FormLabel>
              <FormControl>
                <Input type="url" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Score"}
        </Button>
      </form>
    </Form>
  );
}
