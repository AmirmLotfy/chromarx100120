import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Download, Settings, Trash2, Upload, User, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/stores/settingsStore";

const UserPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const { currentPlan, usage, isLoading } = useSubscription();
  const settings = useSettings();

  const handleUpdateProfile = async () => {
    try {
      // Update display name logic here
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Profile picture upload logic here
        toast.success("Profile picture updated successfully");
      } catch (error) {
        toast.error("Failed to update profile picture");
      }
    }
  };

  const handleExportData = async () => {
    try {
      // Export data logic here
      toast.success("Data export started. You'll receive an email when it's ready.");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Account deletion logic here
      toast.success("Account successfully deleted");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Successfully logged out");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                <AvatarFallback>
                  {user.displayName?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full"
                onClick={() => document.getElementById('profile-picture-input')?.click()}
              >
                <Upload className="h-3 w-3" />
              </Button>
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureUpload}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.displayName || "User"}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information and manage your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ""}
                      disabled
                      placeholder="Your email address"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  <Button onClick={handleUpdateProfile}>
                    Update Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                  <CardDescription>
                    Export your data or delete your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <Button 
                      variant="outline" 
                      onClick={handleExportData}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Data
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>
                    Manage your subscription and monitor usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Current Plan</h3>
                      <p className="text-muted-foreground capitalize">{currentPlan}</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/plans")}>
                      Upgrade Plan
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Bookmarks</span>
                        <span>{usage.bookmarks} used</span>
                      </div>
                      <Progress value={(usage.bookmarks / 100) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Notes</span>
                        <span>{usage.notes} used</span>
                      </div>
                      <Progress value={(usage.notes / 100) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>AI Requests</span>
                        <span>{usage.aiRequests} used</span>
                      </div>
                      <Progress value={(usage.aiRequests / 100) * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>
                    Manage your privacy and data collection preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Data Collection</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anonymous usage data collection
                      </p>
                    </div>
                    <Switch
                      checked={settings.dataCollection}
                      onCheckedChange={(checked) => settings.setDataCollection(checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bookmark Auto-Detection</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically detect and suggest bookmarks
                      </p>
                    </div>
                    <Switch
                      checked={settings.experimentalFeatures}
                      onCheckedChange={(checked) => settings.setExperimentalFeatures(checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="destructive" onClick={handleLogout} className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UserPage;