import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface SkillsSelectorProps {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
}

export function SkillsSelector({ label, placeholder, value, onChange, suggestions = [] }: SkillsSelectorProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputValue);
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter(item => item !== itemToRemove));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="px-3 py-1.5 text-xs rounded-full flex items-center gap-1.5 group">
            {item}
            <button
              type="button"
              onClick={() => handleRemove(item)}
              className="text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative flex items-center">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="rounded-xl pr-10"
        />
        <button
          type="button"
          onClick={() => handleAdd(inputValue)}
          disabled={!inputValue.trim()}
          className="absolute right-2 text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {suggestions.filter(s => !value.includes(s)).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleAdd(suggestion)}
              className="text-[10px] px-2 py-1 rounded-md border border-border bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
