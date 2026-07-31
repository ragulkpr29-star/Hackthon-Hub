import { Label } from '@/components/ui/label';

interface AvailabilitySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const AVAILABILITY_OPTIONS = [
  { id: 'looking_for_team', label: 'Looking for Team', desc: 'Actively searching for teammates' },
  { id: 'in_team', label: 'Already in Team', desc: 'Currently participating with a team' },
  { id: 'available', label: 'Available for Collaboration', desc: 'Open to part-time collaboration' },
  { id: 'busy', label: 'Busy', desc: 'Not looking for projects right now' },
];

export function AvailabilitySelector({ value, onChange }: AvailabilitySelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Availability Status</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AVAILABILITY_OPTIONS.map((opt) => (
          <label 
            key={opt.id}
            className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
              value === opt.id 
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                : 'border-border/50 hover:bg-muted/50'
            }`}
          >
            <input 
              type="radio" 
              name="availability" 
              value={opt.id} 
              checked={value === opt.id}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1 text-primary focus:ring-primary h-4 w-4"
            />
            <div>
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
