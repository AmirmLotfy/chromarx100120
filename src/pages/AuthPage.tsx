
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AuthPage = () => {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRemix, setIsRemix] = useState(false);

  useEffect(() => {
    // Check if we're in a Lovable remix environment
    setIsRemix(window.location.hostname.includes('lovableproject.com'));
  }, []);

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      // No need for toast or navigation here as the OAuth redirect will handle it
    } catch (error: any) {
      console.error("Google signin error:", error);
      setError(error.message || "Failed to sign in with Google. Please try again.");
      toast({
        title: "Google sign in failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
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
                <div className="text-destructive text-sm">{error}</div>
              )}
              
              <Button 
                type="button"
                variant="default"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
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
              
              <Link to="/">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                >
                  <span className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Continue without signing in
                  </span>
                </Button>
              </Link>
              
              {isRemix && (
                <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-950 rounded-md text-sm">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    You're in a Lovable remix environment. Authentication is bypassed for testing purposes.
                  </p>
                </div>
              )}
            </CardContent>
          </TabsContent>
          
          <TabsContent value="signup">
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}
              
              <div className="text-sm text-muted-foreground mb-4">
                By signing up, you agree to our <a href="/terms-of-service.html" target="_blank" className="underline">Terms of Service</a> and <a href="/privacy-policy.html" target="_blank" className="underline">Privacy Policy</a>.
              </div>
              
              <Button 
                type="button"
                variant="default"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
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
              
              <Link to="/">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                >
                  <span className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Continue without signing up
                  </span>
                </Button>
              </Link>
              
              {isRemix && (
                <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-950 rounded-md text-sm">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    You're in a Lovable remix environment. Authentication is bypassed for testing purposes.
                  </p>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>ChroMarx respects your privacy and data. We use Supabase for secure authentication.</p>
      </div>
    </div>
  );
};

export default AuthPage;
