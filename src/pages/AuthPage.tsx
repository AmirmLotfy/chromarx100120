
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Chrome, Home, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const AuthPage = () => {
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Chrome identity API is available
  const [chromeIdentityAvailable, setChromeIdentityAvailable] = useState<boolean>(
    typeof chrome !== 'undefined' && !!chrome.identity
  );

  useEffect(() => {
    // Check for Chrome identity API availability
    const checkChromeIdentity = () => {
      const available = typeof chrome !== 'undefined' && !!chrome.identity;
      setChromeIdentityAvailable(available);
      
      if (!available) {
        setError(
          "Chrome identity API is not available. This might be because you're not running in a Chrome extension environment."
        );
      }
    };
    
    checkChromeIdentity();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      // No need for toast or navigation here as the useEffect above will handle it
    } catch (error: any) {
      console.error("Google signin error:", error);
      setError(error.message || "Failed to sign in with Google. Please try again.");
      toast.error("Sign in failed. Please try again later.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Welcome to ChroMarx</h1>
        <p className="text-muted-foreground">Your AI-powered Bookmark Manager</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Account Access</CardTitle>
          <CardDescription>
            Sign in with your Google account to sync your bookmarks across devices.
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="text-destructive text-sm p-3 border border-destructive/20 rounded-md bg-destructive/10">
                  {error}
                </div>
              )}
              
              {!chromeIdentityAvailable && (
                <div className="text-amber-500 text-sm p-3 border border-amber-200 rounded-md bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 flex items-start gap-2">
                  <Shield className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Chrome Identity Not Available</p>
                    <p className="mt-1">
                      You're either not in a Chrome extension environment or this extension doesn't have the required permissions.
                    </p>
                  </div>
                </div>
              )}
              
              <Button 
                type="button"
                variant="default"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || !chromeIdentityAvailable || loading}
              >
                {googleLoading || loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Chrome className="h-4 w-4" />
                    Sign in with Google
                  </span>
                )}
              </Button>
              
              <Separator className="my-4" />
              
              <Link to="/">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <span className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Continue without signing in
                  </span>
                </Button>
              </Link>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="signup">
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="text-destructive text-sm p-3 border border-destructive/20 rounded-md bg-destructive/10">
                  {error}
                </div>
              )}
              
              {!chromeIdentityAvailable && (
                <div className="text-amber-500 text-sm p-3 border border-amber-200 rounded-md bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 flex items-start gap-2">
                  <Shield className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Chrome Identity Not Available</p>
                    <p className="mt-1">
                      You're either not in a Chrome extension environment or this extension doesn't have the required permissions.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground mb-4 p-3 border rounded-md bg-muted/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">Privacy Notice</span>
                </div>
                <p>
                  By signing up, you agree to our <a href="/terms-of-service.html" target="_blank" className="underline">Terms of Service</a> and <a href="/privacy-policy.html" target="_blank" className="underline">Privacy Policy</a>.
                </p>
              </div>
              
              <Button 
                type="button"
                variant="default"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || !chromeIdentityAvailable || loading}
              >
                {googleLoading || loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Chrome className="h-4 w-4" />
                    Sign up with Google
                  </span>
                )}
              </Button>
              
              <Separator className="my-4" />
              
              <Link to="/">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <span className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Continue without signing up
                  </span>
                </Button>
              </Link>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="bg-muted/30 flex flex-col items-center text-sm text-muted-foreground p-4 border-t">
          <p>ChroMarx uses the Chrome Identity API for secure authentication</p>
          <p className="mt-1">Your data is stored locally and synced securely across your devices</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
