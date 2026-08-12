'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  jobId: string;
  onComplete: () => void;
  onError: (msg: string) => void;
}

interface JobStatus {
  status: string;
  progress: number;
  current_step: string;
  error_message?: string | null;
}

const PIPELINE_STEPS = [
  { status: 'FETCHING_GITHUB', label: 'Fetching GitHub profile', emoji: '🔍' },
  { status: 'ANALYZING_REPOSITORIES', label: 'Analyzing repositories', emoji: '📦' },
  { status: 'CALCULATING_METRICS', label: 'Parsing resume', emoji: '📄' },
  { status: 'GENERATING_AI', label: 'Running AI analysis', emoji: '🤖' },
  { status: 'CALCULATING_SCORES', label: 'Calculating skill scores', emoji: '📊' },
  { status: 'SAVING_RESULTS', label: 'Saving your profile', emoji: '💾' },
  { status: 'COMPLETED', label: 'Analysis complete!', emoji: '✨' },
];

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const STATUS_ORDER = PIPELINE_STEPS.map((s) => s.status);

function getStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function AnalysisLoadingOverlay({ jobId, onComplete, onError }: Props) {
  const [job, setJob] = useState<JobStatus>({
    status: 'PENDING',
    progress: 0,
    current_step: 'Initializing...',
  });
  const [dots, setDots] = useState('');
  const timedOut = useRef(false);
  const startedAt = useRef(Date.now());

  // Animated dots for the "thinking" indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Polling loop
  useEffect(() => {
    let active = true;

    const poll = async () => {
      if (!active || timedOut.current) return;

      // Timeout guard
      if (Date.now() - startedAt.current > TIMEOUT_MS) {
        timedOut.current = true;
        onError('Analysis timed out after 5 minutes. Please try again.');
        return;
      }

      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          console.error('Job status fetch failed:', res.status);
          return;
        }

        const data = await res.json();
        const currentJob: JobStatus = data.job || data;

        if (active) {
          setJob(currentJob);
        }

        if (currentJob.status === 'COMPLETED') {
          if (active) {
            // Small delay so the user sees "100%" before redirect
            setTimeout(() => onComplete(), 800);
          }
          return;
        }

        if (currentJob.status === 'FAILED') {
          if (active) {
            onError(currentJob.error_message || 'Analysis failed. Please try again.');
          }
          return;
        }

        // Continue polling
        if (active) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (active) {
          setTimeout(poll, POLL_INTERVAL_MS * 2);
        }
      }
    };

    // Start polling
    setTimeout(poll, 500);

    return () => {
      active = false;
    };
  }, [jobId, onComplete, onError]);

  const currentStepIndex = getStepIndex(job.status);
  const progress = job.progress || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative w-full max-w-md mx-4"
        >
          {/* Card */}
          <div className="glass-card rounded-3xl border border-border/50 p-8 shadow-2xl">

            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block text-4xl mb-3"
              >
                <Sparkles className="h-10 w-10 text-primary mx-auto" />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">
                Building your AI Profile
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {job.current_step}{dots}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Progress</span>
                <span className="font-mono font-medium text-foreground">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-primary bg-[length:200%_100%]"
                  initial={{ width: '0%' }}
                  animate={{
                    width: `${progress}%`,
                    backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                  }}
                  transition={{
                    width: { duration: 0.5, ease: 'easeOut' },
                    backgroundPosition: { duration: 2, repeat: Infinity, ease: 'linear' },
                  }}
                />
              </div>
            </div>

            {/* Pipeline Steps */}
            <div className="space-y-2">
              {PIPELINE_STEPS.map((step, index) => {
                const isDone = index < currentStepIndex;
                const isCurrent = index === currentStepIndex && job.status !== 'COMPLETED';
                const isCompleted = job.status === 'COMPLETED';

                return (
                  <motion.div
                    key={step.status}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isDone || isCurrent || isCompleted ? 1 : 0.35, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                      isCurrent
                        ? 'bg-primary/10 border border-primary/20'
                        : isDone || isCompleted
                        ? 'bg-muted/30'
                        : ''
                    }`}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      {isDone || isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', damping: 12 }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </motion.div>
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border/50 bg-muted/30" />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-sm ${
                        isCurrent
                          ? 'text-foreground font-medium'
                          : isDone || isCompleted
                          ? 'text-muted-foreground line-through'
                          : 'text-muted-foreground/50'
                      }`}
                    >
                      <span className="mr-1.5">{step.emoji}</span>
                      {step.label}
                    </span>

                    {/* Current indicator */}
                    {isCurrent && (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="ml-auto text-xs text-primary font-medium"
                      >
                        Running
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground text-center mt-6">
              This usually takes 30–60 seconds. Do not close this page.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
