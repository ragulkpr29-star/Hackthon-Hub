import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ProfilePhotoUploaderProps {
  initialImage?: string;
  onFileSelect: (file: File | undefined) => void;
  name: string;
}

export function ProfilePhotoUploader({ initialImage, onFileSelect, name }: ProfilePhotoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onFileSelect(file);
    }
  };

  const clearSelection = () => {
    setPreviewUrl(initialImage);
    onFileSelect(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = (n: string) => n.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="h-32 w-32 border-4 border-background shadow-xl ring-2 ring-primary/20 transition-all duration-300">
          <AvatarImage src={previewUrl} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        <label 
          htmlFor="avatar-upload" 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm"
        >
          <Camera className="h-8 w-8 mb-1" />
          <span className="text-xs font-medium">Upload</span>
        </label>
        
        <input 
          id="avatar-upload"
          type="file" 
          accept="image/*"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        {previewUrl && previewUrl !== initialImage && (
          <button 
            type="button"
            onClick={clearSelection}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        Allowed *.jpeg, *.jpg, *.png, *.gif <br /> Max size of 5MB
      </p>
    </div>
  );
}
