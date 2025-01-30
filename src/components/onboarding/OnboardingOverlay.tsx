import React, { useState } from "react";
import { useOnboarding } from "./OnboardingProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { useFirebase } from "@/contexts/FirebaseContext";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BookmarkNode extends chrome.bookmarks.BookmarkTreeNode {
  isSelected?: boolean;
  children?: BookmarkNode[];
}

const onboardingSteps = [
  {
    title: "Welcome to ChroMarx!",
    description: "Your all-in-one browser productivity companion",
    content: "Let's get you set up with ChroMarx to enhance your browsing experience.",
    requiresAuth: false,
  },
  {
    title: "Sign in to Get Started",
    description: "Secure your data and sync across devices",
    content: "Sign in with your Google account to unlock all features and keep your data synced across devices.",
    requiresAuth: true,
  },
  {
    title: "Import Your Bookmarks",
    description: "Bring your existing bookmarks",
    content: "Select the bookmark folders you'd like to import to ChroMarx.",
    requiresAuth: true,
  },
  {
    title: "Choose Your Plan",
    description: "Select the perfect plan for your needs",
    content: "Pick a subscription plan that matches your productivity goals.",
    requiresAuth: true,
  },
  {
    title: "Ready to Start!",
    description: "You're all set to boost your productivity",
    content: "Start exploring ChroMarx's powerful features and make the most of your browsing experience.",
    requiresAuth: true,
  },
];

export const OnboardingOverlay = () => {
  const { currentStep, setCurrentStep, completeOnboarding, isOnboardingComplete } = useOnboarding();
  const { user, signInWithGoogle } = useFirebase();
  const [isImporting, setIsImporting] = useState(false);
  const [bookmarkTree, setBookmarkTree] = useState<BookmarkNode[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());

  // Don't render if onboarding is complete or no current step
  if (isOnboardingComplete || currentStep === 0) return null;

  const currentStepData = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === onboardingSteps.length;
  const progress = (currentStep / onboardingSteps.length) * 100;

  const toggleBookmarkSelection = (id: string) => {
    setSelectedBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleImportBookmarks = async () => {
    if (!chrome?.bookmarks) {
      toast.error("Bookmark import is only available in Chrome");
      return;
    }

    setIsImporting(true);
    try {
      const tree = await chrome.bookmarks.getTree();
      setBookmarkTree(tree);
      
      // If it's the first time loading bookmarks, select the root folders by default
      if (selectedBookmarks.size === 0 && tree[0]?.children) {
        const rootFolders = new Set(tree[0].children.map(node => node.id));
        setSelectedBookmarks(rootFolders);
      }
      
      toast.success("Bookmarks loaded successfully!");
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const renderBookmarkTree = (node: BookmarkNode, level: number = 0) => {
    if (!node.children && !node.url) return null;

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }} className="py-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={node.id}
            checked={selectedBookmarks.has(node.id)}
            onCheckedChange={() => toggleBookmarkSelection(node.id)}
          />
          <label htmlFor={node.id} className="text-sm cursor-pointer">
            {node.title || "Untitled"}
          </label>
        </div>
        {node.children && (
          <div className="mt-1">
            {node.children.map(child => renderBookmarkTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleNext = async () => {
    if (currentStepData.requiresAuth && !user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        toast.error("Please sign in to continue");
        return;
      }
    }

    if (currentStep === 3) {
      // Bookmark import step
      if (bookmarkTree.length === 0) {
        await handleImportBookmarks();
      } else if (selectedBookmarks.size > 0) {
        // Process selected bookmarks
        try {
          const processedBookmarks = Array.from(selectedBookmarks).map(id => {
            const findBookmark = (nodes: BookmarkNode[]): BookmarkNode | null => {
              for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                  const found = findBookmark(node.children);
                  if (found) return found;
                }
              }
              return null;
            };
            return findBookmark(bookmarkTree);
          }).filter((bookmark): bookmark is BookmarkNode => bookmark !== null);

          console.log("Importing selected bookmarks:", processedBookmarks);
          toast.success(`Successfully imported ${processedBookmarks.length} bookmarks!`);
          setCurrentStep(currentStep + 1);
        } catch (error) {
          console.error("Error processing bookmarks:", error);
          toast.error("Failed to process bookmarks. Please try again.");
        }
      } else {
        toast.error("Please select at least one bookmark folder to import");
      }
      return;
    }

    if (isLastStep) {
      completeOnboarding();
      toast.success("Welcome to ChroMarx! 🎉");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
            {currentStepData.title}
            <Info className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription className="text-lg md:text-xl">
            {currentStepData.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep === 3 && (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {bookmarkTree.length > 0 ? (
                bookmarkTree.map(node => renderBookmarkTree(node))
              ) : (
                <div className="text-center text-muted-foreground">
                  Click Next to load your bookmarks
                </div>
              )}
            </ScrollArea>
          )}
          
          {currentStep === 4 && (
            <div className="grid md:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-6 rounded-lg border ${
                    plan.isPopular ? "border-primary" : "border-border"
                  } hover:shadow-lg transition-shadow duration-200`}
                >
                  <h3 className="font-semibold text-lg md:text-xl">{plan.name}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold">${plan.pricing.monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-muted-foreground text-base md:text-lg">
            {currentStepData.content}
          </p>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleNext}
            size="default"
            className="px-4 py-2 text-sm"
            disabled={isImporting}
          >
            {currentStepData.requiresAuth && !user ? (
              "Sign in to Continue"
            ) : isLastStep ? (
              <>
                Get Started
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};