'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Hackathon } from '@/lib/types';

export default function HackathonDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MOCK UI DEMONSTRATION
    setTimeout(() => {
      setHackathon({
        id: id,
        title: 'KEC Innovate 2026',
        description: 'The premier annual hackathon at Kongu Engineering College. Build solutions for real-world problems using AI, IoT, and Cloud. This 48-hour intensive hackathon challenges students to push the boundaries of technology and create impactful projects.\n\nThemes include:\n- Sustainable Technology\n- AI in Education\n- Smart Campus Solutions\n- Blockchain and Web3\n\nJoin us for an unforgettable weekend of coding, networking, and innovation!',
        status: 'upcoming',
        registration_deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
        end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 17).toISOString(),
        team_size_min: 2,
        team_size_max: 4,
        tech_domain: ['AI/ML', 'IoT', 'Web3', 'Cloud'],
        prize: '₹50,000 Prize Pool',
        banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=2000',
        registration_link: '#',
        created_at: new Date().toISOString()
      } as Hackathon);
      setLoading(false);
    }, 800);
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-64 rounded-2xl bg-card animate-pulse border border-border/50" />
        <div className="h-96 rounded-2xl bg-card animate-pulse border border-border/50" />
      </div>
    );
  }

  if (!hackathon) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Hero Section */}
      <Card className="glass-card border-border/50 rounded-2xl overflow-hidden shadow-xl shadow-primary/5">
        <div className="h-64 sm:h-80 gradient-primary relative">
          {hackathon.banner_url && (
            <img
              src={hackathon.banner_url}
              alt={hackathon.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6">
            <Badge className="mb-4 rounded-full bg-blue-500 text-white border-0 px-3 py-1 text-sm font-semibold shadow-lg">
              {hackathon.status.toUpperCase()}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
              {hackathon.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4" /> Kongu Engineering College
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="h-4 w-4" /> {hackathon.team_size_min}-{hackathon.team_size_max} Members
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" /> About the Hackathon
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {hackathon.description}
                  </p>
                </div>
              </div>

              {hackathon.tech_domain && hackathon.tech_domain.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Domains</h3>
                  <div className="flex flex-wrap gap-2">
                    {hackathon.tech_domain.map(domain => (
                      <Badge key={domain} variant="secondary" className="rounded-full px-4 py-1.5 text-sm">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-5 border border-border/50 space-y-4 shadow-md">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Event Dates</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(hackathon.start_date!).toLocaleDateString()} - {new Date(hackathon.end_date!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="opacity-50" />
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Registration Closes</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(hackathon.registration_deadline!), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="opacity-50" />

                  <div className="flex items-start gap-3">
                    <Trophy className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Prize</p>
                      <p className="text-xs text-muted-foreground mt-1">{hackathon.prize}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button className="w-full rounded-xl h-12 font-bold gradient-primary text-white border-0 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                    Register Now
                  </Button>
                  <Button variant="outline" className="w-full rounded-xl h-12 font-semibold mt-3">
                    Find Teammates
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
