import { useState, useRef } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResumeUploaderProps {
  onFileSelect: (file: File | undefined) => void;
  initialResumeUrl?: string | null;
}

export function ResumeUploader({ onFileSelect, initialResumeUrl }: ResumeUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const clearSelection = () => {
    setFile(null);
    onFileSelect(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
          file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/50'
        }`}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          accept="application/pdf"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        {file ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); clearSelection(); }} className="mt-2 h-8 rounded-full">
              <X className="h-3 w-3 mr-1.5" /> Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Click to upload your resume</p>
              <p className="text-xs text-muted-foreground mt-1">PDF only, maximum 10MB</p>
            </div>
            {initialResumeUrl && (
              <p className="text-xs text-primary font-medium mt-2">
                You already have a resume uploaded. Uploading a new one will replace it.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
