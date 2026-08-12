'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Lock,
  Palette,
  Shield,
  Loader2,
  CheckCircle2,
  Save,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { profile, user } = useAuth();
  const supabase = createClient();

  // State for password change
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Mock State for notifications/privacy until we add a settings table
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('public');

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg('');

    // Only attempt password change if a new password is provided
    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // Clear password fields on success
      setPassword('');
      setNewPassword('');
    }

    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences and application settings.
        </p>
      </div>

      <Tabs defaultValue="account" className="flex flex-col md:flex-row gap-6">
        <TabsList className="flex md:flex-col bg-transparent justify-start w-full md:w-48 h-auto space-x-2 md:space-x-0 md:space-y-2 p-0">
          <TabsTrigger value="account" className="w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <User className="h-4 w-4 mr-2" /> Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Palette className="h-4 w-4 mr-2" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Bell className="h-4 w-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Shield className="h-4 w-4 mr-2" /> Privacy
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="account" className="mt-0 space-y-4 outline-none">
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={user?.email || profile.email} disabled className="bg-muted/50 rounded-xl" />
                  <p className="text-[10px] text-muted-foreground">Linked to your KEC Google Workspace</p>
                </div>
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input value={profile.student_id} disabled className="bg-muted/50 rounded-xl" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorMsg && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {errorMsg}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="rounded-xl"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 space-y-4 outline-none">
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Theme Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                  >
                    <Sun className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                  >
                    <Moon className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                  >
                    <Laptop className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 space-y-4 outline-none">
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates directly to your inbox</p>
                  </div>
                  <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                </div>
                <Separator className="opacity-50" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                  </div>
                  <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="mt-0 space-y-4 outline-none">
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground mb-4">Control who can see your profile details and skills.</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={profileVisibility === 'public'}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <div>
                        <p className="font-medium">Public (KEC Network)</p>
                        <p className="text-xs text-muted-foreground">Anyone in Kongu Engineering College can view your profile</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="visibility"
                        value="connections"
                        checked={profileVisibility === 'connections'}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="text-primary focus:ring-primary h-4 w-4"
                      />
                      <div>
                        <p className="font-medium">Connections Only</p>
                        <p className="text-xs text-muted-foreground">Only connected teammates can view your full details</p>
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading || success}
              className={`rounded-xl h-11 px-8 font-semibold text-white transition-all ${success ? 'bg-green-500 hover:bg-green-600' : 'gradient-primary hover:opacity-90'
                }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
