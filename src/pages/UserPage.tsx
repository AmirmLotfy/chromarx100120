
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { UserRound, CreditCard, Settings, ExternalLink, Shield, PenLine, MapPin, AtSign } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { storage } from "@/services/storageService";

const UserPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Guest User');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    location: '',
    email: '',
    avatarUrl: ''
  });

  // Load user profile data from storage
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        if (user) {
          setUserName(user.email || 'Guest User');
          // For now we're using mock data, in a real app this would come from your backend
          setCurrentPlan('free');
          setSubscriptionEnd(null);
          
          // Try to load profile data from storage
          const storedProfile = await storage.get('userProfile');
          if (storedProfile) {
            setProfileData({
              ...profileData,
              ...storedProfile,
              email: user.email || '',
              displayName: storedProfile.displayName || user.email || 'Guest User'
            });
          } else {
            // Initialize with current user data
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
      // Convert to base64 for storage
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

  // Generate avatar fallback text
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
          {/* Profile Overview */}
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

          {/* Subscription Details */}
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

          {/* Account Security */}
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

          {/* Quick Actions */}
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
