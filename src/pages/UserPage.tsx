import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { UserRound, CreditCard, Settings, ExternalLink, Shield, PenLine, MapPin, AtSign, Clock, BookmarkIcon, History, Activity, Palette, Languages, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { storage } from "@/services/storageService";
import { getAnalyticsData } from "@/utils/analyticsUtils";
import { AnalyticsData } from "@/types/analytics";
import ProductivityTrends from "@/components/analytics/ProductivityTrends";
import DomainStats from "@/components/analytics/DomainStats";
import { useSettings } from "@/stores/settingsStore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/stores/languageStore";
import ViewToggle from "@/components/ViewToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Checkbox } from "@/components/ui/checkbox";

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-6 w-6" />
                Profile Overview
              </CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={profileData.avatarUrl} alt={profileData.displayName} />
                    <AvatarFallback className="text-lg">
                      {getInitials(profileData.displayName || userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{isEditing ? profileData.displayName : (profileData.displayName || userName)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan?.name || 'Free'} Plan
                    </p>
                    {!isEditing && profileData.location && (
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {profileData.location}
                      </p>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveProfile}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
              
              {isEditing && (
                <div className="bg-muted/50 p-4 rounded-lg space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-border">
                        <AvatarImage src={profileData.avatarUrl} alt={profileData.displayName} />
                        <AvatarFallback className="text-lg">
                          {getInitials(profileData.displayName || userName)}
                        </AvatarFallback>
                      </Avatar>
                      <Input 
                        id="avatar" 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange}
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input 
                        id="displayName" 
                        name="displayName" 
                        value={profileData.displayName} 
                        onChange={handleProfileChange}
                        placeholder="Your display name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-2 text-sm text-muted-foreground">
                        <AtSign className="h-4 w-4" />
                        {profileData.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        name="location" 
                        value={profileData.location} 
                        onChange={handleProfileChange}
                        placeholder="Your location (city, country)"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      name="bio" 
                      value={profileData.bio} 
                      onChange={handleProfileChange}
                      placeholder="Tell us a bit about yourself"
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              {!isEditing && profileData.bio && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{profileData.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Activity History
              </CardTitle>
              <CardDescription>
                Your recent activity and browsing statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loadingAnalytics ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-8 w-40 bg-muted rounded"></div>
                    <div className="h-32 w-full bg-muted rounded"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1 text-muted-foreground">
                        <BookmarkIcon className="h-4 w-4" />
                        Bookmarks
                      </div>
                      <div className="text-2xl font-semibold">
                        {analyticsData?.domainStats.length || 0}
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Time Spent
                      </div>
                      <div className="text-2xl font-semibold">
                        {analyticsData?.timeDistribution.reduce((sum, item) => sum + item.time, 0) 
                          ? formatTime(analyticsData.timeDistribution.reduce((sum, item) => sum + item.time, 0)) 
                          : '0m'}
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1 text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        Productivity
                      </div>
                      <div className="text-2xl font-semibold">
                        {analyticsData?.productivityScore || 0}%
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1 text-muted-foreground">
                        <History className="h-4 w-4" />
                        Domains
                      </div>
                      <div className="text-2xl font-semibold">
                        {analyticsData?.domainStats.reduce((sum, domain) => sum + domain.visits, 0) || 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {analyticsData?.productivityTrends?.length > 0 && (
                      <ProductivityTrends data={analyticsData.productivityTrends} />
                    )}
                    
                    {analyticsData?.domainStats?.length > 0 && (
                      <DomainStats data={analyticsData.domainStats} />
                    )}
                  </div>
                </>
              )}
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={() => navigate('/analytics')}
                  variant="outline" 
                  className="text-sm"
                >
                  View Full Analytics
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-6 w-6" />
                User Preferences
              </CardTitle>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Theme Customization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme Mode</Label>
                    <RadioGroup
                      value={theme}
                      onValueChange={handleThemeChange}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light" className="cursor-pointer">Light</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark" className="cursor-pointer">Dark</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="theme-system" />
                        <Label htmlFor="theme-system" className="cursor-pointer">System Default</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="colorScheme">Color Scheme</Label>
                    <RadioGroup
                      value={colorScheme}
                      onValueChange={handleColorSchemeChange}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="default" id="scheme-default" />
                        <Label htmlFor="scheme-default" className="cursor-pointer">Default</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="purple" id="scheme-purple" />
                        <Label htmlFor="scheme-purple" className="cursor-pointer">Purple</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="blue" id="scheme-blue" />
                        <Label htmlFor="scheme-blue" className="cursor-pointer">Blue</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="green" id="scheme-green" />
                        <Label htmlFor="scheme-green" className="cursor-pointer">Green</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border space-y-4">
                <h3 className="text-lg font-medium">Display Preferences</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Default View</Label>
                    <div className="flex items-center">
                      <ViewToggle 
                        view={viewPreferences.defaultView} 
                        onViewChange={handleViewChange}
                      />
                      <span className="ml-3 text-sm text-muted-foreground">
                        {viewPreferences.defaultView === "grid" ? "Grid View" : "List View"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="compact-mode" 
                        checked={viewPreferences.compactMode}
                        onCheckedChange={handleCompactModeChange}
                      />
                      <Label htmlFor="compact-mode" className="cursor-pointer">
                        Enable Compact Mode
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      Reduces padding and spacing throughout the interface
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border space-y-4">
                <h3 className="text-lg font-medium">Language Preferences</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Application Language</Label>
                    <LanguageSelector />
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {currentLanguage.name} ({currentLanguage.nativeName})
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={saveViewPreferences}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Subscription Details
              </CardTitle>
              <CardDescription>
                View and manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{plan?.name || 'Free'} Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {subscriptionEnd 
                        ? `Expires: ${new Date(subscriptionEnd).toLocaleDateString()}`
                        : 'No active subscription'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/subscription')}
                    variant="default"
                  >
                    {currentPlan === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {plan && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Plan Features:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li 
                          key={index}
                          className="text-sm flex items-center gap-2"
                        >
                          {feature.included ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )}
                          {feature.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Google Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Your account is secured with Google Sign-In
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  App Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/subscription')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscription Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserPage;
