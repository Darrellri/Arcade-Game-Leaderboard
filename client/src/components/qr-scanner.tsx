import { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface QRScannerProps {
  onScan: (result: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        try {
          const gameId = parseInt(result.data);
          if (isNaN(gameId)) throw new Error("Invalid QR code");
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

    qrScanner.start().catch((error) => {
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
      });
    });

    return () => {
      qrScanner.destroy();
    };
  }, [onScan, toast]);

  return (
    <Card className="overflow-hidden">
      <video ref={videoRef} className="w-full aspect-square object-cover" />
    </Card>
  );
}
