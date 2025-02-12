
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, LogIn } from "lucide-react";

interface OnboardingAuthProps {
  onNext: () => void;
  onSkip: () => void;
}

const OnboardingAuth = ({ onNext, onSkip }: OnboardingAuthProps) => {
  const handleGoogleSignIn = async () => {
    try {
      const token = await chrome.identity.getAuthToken({ 
        interactive: true,
        scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
      });

      if (chrome.runtime.lastError) {
        console.error("Authentication failed:", chrome.runtime.lastError);
        toast.error("Failed to sign in with Google");
        return;
      }

      // Get user info from Google
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      toast.success("Successfully signed in!");
      onNext();
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error("Sign in failed. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 px-4"
    >
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sign in to ChroMarx</h2>
        <p className="text-lg text-muted-foreground">
          Connect with Google to sync your bookmarks and preferences across devices
        </p>
      </div>

      <div className="space-y-4 max-w-md mx-auto w-full">
        <Button
          size="lg"
          className="w-full h-14 text-base rounded-full shadow-md hover:shadow-lg active:shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-primary to-primary/90"
          onClick={handleGoogleSignIn}
        >
          <User className="mr-2 h-5 w-5" />
          Sign in with Google
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-base hover:bg-accent/50"
          onClick={onSkip}
        >
          <LogIn className="mr-2 h-5 w-5" />
          Continue without signing in
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Having trouble? <button onClick={() => toast.info("Support contact info here")} className="underline hover:text-primary transition-colors">Contact support</button>
      </p>
    </motion.div>
  );
};

export default OnboardingAuth;
