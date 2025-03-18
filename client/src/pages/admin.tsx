import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { venueSettingsSchema, type VenueSettings } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

const colorSchemes = [
  { name: "Purple Glow", primary: "hsl(280, 100%, 50%)", variant: "vibrant" },
  { name: "Ocean Blue", primary: "hsl(210, 100%, 50%)", variant: "vibrant" },
  { name: "Forest Green", primary: "hsl(150, 100%, 40%)", variant: "vibrant" },
  { name: "Sunset Orange", primary: "hsl(20, 100%, 50%)", variant: "vibrant" },
  { name: "Berry Red", primary: "hsl(350, 100%, 50%)", variant: "vibrant" },
  { name: "Professional Blue", primary: "hsl(220, 70%, 50%)", variant: "professional" },
  { name: "Professional Green", primary: "hsl(160, 70%, 40%)", variant: "professional" },
  { name: "Professional Purple", primary: "hsl(270, 70%, 50%)", variant: "professional" },
  { name: "Soft Teal", primary: "hsl(180, 70%, 50%)", variant: "tint" },
  { name: "Soft Rose", primary: "hsl(330, 70%, 50%)", variant: "tint" },
];

export default function Admin() {
  const { toast } = useToast();
  const [selectedScheme, setSelectedScheme] = useState(0);

  const { data: settings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const form = useForm<VenueSettings>({
    resolver: zodResolver(venueSettingsSchema),
    defaultValues: settings || {
      name: "",
      theme: colorSchemes[0],
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (data: Partial<VenueSettings>) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", data);
      return res.json() as Promise<VenueSettings>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your changes have been saved successfully.",
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

  const handleColorSchemeChange = (index: number) => {
    setSelectedScheme(index);
    const scheme = colorSchemes[index];
    updateSettings.mutate({ theme: scheme });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage your venue settings</p>
      </div>

      <Tabs defaultValue="venue">
        <TabsList>
          <TabsTrigger value="venue">Venue Details</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>

        <TabsContent value="venue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
              <CardDescription>
                Update your venue's basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => updateSettings.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Mon-Fri: 9am-9pm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Save Changes</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Choose from predefined color schemes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {colorSchemes.map((scheme, index) => (
                  <button
                    key={scheme.name}
                    onClick={() => handleColorSchemeChange(index)}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedScheme === index
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border hover:border-primary/50"
                    }`}
                    style={{
                      backgroundColor: scheme.primary,
                    }}
                  >
                    <div className="h-12"></div>
                    <div className="mt-2 text-sm font-medium text-center bg-background/90 rounded py-1">
                      {scheme.name}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Management</CardTitle>
              <CardDescription>
                Edit or remove games from your venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Game management UI will be implemented here */}
              <p className="text-muted-foreground">Game management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
