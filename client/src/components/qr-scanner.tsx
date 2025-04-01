import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Keyboard, ArrowRight, Camera } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [gameId, setGameId] = useState("");
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);

  useEffect(() => {
    if (!videoRef.current || showManualEntry) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        try {
          const id = parseInt(result.data);
          if (isNaN(id)) throw new Error("Invalid QR code");
          onScan(result.data);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Invalid QR Code",
            description: "Please scan a valid game QR code",
          });
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    scanner.start().catch((error) => {
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
      });
    });

    setQrScanner(scanner);

    return () => {
      scanner.destroy();
    };
  }, [onScan, toast, showManualEntry]);

  const handleManualEntry = () => {
    // Stop scanner if it's running
    if (qrScanner && !showManualEntry) {
      qrScanner.stop();
    } else if (qrScanner && showManualEntry) {
      qrScanner.start();
    }
    setShowManualEntry(!showManualEntry);
  };

  const handleSubmitManualEntry = () => {
    try {
      const id = parseInt(gameId);
      if (isNaN(id)) throw new Error("Invalid game ID");
      onScan(gameId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid Game ID",
        description: "Please enter a valid game ID number",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      {showManualEntry ? (
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Keyboard className="h-5 w-5 mr-2 game-type-icon" />
            Enter Game ID
          </h3>
          <div className="flex gap-2">
            <Input 
              type="number" 
              placeholder="Game ID" 
              value={gameId} 
              onChange={(e) => setGameId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitManualEntry();
                }
              }}
              className="transition-all duration-200 focus:border-primary/70 focus:ring-primary/30 font-mono"
            />
            <Button 
              onClick={handleSubmitManualEntry}
              className="transition-colors hover:bg-primary/90"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      ) : (
        <div className="relative">
          <video ref={videoRef} className="w-full aspect-square object-cover" />
          <div className="absolute inset-0 pointer-events-none border-4 border-dashed border-primary/30 m-8 rounded-lg"></div>
        </div>
      )}
      <CardFooter className="bg-card p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full transition-all duration-200 hover:bg-secondary/80" 
          onClick={handleManualEntry}
        >
          {showManualEntry ? (
            <>
              <Camera className="h-4 w-4 mr-2 text-primary" />
              Switch to Camera
            </>
          ) : (
            <>
              <Keyboard className="h-4 w-4 mr-2 text-primary" />
              Manual Entry
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
