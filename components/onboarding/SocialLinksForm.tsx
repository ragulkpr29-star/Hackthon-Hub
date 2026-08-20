import { Code2, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


interface SocialLinksFormProps {
  githubUrl: string;
  onGithubUrlChange: (url: string) => void;

  linkedinUrl: string;
  onLinkedinUrlChange: (url: string) => void;

  portfolioUrl: string;
  onPortfolioUrlChange: (url: string) => void;

  githubError?: string;
  linkedinError?: string;
  portfolioError?: string;
}



export function SocialLinksForm({
  githubUrl,
  onGithubUrlChange,

  linkedinUrl,
  onLinkedinUrlChange,

  portfolioUrl,
  onPortfolioUrlChange,

  githubError,
  linkedinError,
  portfolioError,
}: SocialLinksFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">GitHub Profile URL <span className="text-red-500">*</span></Label>
        <div className="relative flex items-center">
          <Code2 className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://github.com/username"
            value={githubUrl}
            onChange={(e) => onGithubUrlChange(e.target.value)}
            className={`pl-10 rounded-xl ${githubError ? 'border-destructive' : ''}`}
          />
        </div>
        {githubError && <p className="text-xs text-destructive">{githubError}</p>}
      </div>


      <div className="space-y-2">
        <Label className="text-sm font-medium">LinkedIn Profile URL <span className="text-red-500">*</span></Label>

        <div className="relative flex items-center">
          <Globe className="absolute left-3 h-4 w-4 text-muted-foreground" />

          <Input
            type="url"
            placeholder="https://www.linkedin.com/in/your-profile"
            value={linkedinUrl}
            onChange={(e) => onLinkedinUrlChange(e.target.value)}
            className={`pl-10 rounded-xl ${linkedinError ? "border-destructive" : ""
              }`}
          />
        </div>

        {linkedinError && (
          <p className="text-xs text-destructive">
            {linkedinError}
          </p>
        )}
      </div>







      <div className="space-y-2">
        <Label className="text-sm font-medium">Portfolio/Website URL</Label>
        <div className="relative flex items-center">
          <Globe className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://yourwebsite.com"
            value={portfolioUrl}
            onChange={(e) => onPortfolioUrlChange(e.target.value)}
            className={`pl-10 rounded-xl ${portfolioError ? 'border-destructive' : ''}`}
          />
        </div>
        {portfolioError && <p className="text-xs text-destructive">{portfolioError}</p>}
      </div>
    </div>
  );
}
