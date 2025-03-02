
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Show success notification when page loads
    toast.success("Payment processed successfully!");
  }, []);

  return (
    <Layout>
      <div className="container max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="mb-6 text-primary">
          <CheckCircle size={72} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Subscription Activated!</h1>
        
        <p className="text-muted-foreground mb-8">
          Thank you for subscribing to ChroMarx Pro! Your account has been upgraded and all premium features are now available.
        </p>
        
        <div className="space-y-4 w-full">
          <Button className="w-full" onClick={() => navigate("/bookmarks")}>
            Explore Your Bookmarks
          </Button>
          
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionSuccessPage;
