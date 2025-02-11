
import { BookMarked, Bookmark, Settings, Zap } from "lucide-react";
import { OnboardingStepConfig } from "../types/onboarding";

const createOnboardingSteps = (
  setCurrentStep: (step: number) => void,
  handleImportBookmarks: () => Promise<void>,
  handleComplete: () => void
): OnboardingStepConfig[] => [
  {
    title: "Welcome to ChroMarx",
    description: "Your all-in-one browser productivity companion. Let's get you started!",
    icon: "/lovable-uploads/cab9ee44-1599-487e-86b9-4c7b064cf78e.png",
    primaryAction: {
      label: "Get Started",
      onClick: () => setCurrentStep(2),
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
    secondaryAction: {
      label: "Skip for now",
      onClick: () => setCurrentStep(3),
    },
  },
  {
    title: "Explore Key Features",
    description: "Discover what makes ChroMarx special",
    icon: Zap,
    content: (
      <div className="space-y-4 my-4">
        <div className="flex items-start space-x-3">
          <Bookmark className="w-5 h-5 text-primary mt-1" />
          <div>
            <h3 className="font-medium">Smart Bookmarking</h3>
            <p className="text-sm text-muted-foreground">Organize bookmarks with AI-powered categorization</p>
          </div>
        </div>
        <div className="flex items-start space-x-3">
          <Settings className="w-5 h-5 text-primary mt-1" />
          <div>
            <h3 className="font-medium">Customizable Workspace</h3>
            <p className="text-sm text-muted-foreground">Personalize your experience with themes and layouts</p>
          </div>
        </div>
      </div>
    ),
    primaryAction: {
      label: "Next",
      onClick: () => setCurrentStep(4),
    },
  },
  {
    title: "You're All Set!",
    description: "Start exploring ChroMarx's powerful features",
    icon: "/lovable-uploads/cab9ee44-1599-487e-86b9-4c7b064cf78e.png",
    primaryAction: {
      label: "Get Started",
      onClick: handleComplete,
    },
  },
];

export default createOnboardingSteps;
