import { useTheme } from "next-themes";
import Layout from "@/components/Layout";
import { useSettings } from "@/stores/settingsStore";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sun,
  Moon,
  Shield,
  MessageSquare,
  User,
  Settings2,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import FeedbackForm from "@/components/settings/FeedbackForm";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const settings = useSettings();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = React.useState("appearance");

  const handleReset = () => {
    settings.resetSettings();
    toast.success("Settings have been reset to default");
  };

  const tabs = [
    { value: "appearance", label: "Appearance", icon: Sun },
    { value: "privacy", label: "Privacy", icon: Shield },
    { value: "feedback", label: "Feedback", icon: MessageSquare },
    { value: "account", label: "Account", icon: User },
    { value: "advanced", label: "Advanced", icon: Settings2 },
  ];

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and customize your experience
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {isMobile ? (
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full mb-4">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
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
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

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
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Data Collection</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anonymous usage data collection
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Switch
                          checked={settings.dataCollection}
                          onCheckedChange={settings.setDataCollection}
                        />
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
                          onCheckedChange={(checked) =>
                            settings.setNotifications("bookmarks", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="updates">Extension Updates</Label>
                        <Switch
                          id="updates"
                          checked={settings.notifications.updates}
                          onCheckedChange={(checked) =>
                            settings.setNotifications("updates", checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="reminders">Reminders</Label>
                        <Switch
                          id="reminders"
                          checked={settings.notifications.reminders}
                          onCheckedChange={(checked) =>
                            settings.setNotifications("reminders", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
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
                  Manage your account and subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.info("Coming soon!")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Sign In to Sync Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Configure advanced features and options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Experimental Features</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable experimental features and options
                    </p>
                  </div>
                  <Switch
                    checked={settings.experimentalFeatures}
                    onCheckedChange={settings.setExperimentalFeatures}
                  />
                </div>

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
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
