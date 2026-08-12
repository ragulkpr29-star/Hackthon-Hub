'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  TrendingUp,
  Star,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AiAnalysis {
  professional_summary?: string | null;
  experience_level?: string | null;
  overall_score: number;
  frontend_score: number;
  backend_score: number;
  ai_score: number;
  cloud_score: number;
  problem_solving_score: number;
  strengths: string[];
  weaknesses: string[];
  recommended_role?: string | null;
}

interface DeveloperVector {
  frontend_score: number;
  backend_score: number;
  database_score: number;
  cloud_score: number;
  ai_score: number;
  mobile_score: number;
  problem_solving_score: number;
  leadership_score: number;
  overall_score: number;
  recommended_role?: string | null;
  experience_level?: string | null;
  professional_summary?: string | null;
}

interface AnalysisData {
  aiAnalysis: AiAnalysis | null;
  developerVector: DeveloperVector | null;
  skillScores: Array<{ category: string; score: number }>;
}

const EXPERIENCE_COLORS: Record<string, string> = {
  Beginner: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Advanced: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Expert: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

function ScoreBar({
  label,
  score,
  delay = 0,
  color = 'from-primary to-violet-500',
}: {
  label: string;
  score: number;
  delay?: number;
  color?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{score}</span>
      </div>
      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}

function CircularScore({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? '#10b981'
      : score >= 60
      ? '#8b5cf6'
      : score >= 40
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg width="96" height="96" className="-rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted/30"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-bold text-foreground leading-none">{score}</div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">Overall</div>
      </div>
    </div>
  );
}

export function AiProfileCard() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch('/api/analysis/me');
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
      } catch {
        // Fail silently — card shows empty state
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="glass-card rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Profile</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading your AI profile...</p>
        </div>
      </div>
    );
  }

  const ai = data?.aiAnalysis;
  const vec = data?.developerVector;

  // No data yet — analysis not completed
  if (!ai && !vec) {
    return (
      <div className="glass-card rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Profile</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Your AI profile is being generated</p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete onboarding with a GitHub URL to unlock your AI analysis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const overallScore = vec?.overall_score ?? ai?.overall_score ?? 0;
  const experienceLevel = vec?.experience_level ?? ai?.experience_level ?? 'Intermediate';
  const recommendedRole = vec?.recommended_role ?? ai?.recommended_role ?? 'Developer';
  const summary = vec?.professional_summary ?? ai?.professional_summary ?? '';
  const strengths = (ai?.strengths ?? []).slice(0, 4);
  const weaknesses = (ai?.weaknesses ?? []).slice(0, 2);

  const skillBars = [
    { label: 'Frontend', score: vec?.frontend_score ?? ai?.frontend_score ?? 0, color: 'from-blue-500 to-cyan-400' },
    { label: 'Backend', score: vec?.backend_score ?? ai?.backend_score ?? 0, color: 'from-violet-500 to-purple-400' },
    { label: 'AI / ML', score: vec?.ai_score ?? ai?.ai_score ?? 0, color: 'from-pink-500 to-rose-400' },
    { label: 'Cloud', score: vec?.cloud_score ?? ai?.cloud_score ?? 0, color: 'from-amber-500 to-orange-400' },
    { label: 'Database', score: vec?.database_score ?? 0, color: 'from-emerald-500 to-teal-400' },
    { label: 'Problem Solving', score: vec?.problem_solving_score ?? ai?.problem_solving_score ?? 0, color: 'from-indigo-500 to-blue-400' },
  ].filter((s) => s.score > 0);

  const expColor = EXPERIENCE_COLORS[experienceLevel] ?? EXPERIENCE_COLORS['Intermediate'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card rounded-2xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border/30">
        <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold">AI Profile</span>
        <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${expColor}`}>
          {experienceLevel}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Score + Role */}
        <div className="flex items-center gap-4">
          <CircularScore score={overallScore} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                Recommended Role
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {recommendedRole}
            </p>
            {summary && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* Skill Bars */}
        {skillBars.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Developer Vector
              </span>
            </div>
            {skillBars.map((bar, i) => (
              <ScoreBar
                key={bar.label}
                label={bar.label}
                score={bar.score}
                delay={i * 0.08}
                color={bar.color}
              />
            ))}
          </div>
        )}

        {/* Expandable: Strengths & Weaknesses */}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <div>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {expanded ? 'Hide' : 'Show'} Strengths & Weaknesses
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-3">
                    {strengths.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-emerald-500 font-semibold mb-1.5">
                          Strengths
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {strengths.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {weaknesses.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-amber-500 font-semibold mb-1.5">
                          Areas to Improve
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {weaknesses.map((w) => (
                            <span
                              key={w}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
