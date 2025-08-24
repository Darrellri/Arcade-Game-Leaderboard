import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="relative">
            {/* Watermark Arcade Leaderboard logo behind the text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <img 
                src="/arcade-leaderboard-watermark.png" 
                alt="Arcade Leaderboard watermark" 
                className="w-24 h-24 object-contain opacity-75" 
                style={{ filter: 'brightness(0.8)' }}
                onError={(e) => { console.log('Image failed to load:', e); }}
              />
            </div>
            
            <div className="relative z-10">
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                Did you forget to add the page to the router?
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
