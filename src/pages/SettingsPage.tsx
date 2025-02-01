import * as React from "react";
import { useTheme } from "next-themes";
import Layout from "@/components/Layout";
import { useSettings } from "@/stores/settingsStore";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFirebase } from "@/contexts/FirebaseContext";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sun, Moon, HelpCircle, User, RefreshCw, FileText } from "lucide-react";
import FeedbackForm from "@/components/settings/FeedbackForm";
import SubscriptionDetails from "@/components/settings/SubscriptionDetails";
import AffiliateSettings from "@/components/settings/AffiliateSettings";
import { useSubscription } from "@/hooks/use-subscription";
import LegalAndFeedback from "@/components/settings/LegalAndFeedback";
import { getPrivacySettings } from "@/services/privacyService";
import { sendEmailVerification } from "firebase/auth";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const settings = useSettings();
  const isMobile = useIsMobile();
  const { user, isAdmin, signInWithGoogle } = useFirebase();
  const [activeTab, setActiveTab] = React.useState("appearance");
  const { currentPlan, usage, isLoading } = useSubscription();

  // Load privacy settings on component mount
  React.useEffect(() => {
    const loadPrivacySettings = async () => {
      if (user?.uid) {
        const savedSettings = await getPrivacySettings(user.uid);
        if (savedSettings) {
          settings.setDataCollection(savedSettings.dataCollection);
          Object.entries(savedSettings.notifications).forEach(([key, value]) => {
            settings.setNotifications(key as keyof typeof settings.notifications, value);
          });
        }
      }
    };
    
    loadPrivacySettings();
  }, [user]);

  const handleExperimentalFeaturesToggle = (enabled: boolean) => {
    settings.setExperimentalFeatures(enabled);
    if (enabled) {
      toast.success("Experimental features enabled! You now have access to beta features.");
    } else {
      toast.info("Experimental features disabled");
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings? This cannot be undone.")) {
      settings.resetSettings();
      toast.success("All settings have been reset to default values");
    }
  };

  const tabs = [
    { value: "appearance", label: "Appearance", icon: Sun },
    { value: "privacy", label: "Privacy", icon: User },
    { value: "subscription", label: "Subscription", icon: RefreshCw },
    { value: "feedback", label: "Feedback", icon: HelpCircle },
    { value: "account", label: "Account", icon: User },
    { value: "advanced", label: "Advanced", icon: RefreshCw },
    { value: "legal", label: "Legal & Feedback", icon: FileText },
  ];

  // Only add affiliate tab if user is admin
  if (isAdmin) {
    tabs.push({ value: "affiliate", label: "Affiliate", icon: HelpCircle });
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 h-full flex flex-col">
        <div className="space-y-2 flex-shrink-0">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and customize your experience
          </p>
        </div>

        <div className="flex-1 overflow-hidden mt-4">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="h-full flex flex-col"
          >
            {isMobile ? (
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md w-[280px]">
                  {tabs.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      <div className="flex items-center gap-2">
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-4">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            <div className="flex-1 overflow-y-auto pb-16 max-w-[1400px] mx-auto w-full">
              <TabsContent value="appearance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme Settings</CardTitle>
                    <CardDescription>
                      Customize how ChroMarx looks on your device
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Theme Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Choose between light and dark themes
                        </p>
                      </div>
                      <Select
                        value={theme}
                        onValueChange={(value) => setTheme(value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center">
                              <Sun className="mr-2 h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center">
                              <Moon className="mr-2 h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Color Scheme</Label>
                        <p className="text-sm text-muted-foreground">
                          Select your preferred color scheme
                        </p>
                      </div>
                      <Select
                        value={settings.colorScheme}
                        onValueChange={settings.setColorScheme}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select scheme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="green">Green</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Control your data and notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <TooltipProvider>
                      <div className="flex items-center justify-between p-4 bg-accent rounded-lg border border-accent-foreground/10 hover:border-accent-foreground/20 transition-colors">
                        <div className="space-y-1">
                          <Label className="text-lg font-semibold">Data Collection</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow anonymous usage data collection
                          </p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Switch
                                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                                checked={settings.dataCollection}
                                onCheckedChange={(checked) => {
                                  if (user?.uid) {
                                    settings.setDataCollection(checked, user.uid);
                                    toast.success('Data collection preference updated');
                                  } else {
                                    toast.error('Please sign in to save preferences');
                                  }
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Help improve ChroMarx by sharing anonymous usage data</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="space-y-4">
                        <Label>Notification Settings</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="bookmarks">Bookmark Updates</Label>
                            <Switch
                              id="bookmarks"
                              checked={settings.notifications.bookmarks}
                              onCheckedChange={(checked) => {
                                if (user?.uid) {
                                  settings.setNotifications("bookmarks", checked, user.uid);
                                  toast.success('Bookmark notifications updated');
                                } else {
                                  toast.error('Please sign in to save preferences');
                                }
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="updates">Extension Updates</Label>
                            <Switch
                              id="updates"
                              checked={settings.notifications.updates}
                              onCheckedChange={(checked) => {
                                if (user?.uid) {
                                  settings.setNotifications("updates", checked, user.uid);
                                  toast.success('Update notifications updated');
                                } else {
                                  toast.error('Please sign in to save preferences');
                                }
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="reminders">Reminders</Label>
                            <Switch
                              id="reminders"
                              checked={settings.notifications.reminders}
                              onCheckedChange={(checked) => {
                                if (user?.uid) {
                                  settings.setNotifications("reminders", checked, user.uid);
                                  toast.success('Reminder notifications updated');
                                } else {
                                  toast.error('Please sign in to save preferences');
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscription" className="space-y-4">
                <SubscriptionDetails />
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Send Feedback</CardTitle>
                    <CardDescription>
                      Help us improve ChroMarx by sharing your thoughts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeedbackForm />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Help Center</CardTitle>
                    <CardDescription>
                      Find answers to common questions and learn how to use ChroMarx
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open("https://docs.chromarx.com", "_blank")}
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Visit Help Center
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account and profile settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user ? (
                      <>
                        <div className="flex items-center space-x-4 p-4 bg-accent rounded-lg">
                          <div className="h-12 w-12 rounded-full overflow-hidden">
                            <img 
                              src={user.photoURL || '/placeholder.svg'} 
                              alt="Profile" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{user.displayName}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Email Verification</Label>
                              <p className="text-sm text-muted-foreground">
                                Status of your email verification
                              </p>
                            </div>
                            {user.emailVerified ? (
                              <Badge variant="secondary">Verified</Badge>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  sendEmailVerification(user)
                                    .then(() => toast.success("Verification email sent!"))
                                    .catch(() => toast.error("Failed to send verification email"));
                                }}
                              >
                                Verify Email
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Account Created</Label>
                              <p className="text-sm text-muted-foreground">
                                When you joined ChroMarx
                              </p>
                            </div>
                            <p className="text-sm">
                              {new Date(user.metadata.creationTime!).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label>Last Sign In</Label>
                              <p className="text-sm text-muted-foreground">
                                Your most recent login
                              </p>
                            </div>
                            <p className="text-sm">
                              {new Date(user.metadata.lastSignInTime!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="pt-6">
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                                user.delete()
                                  .then(() => {
                                    toast.success("Account deleted successfully");
                                  })
                                  .catch((error) => {
                                    console.error("Error deleting account:", error);
                                    toast.error("Failed to delete account. Please sign in again and try once more.");
                                  });
                              }
                            }}
                          >
                            Delete Account
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-4">
                          Please sign in to manage your account settings
                        </p>
                        <Button onClick={() => signInWithGoogle()}>
                          <User className="mr-2 h-4 w-4" />
                          Sign In with Google
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>
                      Configure advanced features and experimental options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Experimental Features</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable experimental features and beta testing options. 
                          {settings.experimentalFeatures && (
                            <span className="block text-yellow-500 dark:text-yellow-400 mt-1">
                              ⚠️ These features are in beta and may be unstable
                            </span>
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={settings.experimentalFeatures}
                        onCheckedChange={handleExperimentalFeaturesToggle}
                      />
                    </div>

                    {settings.experimentalFeatures && (
                      <div className="space-y-4 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium">Active Beta Features:</h4>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                          <li>Enhanced AI processing for bookmarks</li>
                          <li>Advanced analytics dashboard</li>
                          <li>New experimental UI components</li>
                        </ul>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Button
                        variant="destructive"
                        onClick={handleReset}
                        className="w-full"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset All Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="legal" className="space-y-4">
                <LegalAndFeedback />
              </TabsContent>

              {isAdmin && (
                <TabsContent value="affiliate">
                  <AffiliateSettings />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
