
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useElementSelector } from "@/hooks/useElementSelector";
import Layout from "@/components/Layout";
import FeatureGrid from "@/components/FeatureGrid";
import AffiliateBannerCarousel from "@/components/services/AffiliateBannerCarousel";
import OnboardingContainer from "@/components/onboarding/OnboardingContainer";
import OnboardingContent from "@/components/onboarding/OnboardingContent";
import createOnboardingSteps from "@/components/onboarding/config/onboardingSteps";
import { Button } from "@/components/ui/button";
import { ArrowRight, Chrome } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { storage } from "@/services/storageService";

const Index = () => {
  const { currentPlan, setSubscriptionPlan } = useSubscription();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const totalSteps = 5;

  const handleElementSelected = (element: HTMLElement) => {
    console.log('Selected element:', element);
    toast.success("Element selected successfully!");
  };

  const { startSelecting } = useElementSelector(handleElementSelected);

  const handleComplete = async () => {
    try {
      await storage.set('onboarding_completed', true);
      setShowOnboarding(false);
      toast.success("Welcome to ChroMarx!");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup");
    }
  };

  const handleImportBookmarks = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        const bookmarks = await chrome.bookmarks.getTree();
        await storage.set('imported_bookmarks', bookmarks);
        toast.success("Bookmarks imported successfully!");
        setCurrentStep(4);
      } else {
        toast.error("Chrome bookmarks API not available");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import bookmarks");
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      await setSubscriptionPlan(planId);
      toast.success("Subscription updated successfully!");
      await handleComplete();
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to update subscription");
    }
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await storage.get<boolean>('onboarding_completed');
        if (completed) {
          setShowOnboarding(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    checkOnboarding();
  }, []);

  const onboardingSteps = createOnboardingSteps(
    setCurrentStep,
    handleImportBookmarks,
    handleComplete,
    handleSignIn,
    handleSubscribe
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 pb-24">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Supercharge Your Browser Experience
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-8">
              Transform your browsing with AI-powered bookmarks, task management, and productivity tools.
            </p>
            <div className="flex gap-4 mb-12">
              <Button size="lg" onClick={() => window.open("https://chrome.google.com/webstore/detail/chromarx/YOUR_EXTENSION_ID")}>
                <Chrome className="mr-2 h-5 w-5" />
                Add to Chrome
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/plans')}>
                See Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Browse Smarter
          </h2>
          <FeatureGrid />
        </div>
      </section>

      {/* Free Plan Banner */}
      {currentPlan === "free" && (
        <div className="w-full">
          <AffiliateBannerCarousel />
        </div>
      )}

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingContainer
          currentStep={currentStep}
          totalSteps={totalSteps}
        >
          <OnboardingContent
            currentStep={currentStep}
            totalSteps={totalSteps}
            stepData={onboardingSteps[currentStep - 1]}
          />
        </OnboardingContainer>
      )}
    </Layout>
  );
};

export default Index;
