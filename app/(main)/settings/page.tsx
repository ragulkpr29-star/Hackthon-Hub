'use client';

import { useRef, useState } from 'react';
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
  Laptop,
  Camera,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { profile, user } = useAuth();

  const supabase = createClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Temporary preview selected by the user
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // State for password change
  const [newPassword, setNewPassword] = useState('');

  // Mock State for notifications/privacy until we add a settings table
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('public');

  /*
   * ============================================================
   * PROFILE IMAGE
   * ============================================================
   */

  const handleAvatarSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMsg('');
    setSuccess(false);

    // Validate file type
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setErrorMsg(
        'Please select a JPG, PNG, or WebP image.'
      );

      event.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      setErrorMsg(
        'Profile picture must be smaller than 5 MB.'
      );

      event.target.value = '';
      return;
    }

    // Remove previous preview URL
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  };

  const cancelAvatarSelection = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(null);
    setAvatarPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setErrorMsg('');
  };

  /*
   * Upload profile picture and update profiles.avatar_url
   */
  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;

    setAvatarLoading(true);
    setErrorMsg('');

    try {
      const fileExtension =
        avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';

      const filePath = `${user.id}/avatar-${Date.now()}.${fileExtension}`;

      // Upload to the EXISTING avatars bucket
      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: avatarFile.type,
          });

      if (uploadError) {
        throw new Error(
          uploadError.message || 'Failed to upload profile picture.'
        );
      }

      if (!uploadData?.path) {
        throw new Error(
          'Profile picture uploaded but no storage path was returned.'
        );
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      const avatarUrl = publicUrlData.publicUrl;

      if (!avatarUrl) {
        throw new Error(
          'Could not generate the profile picture URL.'
        );
      }

      // Save URL to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(
          profileError.message ||
            'Failed to save profile picture to your profile.'
        );
      }

      // Clear temporary state
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }

      setAvatarFile(null);
      setAvatarPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccess(true);

      /*
       * Reload after a successful database update.
       * This makes useAuth() fetch the new avatar_url
       * so the new image appears everywhere.
       */
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error('Avatar upload failed:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Failed to update profile picture.'
      );
    } finally {
      setAvatarLoading(false);
    }
  };

  /*
   * ============================================================
   * SAVE ACCOUNT SETTINGS
   * ============================================================
   */

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      // Upload avatar first if the user selected a new one
      if (avatarFile) {
        await uploadAvatar();

        /*
         * uploadAvatar handles its own loading/error state.
         * If the profile picture upload fails, don't continue.
         */
        if (avatarFile) {
          setLoading(false);
          return;
        }
      }

      // Password change
      if (newPassword) {
        if (newPassword.length < 6) {
          setErrorMsg(
            'New password must be at least 6 characters'
          );
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        setNewPassword('');
      }

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Settings save failed:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving your settings.'
      );

      setLoading(false);
    }
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  const currentAvatar =
    avatarPreview || profile.avatar_url || null;

  const initials =
    profile.name
      ?.split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Settings
        </h1>

        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences and application settings.
        </p>
      </div>

      <Tabs
        defaultValue="account"
        className="flex flex-col md:flex-row gap-6"
      >
        <TabsList className="flex md:flex-col bg-transparent justify-start w-full md:w-48 h-auto space-x-2 md:space-x-0 md:space-y-2 p-0">
          <TabsTrigger
            value="account"
            className="w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>

          <TabsTrigger
            value="appearance"
            className="w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>

          <TabsTrigger
            value="notifications"
            className="w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>

          <TabsTrigger
            value="privacy"
            className="w-full justify-start rounded-xl px-4 py-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          {/* =====================================================
              ACCOUNT
          ====================================================== */}

          <TabsContent
            value="account"
            className="mt-0 space-y-4 outline-none"
          >
            {/* PROFILE PICTURE */}
            <Card className="glass-card border-border/50 rounded-2xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">
                  Profile Picture
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  Add or change the picture shown on your profile.
                </p>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-background shadow-xl ring-2 ring-primary/20 bg-primary/10 flex items-center justify-center">
                      {currentAvatar ? (
                        <img
                          src={currentAvatar}
                          alt={`${profile.name}'s profile`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {initials}
                        </span>
                      )}
                    </div>

                    {/* Camera badge */}
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={avatarLoading}
                      className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                      aria-label="Change profile picture"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Controls */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-base">
                      {profile.avatar_url
                        ? 'Your profile picture'
                        : 'No profile picture yet'}
                    </h3>

                    <p className="text-sm text-muted-foreground mt-1">
                      {profile.avatar_url
                        ? 'This picture is visible across Hackathon Hub.'
                        : 'Add a profile picture so teammates can recognize you.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        disabled={avatarLoading}
                      >
                        <Upload className="h-4 w-4 mr-2" />

                        {profile.avatar_url
                          ? 'Change Photo'
                          : 'Add Photo'}
                      </Button>

                      {avatarFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={cancelAvatarSelection}
                          disabled={avatarLoading}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                      JPG, PNG or WebP • Maximum 5 MB
                    </p>

                    {/* Save selected avatar */}
                    {avatarFile && (
                      <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {avatarFile.name}
                            </p>

                            <p className="text-xs text-muted-foreground mt-1">
                              {(avatarFile.size / 1024 / 1024).toFixed(
                                2
                              )}{' '}
                              MB
                            </p>
                          </div>

                          <Button
                            type="button"
                            onClick={uploadAvatar}
                            disabled={avatarLoading}
                            className="rounded-xl gradient-primary text-white shrink-0"
                          >
                            {avatarLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Photo
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ACCOUNT INFORMATION */}
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  Account Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>

                  <Input
                    value={user?.email || profile.email}
                    disabled
                    className="bg-muted/50 rounded-xl"
                  />

                  <p className="text-[10px] text-muted-foreground">
                    Linked to your KEC Google Workspace
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Student ID</Label>

                  <Input
                    value={profile.student_id}
                    disabled
                    className="bg-muted/50 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* CHANGE PASSWORD */}
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  Change Password
                </CardTitle>
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
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =====================================================
              APPEARANCE
          ====================================================== */}

          <TabsContent
            value="appearance"
            className="mt-0 space-y-4 outline-none"
          >
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  Theme Preferences
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <Sun className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">
                      Light
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <Moon className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">
                      Dark
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      theme === 'system'
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/30'
                    }`}
                  >
                    <Laptop className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">
                      System
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =====================================================
              NOTIFICATIONS
          ====================================================== */}

          <TabsContent
            value="notifications"
            className="mt-0 space-y-4 outline-none"
          >
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  Notification Preferences
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      Email Notifications
                    </Label>

                    <p className="text-sm text-muted-foreground">
                      Receive updates directly to your inbox
                    </p>
                  </div>

                  <Switch
                    checked={emailNotifs}
                    onCheckedChange={setEmailNotifs}
                  />
                </div>

                <Separator className="opacity-50" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      Push Notifications
                    </Label>

                    <p className="text-sm text-muted-foreground">
                      Receive notifications in your browser
                    </p>
                  </div>

                  <Switch
                    checked={pushNotifs}
                    onCheckedChange={setPushNotifs}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* =====================================================
              PRIVACY
          ====================================================== */}

          <TabsContent
            value="privacy"
            className="mt-0 space-y-4 outline-none"
          >
            <Card className="glass-card border-border/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">
                  Privacy Settings
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">
                    Profile Visibility
                  </Label>

                  <p className="text-sm text-muted-foreground mb-4">
                    Control who can see your profile details and
                    skills.
                  </p>

                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={
                          profileVisibility === 'public'
                        }
                        onChange={(e) =>
                          setProfileVisibility(e.target.value)
                        }
                        className="text-primary focus:ring-primary h-4 w-4"
                      />

                      <div>
                        <p className="font-medium">
                          Public (KEC Network)
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Anyone in Kongu Engineering College can
                          view your profile
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="radio"
                        name="visibility"
                        value="connections"
                        checked={
                          profileVisibility === 'connections'
                        }
                        onChange={(e) =>
                          setProfileVisibility(e.target.value)
                        }
                        className="text-primary focus:ring-primary h-4 w-4"
                      />

                      <div>
                        <p className="font-medium">
                          Connections Only
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Only connected teammates can view your
                          full details
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GLOBAL SAVE */}
          <div className="mt-6 flex justify-end">
            {errorMsg && (
              <div className="mr-4 flex-1 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || success || avatarLoading}
              className={`rounded-xl h-11 px-8 font-semibold text-white transition-all ${
                success
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'gradient-primary hover:opacity-90'
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}