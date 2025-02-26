
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/supabase-auth";
import Layout from "@/components/Layout";
import { ChromeIcon } from "lucide-react";

export default function AuthPage() {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in:', error);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Welcome to ChroMarx</CardTitle>
            <CardDescription>
              Sign in to access your AI-powered bookmark manager
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleGoogleSignIn}
            >
              <ChromeIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
