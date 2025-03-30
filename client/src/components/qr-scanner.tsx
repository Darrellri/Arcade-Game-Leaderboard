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
          <h3 className="text-lg font-medium">Enter Game ID</h3>
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
            />
            <Button onClick={handleSubmitManualEntry}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      ) : (
        <video ref={videoRef} className="w-full aspect-square object-cover" />
      )}
      <CardFooter className="bg-card p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleManualEntry}
        >
          {showManualEntry ? (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Switch to Camera
            </>
          ) : (
            <>
              <Keyboard className="h-4 w-4 mr-2" />
              Manual Entry
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
