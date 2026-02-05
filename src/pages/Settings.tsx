import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  Camera,
  Trash2,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  full_name: string;
  job_title: string;
  avatar_url: string;
}

interface NotificationSettings {
  emailAlerts: boolean;
  carbonThresholdAlerts: boolean;
  weeklyReports: boolean;
  modelStatusUpdates: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    job_title: '',
    avatar_url: '',
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    carbonThresholdAlerts: true,
    weeklyReports: true,
    modelStatusUpdates: false,
  });
  const [theme, setTheme] = useState('system');
  const [carbonThreshold, setCarbonThreshold] = useState('2.0');

  // Automation Rules State
  const [automation, setAutomation] = useState({
    autoSleep: true,
    greenOnly: false,
    rightSizing: true
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      // Load settings from metadata if available
      if (user.user_metadata?.automation) {
        setAutomation(user.user_metadata.automation);
      }
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || user?.user_metadata?.full_name || '',
          job_title: data.job_title || '',
          avatar_url: data.avatar_url || user?.user_metadata?.avatar_url || '',
        });
      } else {
        setProfile({
          full_name: user?.user_metadata?.full_name || '',
          job_title: '',
          avatar_url: user?.user_metadata?.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Update the 'profiles' table (Application Data)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          job_title: profile.job_title,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // 2. Update Supabase Auth User Metadata (Session Data)
      // This ensures components relying on user.user_metadata (like AppLayout) update immediately.
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          job_title: profile.job_title, // Persist job title for AppLayout
          automation: automation // Persist automation settings
        }
      });

      if (authError) throw authError;

      toast.success('Settings and Profile updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (profile.full_name) {
      const names = profile.full_name.split(' ');
      return names.map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Manual client-side deletion (Plan B) - robust and reliable
      // 1. Delete dependent data
      await supabase.from('energy_sources').delete().eq('user_id', user.id);
      await supabase.from('certificates').delete().eq('user_id', user.id);
      await supabase.from('carbon_logs').delete().eq('user_id', user.id);

      // 2. Delete models (cascades to energy_logs)
      await supabase.from('models').delete().eq('user_id', user.id);

      // 3. Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // 4. Sign out
      await supabase.auth.signOut();

      toast.success('Account data reset successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(`Failed to reset data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{profile.full_name || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={profile.job_title}
                  onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                  placeholder="e.g., Lead Engineer"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Alerts</p>
                <p className="text-sm text-muted-foreground">Receive important updates via email</p>
              </div>
              <Switch
                checked={notifications.emailAlerts}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailAlerts: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Carbon Threshold Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when emissions exceed limits</p>
              </div>
              <Switch
                checked={notifications.carbonThresholdAlerts}
                onCheckedChange={(checked) => setNotifications({ ...notifications, carbonThresholdAlerts: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">Receive weekly sustainability summaries</p>
              </div>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Model Status Updates</p>
                <p className="text-sm text-muted-foreground">Alerts for model state changes</p>
              </div>
              <Switch
                checked={notifications.modelStatusUpdates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, modelStatusUpdates: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Automation Rules (New) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Automation Rules</CardTitle>
                <CardDescription>Configure autonomous fleet management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Sleep Idle Models</p>
                <div className="text-sm text-muted-foreground">
                  Automatically suspend models if inactive for &gt; 2 hours.
                  <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 text-primary border-primary/20">
                    Avg. Savings: 12%
                  </Badge>
                </div>
              </div>
              <Switch
                checked={automation.autoSleep}
                onCheckedChange={(c) => setAutomation(prev => ({ ...prev, autoSleep: c }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enforce Green Only</p>
                <div className="text-sm text-muted-foreground">
                  Prevent deployment to regions with &lt; 50% renewable energy.
                </div>
              </div>
              <Switch
                checked={automation.greenOnly}
                onCheckedChange={(c) => setAutomation(prev => ({ ...prev, greenOnly: c }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Rightsizing Assistant</p>
                <div className="text-sm text-muted-foreground">
                  Automatically suggest smaller instance types for low load models.
                </div>
              </div>
              <Switch
                checked={automation.rightSizing}
                onCheckedChange={(c) => setAutomation(prev => ({ ...prev, rightSizing: c }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize your interface</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Carbon Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Carbon Thresholds</CardTitle>
                <CardDescription>Set your sustainability targets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="carbonThreshold">Monthly CO₂ Limit (tonnes)</Label>
                <Input
                  id="carbonThreshold"
                  type="number"
                  step="0.1"
                  value={carbonThreshold}
                  onChange={(e) => setCarbonThreshold(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export or manage your data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export All Data</p>
                <p className="text-sm text-muted-foreground">Download all your models, logs, and certificates</p>
              </div>
              <Button variant="outline">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently remove your account and all data</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and all associated data. Your login credentials will be removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div >
    </AppLayout >
  );
};

export default Settings;
