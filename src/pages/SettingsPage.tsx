import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Moon, Sun, Shield, MessageSquare } from "lucide-react";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [dataCollection, setDataCollection] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [feedback, setFeedback] = useState("");

  const handleFeedbackSubmit = () => {
    if (feedback.trim()) {
      // Here you would typically send the feedback to your backend
      toast.success("Thank you for your feedback!");
      setFeedback("");
    } else {
      toast.error("Please enter your feedback before submitting");
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and customize your experience
          </p>
        </div>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>
                  Customize how ChroMarx looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
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
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Data Collection</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow anonymous usage data collection to improve the extension
                    </p>
                  </div>
                  <Switch
                    checked={dataCollection}
                    onCheckedChange={setDataCollection}
                    aria-label="Toggle data collection"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about important updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                    aria-label="Toggle notifications"
                  />
                </div>
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
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Share your suggestions, report bugs, or ask questions..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[150px]"
                />
                <Button onClick={handleFeedbackSubmit}>Submit Feedback</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;