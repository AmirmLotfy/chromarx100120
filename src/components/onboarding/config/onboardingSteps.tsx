
import { BookMarked, Bookmark, Settings, Zap, CreditCard, LogIn } from "lucide-react";
import { OnboardingStepConfig } from "../types/onboarding";
import PlanCard from "../../subscription/PlanCard";
import { subscriptionPlans } from "@/config/subscriptionPlans";

const createOnboardingSteps = (
  setCurrentStep: (step: number) => void,
  handleImportBookmarks: () => Promise<void>,
  handleComplete: () => void,
  handleSignIn: () => Promise<void>,
  handleSubscribe: (planId: string) => Promise<void>
): OnboardingStepConfig[] => [
  {
    title: "Welcome to ChroMarx",
    description: "Your Gemini-Powered Bookmark Manager – Organize, Optimize, Excel!",
    icon: "/lovable-uploads/cab9ee44-1599-487e-86b9-4c7b064cf78e.png",
    primaryAction: {
      label: "Get Started",
      onClick: () => setCurrentStep(2),
    },
  },
  {
    title: "Sign in with Google",
    description: "Access your bookmarks across devices and unlock personalized features",
    icon: LogIn,
    primaryAction: {
      label: "Sign in with Google",
      onClick: handleSignIn,
    },
  },
  {
    title: "Import Your Bookmarks",
    description: "Bring your existing bookmarks into ChroMarx for better organization",
    icon: BookMarked,
    primaryAction: {
      label: "Import Bookmarks",
      onClick: handleImportBookmarks,
    },
  },
  {
    title: "Explore Key Features",
    description: "Discover what makes ChroMarx special",
    icon: Zap,
    content: (
      <div className="space-y-6 my-4">
        <div className="flex items-start space-x-4">
          <Bookmark className="w-6 h-6 text-primary mt-1" />
          <div>
            <h3 className="font-medium text-lg">Smart Bookmarking</h3>
            <p className="text-muted-foreground">Organize bookmarks with AI-powered categorization</p>
          </div>
        </div>
        <div className="flex items-start space-x-4">
          <Settings className="w-6 h-6 text-primary mt-1" />
          <div>
            <h3 className="font-medium text-lg">Customizable Workspace</h3>
            <p className="text-muted-foreground">Personalize your experience with themes and layouts</p>
          </div>
        </div>
      </div>
    ),
    primaryAction: {
      label: "Next",
      onClick: () => setCurrentStep(5),
    },
  },
  {
    title: "Choose Your Plan",
    description: "Select a plan that fits your needs",
    icon: CreditCard,
    content: (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <PlanCard 
            key={plan.id}
            {...plan}
            onSubscribe={() => handleSubscribe(plan.id)}
          />
        ))}
      </div>
    ),
    primaryAction: {
      label: "Complete Setup",
      onClick: handleComplete,
    },
  }
];

export default createOnboardingSteps;
