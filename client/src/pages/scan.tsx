import { useLocation } from "wouter";
import QRScanner from "@/components/qr-scanner";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Gamepad2 } from "lucide-react";

export default function Scan() {
  const [, setLocation] = useLocation();

  const handleScan = (gameId: string) => {
    setLocation(`/submit-score/${gameId}`);
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="section-header px-6 py-4 rounded-lg">
        <h1 className="text-4xl font-bold tracking-tight">Scan Top Score</h1>
        <p className="subtitle mt-2">
          Scan the QR code on your arcade game or enter the game ID manually
        </p>
      </div>
      
      <div className="max-w-md mx-auto space-y-6">
        <Card className="shadow-md overflow-hidden">
          <QRScanner onScan={handleScan} />
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 card-content">
            <h3 className="text-lg font-medium flex items-center mb-2">
              <QrCode className="h-5 w-5 mr-2 game-type-icon" />
              How to Scan a Game
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm subtitle">
              <li>Find the QR code on the arcade or pinball machine</li>
              <li>Hold your phone camera steady to scan the code</li>
              <li>If scanning doesn't work, use the Manual Entry option below</li>
            </ol>
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 card-content">
            <h3 className="text-lg font-medium flex items-center mb-2">
              <Gamepad2 className="h-5 w-5 mr-2 game-type-icon" />
              Manual Entry Help
            </h3>
            <p className="subtitle mb-2">
              Each game has a unique ID number that you can enter manually. 
              The ID number can be found on a sticker near the QR code or
              by asking an arcade attendant.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
