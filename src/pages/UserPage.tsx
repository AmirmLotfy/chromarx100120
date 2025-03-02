import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { storage } from "@/services/storageService";
import { getAnalyticsData } from "@/utils/analyticsUtils";
import { AnalyticsData } from "@/types/analytics";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { useSettings } from "@/stores/settingsStore";
import { useLanguage } from "@/stores/languageStore";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

// UI Components
import Layout from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Icons
import {
  User,
  Settings,
  LogOut,
  Bell,
  Palette,
  CreditCard,
  Lock,
  Languages,
  ChevronRight,
  Edit,
  Camera,
  Check,
  Activity,
  Clock,
  BookmarkIcon,
  Shield,
  LayoutGrid,
  BarChart,
  Heart,
  FileText
} from "lucide-react";

interface ProfileData {
  displayName: string;
  bio: string;
  location: string;
  email: string;
  avatarUrl: string;
}

interface ViewPreferences {
  defaultView: "grid" | "list";
  compactMode: boolean;
}

const UserPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Guest User');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    location: '',
    email: '',
    avatarUrl: ''
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [viewPreferences, setViewPreferences] = useState<ViewPreferences>({
    defaultView: "grid",
    compactMode: false
  });
  
  const settings = useSettings();
  const { theme, colorScheme, setTheme, setColorScheme } = settings;
  
  const { currentLanguage, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        if (user) {
          setUserName(user.email || 'Guest User');
          setCurrentPlan('free');
          setSubscriptionEnd(null);
          
          const storedProfile = await storage.get<ProfileData>('userProfile');
          if (storedProfile) {
            setProfileData({
              ...profileData,
              ...storedProfile,
              email: user.email || '',
              displayName: storedProfile.displayName || user.email || 'Guest User'
            });
          } else {
            setProfileData({
              ...profileData,
              displayName: user.email || 'Guest User',
              email: user.email || ''
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error('Failed to load profile data');
      }
    };

    loadProfileData();
  }, [user]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const data = await getAnalyticsData();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, []);

  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const storedPreferences = await storage.get<ViewPreferences>('viewPreferences');
        if (storedPreferences) {
          setViewPreferences(storedPreferences);
        }
      } catch (error) {
        console.error('Error loading view preferences:', error);
      }
    };

    loadUserPreferences();
  }, []);

  const plan = subscriptionPlans.find(p => p.id === currentPlan);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Image is too large. Please select an image under 2MB.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfileData(prev => ({
          ...prev,
          avatarUrl: base64String
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const saveProfile = async () => {
    try {
      await storage.set('userProfile', profileData);
      setUserName(profileData.displayName);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const saveViewPreferences = async () => {
    try {
      await storage.set('viewPreferences', viewPreferences);
      toast.success('View preferences saved');
    } catch (error) {
      console.error('Error saving view preferences:', error);
      toast.error('Failed to save view preferences');
    }
  };

  const handleThemeChange = (value: string) => {
    setTheme(value as 'light' | 'dark' | 'system');
    toast.success(`Theme changed to ${value}`);
  };

  const handleColorSchemeChange = (value: string) => {
    setColorScheme(value as 'default' | 'purple' | 'blue' | 'green');
    toast.success(`Color scheme changed to ${value}`);
  };

  const handleViewChange = (view: "grid" | "list") => {
    setViewPreferences(prev => ({
      ...prev,
      defaultView: view
    }));
  };

  const handleCompactModeChange = (checked: boolean) => {
    setViewPreferences(prev => ({
      ...prev,
      compactMode: checked
    }));
  };

  const formatTime = (timeMs: number) => {
    const hours = Math.floor(timeMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const ProfileHeader = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative pb-20 pt-6 px-4 bg-gradient-to-br from-primary/80 to-primary/40 rounded-b-3xl shadow-md"
    >
      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage src={profileData.avatarUrl} alt={profileData.displayName} />
            <AvatarFallback className="text-2xl bg-primary/20">
              {getInitials(profileData.displayName || userName)}
            </AvatarFallback>
          </Avatar>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)} 
              size="icon" 
              className="absolute bottom-0 right-0 h-9 w-9 rounded-full shadow-lg"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow-sm">
            {plan?.name || 'Free'} Plan
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="text-background/80 hover:text-background hover:bg-primary/30">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="text-center text-background/90">
        <h1 className="text-xl font-semibold">{profileData.displayName || userName}</h1>
        {profileData.location && (
          <p className="text-sm mt-1 opacity-80">{profileData.location}</p>
        )}
      </div>
    </motion.div>
  );

  const ProfileNameBio = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="mt-20 mb-6 text-center px-4"
    >
      <h1 className="text-xl font-semibold">{profileData.displayName || userName}</h1>
      {profileData.location && (
        <p className="text-sm text-muted-foreground mt-1">{profileData.location}</p>
      )}
      {profileData.bio && (
        <p className="text-sm mt-3 max-w-md mx-auto">{profileData.bio}</p>
      )}
    </motion.div>
  );

  const renderProfileEditForm = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 space-y-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="avatar">Profile Picture</Label>
        <div className="flex items-center gap-4 mt-2">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={profileData.avatarUrl} alt={profileData.displayName} />
            <AvatarFallback>{getInitials(profileData.displayName || userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Input 
              id="avatar" 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Label
              htmlFor="avatar"
              className="flex items-center justify-center gap-2 text-sm py-2 px-3 border rounded-md cursor-pointer hover:bg-muted transition-colors"
            >
              <Camera className="h-4 w-4" />
              Change photo
            </Label>
          </div>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display Name</Label>
        <Input 
          id="displayName" 
          name="displayName" 
          value={profileData.displayName} 
          onChange={handleProfileChange}
          placeholder="Your display name"
          className="mt-1.5"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input 
          id="location" 
          name="location" 
          value={profileData.location} 
          onChange={handleProfileChange}
          placeholder="City, Country"
          className="mt-1.5"
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea 
          id="bio" 
          name="bio" 
          value={profileData.bio} 
          onChange={handleProfileChange}
          placeholder="Tell us a bit about yourself"
          rows={3}
          className="mt-1.5 resize-none"
        />
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </Button>
        <Button 
          className="flex-1" 
          onClick={saveProfile}
        >
          <Check className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </motion.div>
  );

  const StatsCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <motion.div 
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="rounded-xl border bg-card p-3 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-primary/10 p-2">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-medium">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  const SettingItem = ({ 
    icon, 
    label, 
    onClick, 
    endContent 
  }: { 
    icon: React.ReactNode, 
    label: string, 
    onClick?: () => void,
    endContent?: React.ReactNode 
  }) => (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-lg border bg-card shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          {icon}
        </div>
        <span>{label}</span>
      </div>
      {endContent || (onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />)}
    </motion.div>
  );

  const ProfileTab = () => (
    <>
      {isEditing ? (
        renderProfileEditForm()
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-6 space-y-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <StatsCard 
              icon={<BookmarkIcon className="h-4 w-4 text-primary" />}
              label="Bookmarks"
              value={analyticsData?.domainStats.length || 0}
            />
            <StatsCard 
              icon={<Clock className="h-4 w-4 text-primary" />}
              label="Time Spent"
              value={analyticsData?.timeDistribution.reduce((sum, item) => sum + item.time, 0) 
                ? formatTime(analyticsData.timeDistribution.reduce((sum, item) => sum + item.time, 0)) 
                : '0m'}
            />
            <StatsCard 
              icon={<Activity className="h-4 w-4 text-primary" />}
              label="Productivity"
              value={`${analyticsData?.productivityScore || 0}%`}
            />
            <StatsCard 
              icon={<BarChart className="h-4 w-4 text-primary" />}
              label="Domains"
              value={analyticsData?.domainStats.reduce((sum, domain) => sum + domain.visits, 0) || 0}
            />
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Account</h3>
            
            <SettingItem 
              icon={<User className="h-4 w-4" />}
              label="Personal Information"
              onClick={() => setIsEditing(true)}
            />
            
            <SettingItem 
              icon={<Bell className="h-4 w-4" />}
              label="Notifications"
              onClick={() => navigate('/settings?tab=notifications')}
            />
            
            <SettingItem 
              icon={<Shield className="h-4 w-4" />}
              label="Privacy & Security"
              onClick={() => navigate('/settings?tab=privacy')}
            />
          </div>
          
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Preferences</h3>
            
            <SettingItem 
              icon={<Palette className="h-4 w-4" />}
              label="Appearance"
              onClick={() => navigate('/settings?tab=appearance')}
            />
            
            <SettingItem 
              icon={<Languages className="h-4 w-4" />}
              label="Language"
              endContent={
                <Badge variant="outline" className="font-normal">
                  {currentLanguage.name}
                </Badge>
              }
              onClick={() => navigate('/settings?tab=language')}
            />
            
            <SettingItem 
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Default View"
              endContent={
                <Badge variant="outline" className="font-normal capitalize">
                  {viewPreferences.defaultView}
                </Badge>
              }
              onClick={() => navigate('/settings?tab=appearance')}
            />
          </div>
          
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Subscription</h3>
            
            <SettingItem 
              icon={<CreditCard className="h-4 w-4" />}
              label="Payment Methods"
              onClick={() => navigate('/subscription')}
            />
            
            <SettingItem 
              icon={<FileText className="h-4 w-4" />}
              label="Billing History"
              onClick={() => navigate('/subscription?tab=history')}
            />
            
            <SettingItem 
              icon={<Heart className="h-4 w-4" />}
              label="Subscription Plan"
              endContent={
                <Badge variant={currentPlan === 'free' ? 'outline' : 'default'} className="font-normal">
                  {plan?.name || 'Free'}
                </Badge>
              }
              onClick={() => navigate('/subscription')}
            />
          </div>
          
          <div className="pt-6">
            <Button variant="destructive" className="w-full" onClick={() => navigate('/auth/logout')}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      )}
    </>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">
        <ProfileHeader />
        <ProfileNameBio />
        
        <div className="px-4 mb-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-11">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6 space-y-4">
              <ProfileTab />
            </TabsContent>
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    {loadingAnalytics ? (
                      <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="h-8 w-40 bg-muted rounded"></div>
                        <div className="h-32 w-full bg-muted rounded"></div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p>Activity charts will appear here</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => navigate('/analytics')}
                        >
                          View Full Analytics
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-6 space-y-4">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Theme</h3>
                  <RadioGroup
                    value={theme}
                    onValueChange={handleThemeChange}
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Label 
                        htmlFor="theme-light" 
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className={`h-12 w-12 rounded-full border-2 ${theme === 'light' ? 'border-primary' : 'border-transparent'} bg-[#f8fafc] flex items-center justify-center shadow-sm`}>
                          {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <span className="text-xs mt-1">Light</span>
                      </Label>
                      <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <Label 
                        htmlFor="theme-dark" 
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className={`h-12 w-12 rounded-full border-2 ${theme === 'dark' ? 'border-primary' : 'border-transparent'} bg-[#1e293b] flex items-center justify-center shadow-sm`}>
                          {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <span className="text-xs mt-1">Dark</span>
                      </Label>
                      <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <Label 
                        htmlFor="theme-system" 
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className={`h-12 w-12 rounded-full border-2 ${theme === 'system' ? 'border-primary' : 'border-transparent'} bg-gradient-to-r from-[#f8fafc] to-[#1e293b] flex items-center justify-center shadow-sm`}>
                          {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <span className="text-xs mt-1">System</span>
                      </Label>
                      <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Appearance</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <Switch
                      id="compact-mode"
                      checked={viewPreferences.compactMode}
                      onCheckedChange={(checked) => {
                        setViewPreferences(prev => ({
                          ...prev,
                          compactMode: checked
                        }));
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button 
                      variant={viewPreferences.defaultView === 'grid' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setViewPreferences(prev => ({ ...prev, defaultView: 'grid' }))}
                      className="justify-center items-center"
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grid View
                    </Button>
                    <Button 
                      variant={viewPreferences.defaultView === 'list' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setViewPreferences(prev => ({ ...prev, defaultView: 'list' }))}
                      className="justify-center items-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      List View
                    </Button>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={saveViewPreferences}
                      className="w-full"
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UserPage;
