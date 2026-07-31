'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Users, Brain, Trophy, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Skill Analysis',
    description: 'Get your technical skills verified through resume, GitHub, portfolio, and certificate analysis.',
  },
  {
    icon: Users,
    title: 'Smart Team Discovery',
    description: 'Find complementary teammates across departments with AI compatibility matching.',
  },
  {
    icon: Trophy,
    title: 'Hackathon Collaboration',
    description: 'Join hackathons, manage projects with Kanban boards, and track your team\'s progress.',
  },
  {
    icon: Shield,
    title: 'Verified Profiles Only',
    description: 'Every profile belongs to a verified KEC student. No fake accounts, no fake scores.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-chart-2/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-chart-3/5 blur-[100px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">Hackathon Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="rounded-xl">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="rounded-xl gradient-primary text-white border-0 hover:opacity-90 transition-opacity">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Exclusive to Kongu Engineering College
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1]"
        >
          Build Better Teams.{' '}
          <span className="text-gradient">Build Bigger Ideas.</span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
        >
          The AI-powered collaboration platform where KEC students discover teammates,
          verify technical skills, and build winning hackathon projects together.
        </motion.p>

        <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/register">
            <Button
              size="lg"
              className="rounded-2xl gradient-primary text-white border-0 px-8 h-13 text-base font-semibold hover:opacity-90 transition-all glow-pulse"
            >
              Join Hackathon Hub
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl px-8 h-13 text-base font-semibold"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="relative z-10 px-6 sm:px-10 pb-24 max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group glass-card rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10 transition-all group-hover:bg-primary/15">
                <feature.icon className="h-6 w-6 text-primary" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hackathon Hub — Kongu Engineering College Innovation Cell
          </p>
          <p className="text-xs text-muted-foreground">
            Built for KEC students, by KEC students.
          </p>
        </div>
      </footer>
    </div>
  );
}
