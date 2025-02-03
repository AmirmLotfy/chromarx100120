import React, { useState, useEffect } from "react";
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
import { Check, ArrowRight, Info, Upload } from "lucide-react";
import { toast } from "sonner";
import { useFirebase } from "@/contexts/FirebaseContext";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";

interface BookmarkNode extends chrome.bookmarks.BookmarkTreeNode {
  isSelected?: boolean;
  children?: BookmarkNode[];
}

const onboardingSteps = [
  {
    title: "Welcome to ChroMarx",
    description: "Your smart browser companion",
    content: "Let's set up ChroMarx to enhance your browsing experience with AI-powered features and smart organization.",
    requiresAuth: false,
  },
  {
    title: "Sign in Securely",
    description: "Keep your data synced across devices",
    content: "Sign in with your Google account to unlock all features and ensure your data is safely backed up.",
    requiresAuth: true,
  },
  {
    title: "Choose Your Experience",
    description: "Select the perfect plan for your needs",
    content: "Pick a subscription plan that matches your productivity goals and usage requirements.",
    requiresAuth: true,
  },
  {
    title: "Import Your Data",
    description: "Bring your bookmarks with you",
    content: "Select which bookmark folders you'd like to import to ChroMarx. We'll help you organize them intelligently.",
    requiresAuth: true,
  },
  {
    title: "All Set!",
    description: "You're ready to boost your productivity",
    content: "Start exploring ChroMarx's powerful features and make the most of your browsing experience.",
    requiresAuth: true,
  },
];

export const OnboardingOverlay = () => {
  const { currentStep, setCurrentStep, completeOnboarding, isOnboardingComplete } = useOnboarding();
  const { user } = useFirebase();
  const [bookmarkTree, setBookmarkTree] = useState<BookmarkNode[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const currentStepData = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === onboardingSteps.length;
  const progress = (currentStep / onboardingSteps.length) * 100;

  const loadBookmarkTree = async () => {
    setIsLoadingBookmarks(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        const tree = await chrome.bookmarks.getTree();
        setBookmarkTree(tree);
        toast.success("Bookmarks loaded successfully!");
      } else {
        toast.error("Failed to load bookmarks. Please try again.");
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks. Please try again.");
    } finally {
      setIsLoadingBookmarks(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && !user) {
      // Handle sign-in logic here
    }

    if (currentStep === 4) {
      await loadBookmarkTree();
    }

    if (isLastStep) {
      completeOnboarding();
      toast.success("Welcome to ChroMarx! 🎉");
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderBookmarkTree = (node: BookmarkNode) => {
    if (!node) return null;

    return (
      <div key={node.id} className="space-y-2">
        {node.url ? (
          <div className="flex items-center gap-2 p-2 hover:bg-accent/50 rounded-lg transition-colors">
            <Checkbox
              id={node.id}
              checked={selectedBookmarks.has(node.id)}
              onCheckedChange={() => {
                const newSelected = new Set(selectedBookmarks);
                if (newSelected.has(node.id)) {
                  newSelected.delete(node.id);
                } else {
                  newSelected.add(node.id);
                }
                setSelectedBookmarks(newSelected);
              }}
              className="h-5 w-5"
            />
            <label 
              htmlFor={node.id} 
              className="text-sm flex-1 cursor-pointer truncate"
              title={node.title}
            >
              {node.title}
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Checkbox
                id={node.id}
                checked={selectedBookmarks.has(node.id)}
                onCheckedChange={() => {
                  const newSelected = new Set(selectedBookmarks);
                  if (newSelected.has(node.id)) {
                    newSelected.delete(node.id);
                  } else {
                    newSelected.add(node.id);
                  }
                  setSelectedBookmarks(newSelected);
                }}
                className="h-5 w-5"
              />
              <label 
                htmlFor={node.id} 
                className="font-medium flex-1 cursor-pointer truncate"
                title={node.title}
              >
                {node.title}
              </label>
            </div>
            {node.children && (
              <div className="ml-4 space-y-1 border-l-2 border-muted pl-2">
                {node.children.map(child => renderBookmarkTree(child))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl animate-scale-in">
        <CardHeader className="space-y-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {currentStepData.title}
            <Info className="h-5 w-5 text-muted-foreground" />
          </CardTitle>
          <CardDescription className="text-base">
            {currentStepData.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep === 4 && (
            <>
              <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px] rounded-md border">
                {isLoadingBookmarks ? (
                  <div className="flex items-center justify-center h-full">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : bookmarkTree.length > 0 ? (
                  <div className="p-4">
                    {bookmarkTree.map(node => renderBookmarkTree(node))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground p-8">
                    <Upload className="h-12 w-12" />
                    <p className="text-center">Click Next to load your bookmarks</p>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
          
          <p className="text-muted-foreground text-sm">
            {currentStepData.content}
          </p>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t pt-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="hover:bg-primary/5"
          >
            Back
          </Button>
          <Button 
            onClick={handleNext}
            className="px-6 py-2 shadow-sm hover:shadow-md transition-all duration-300"
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
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
