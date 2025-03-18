import { useLocation } from "wouter";
import QRScanner from "@/components/qr-scanner";

export default function Scan() {
  const [, setLocation] = useLocation();

  const handleScan = (gameId: string) => {
    setLocation(`/submit-score/${gameId}`);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Scan Game QR Code</h1>
      <div className="max-w-md mx-auto">
        <QRScanner onScan={handleScan} />
      </div>
    </div>
  );
}
