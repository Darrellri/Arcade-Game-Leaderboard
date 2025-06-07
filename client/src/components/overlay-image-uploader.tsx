import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Image as ImageIcon, Layers } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface OverlayImageUploaderProps {
  gameId: number;
  currentOverlayUrl?: string | null;
  onSuccess?: (overlayUrl: string) => void;
}

export default function OverlayImageUploader({ 
  gameId, 
  currentOverlayUrl, 
  onSuccess 
}: OverlayImageUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentOverlayUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview for selected image
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select an image file first."
      });
      return;
    }

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Only image files are allowed."
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('overlayImage', file);

      const response = await fetch(`/api/games/${gameId}/upload-overlay`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      let result;
      try {
        const text = await response.text();
        result = JSON.parse(text);
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        throw new Error("Failed to parse server response. The image may have been uploaded, but there was an error processing the response.");
      }
      
      // Invalidate game queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      
      toast({
        title: "Overlay uploaded successfully",
        description: "The game overlay image has been updated."
      });

      // Set the new image URL and call onSuccess callback if provided
      setPreviewUrl(result.overlayUrl);
      if (onSuccess) {
        onSuccess(result.overlayUrl);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Keep showing the current image if there is one
    setPreviewUrl(currentOverlayUrl || null);
  };

  return (
    <div className="space-y-2">
      
      {/* Image Preview Area */}
      <div 
        className="border rounded p-2 w-full h-16 flex items-center justify-center bg-card/50 relative"
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3e%3cdefs%3e%3cpattern id="a" patternUnits="userSpaceOnUse" width="20" height="20"%3e%3crect fill="%23f1f5f9" width="10" height="10"/%3e%3crect fill="%23e2e8f0" x="10" y="10" width="10" height="10"/%3e%3c/pattern%3e%3c/defs%3e%3crect width="100" height="100" fill="url(%23a)"/%3e%3c/svg%3e")'
        }}
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <img 
              src={previewUrl} 
              alt="Overlay Preview" 
              className="w-full h-full object-contain"
              onError={() => setPreviewUrl(null)}
            />
          </div>
        ) : (
          <div className="flex items-center text-muted-foreground">
            <Layers className="h-4 w-4 opacity-50" />
          </div>
        )}
      </div>
      
      {/* Upload Controls */}
      <div className="flex gap-1">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          type="button"
          size="sm"
          className="flex-1 text-xs h-6"
        >
          <Layers className="h-3 w-3 mr-1" />
          Select
        </Button>
        
        <Button 
          onClick={handleUpload} 
          type="button"
          disabled={isUploading || !fileInputRef.current?.files?.[0]}
          size="sm"
          className="flex-1 text-xs h-6"
        >
          <Upload className="h-3 w-3 mr-1" />
          {isUploading ? "..." : "Upload"}
        </Button>
        
        {previewUrl && previewUrl !== currentOverlayUrl && (
          <Button 
            variant="ghost" 
            onClick={clearSelection}
            type="button"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}