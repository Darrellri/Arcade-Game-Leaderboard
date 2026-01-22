import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface MarqueeImageUploaderProps {
  gameId: number;
  currentImageUrl?: string | null;
  onSuccess?: (imageUrl: string) => void;
}

export default function MarqueeImageUploader({ 
  gameId, 
  currentImageUrl, 
  onSuccess 
}: MarqueeImageUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
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
      formData.append('marqueeImage', file);

      const response = await fetch(`/api/games/${gameId}/upload-marquee`, {
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
        title: "Image uploaded successfully",
        description: "The game marquee has been updated."
      });

      // Set the new image URL and call onSuccess callback if provided
      setPreviewUrl(result.imageUrl);
      if (onSuccess) {
        onSuccess(result.imageUrl);
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
    setPreviewUrl(currentImageUrl || null);
  };

  return (
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
        className="text-xs h-8"
      >
        <ImageIcon className="h-3 w-3 mr-1" />
        Select
      </Button>
      
      <Button 
        onClick={handleUpload} 
        type="button"
        disabled={isUploading || !fileInputRef.current?.files?.[0]}
        size="sm"
        className="text-xs h-8"
      >
        <Upload className="h-3 w-3 mr-1" />
        {isUploading ? "..." : "Upload"}
      </Button>
      
      {previewUrl && previewUrl !== currentImageUrl && (
        <Button 
          variant="ghost" 
          onClick={clearSelection}
          type="button"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}