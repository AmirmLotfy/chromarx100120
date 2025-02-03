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
import { 
  Check, 
  ArrowRight, 
  Info, 
  Upload,
  Globe,
  BookmarkIcon,
  NotebookPen,
  BarChart3,
  Timer
} from "lucide-react";
import { toast } from "sonner";
import { useFirebase } from "@/contexts/FirebaseContext";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { subscriptionPlans } from "@/config/subscriptionPlans";
import PlanCard from "@/components/subscription/PlanCard";

const onboardingSteps = [
  {
    title: "Welcome to ChroMarx",
    description: "Your all-in-one browser productivity companion",
    content: "Let's get you set up with ChroMarx to enhance your browsing experience.",
    icon: Globe,
    requiresAuth: false
  },
  {
    title: "Sign in to Get Started",
    description: "Secure your data and sync across devices",
    content: "Sign in with your Google account to unlock all features and keep your data synced.",
    icon: Check,
    requiresAuth: true
  },
  {
    title: "Import Your Bookmarks",
    description: "Bring your existing bookmarks",
    content: "Select the bookmark folders you'd like to import to ChroMarx.",
    icon: BookmarkIcon,
    requiresAuth: true
  },
  {
    title: "Discover Key Features",
    description: "Explore what ChroMarx can do for you",
    content: "Let's walk through the main features that will boost your productivity.",
    icon: NotebookPen,
    requiresAuth: true,
    features: [
      {
        title: "Smart Bookmarks",
        description: "Organize and access your bookmarks efficiently",
        icon: BookmarkIcon
      },
      {
        title: "Productivity Analytics",
        description: "Track your browsing habits and productivity",
        icon: BarChart3
      },
      {
        title: "Focus Timer",
        description: "Stay focused with built-in time management",
        icon: Timer
      }
    ]
  },
  {
    title: "Choose Your Plan",
    description: "Select the perfect plan for your needs",
    content: "Pick a subscription plan that matches your productivity goals.",
    icon: Check,
    requiresAuth: true
  },
  {
    title: "Ready to Start!",
    description: "You're all set to boost your productivity",
    content: "Start exploring ChroMarx's powerful features and make the most of your browsing.",
    icon: Check,
    requiresAuth: true
  }
];

interface BookmarkNode extends chrome.bookmarks.BookmarkTreeNode {
  isSelected?: boolean;
  children?: BookmarkNode[];
}

export const OnboardingOverlay = () => {
  const { currentStep, setCurrentStep, completeOnboarding, isOnboardingComplete } = useOnboarding();
  const { user, signInWithGoogle } = useFirebase();
  const [isImporting, setIsImporting] = useState(false);
  const [bookmarkTree, setBookmarkTree] = useState<BookmarkNode[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  if (isOnboardingComplete || currentStep === 0) return null;

  const currentStepData = onboardingSteps[currentStep - 1];
  const isLastStep = currentStep === onboardingSteps.length;
  const progress = (currentStep / onboardingSteps.length) * 100;

  const loadBookmarkTree = async () => {
    setIsLoadingBookmarks(true);
    try {
      if (typeof chrome !== 'undefined' && chrome.bookmarks) {
        console.log("Loading real Chrome bookmarks...");
        const tree = await chrome.bookmarks.getTree();
        console.log("Loaded bookmark tree:", tree);
        setBookmarkTree(tree);
        
        if (tree[0]?.children) {
          const rootFolders = new Set(tree[0].children.map(node => node.id));
          setSelectedBookmarks(rootFolders);
        }
        
        toast.success("Bookmarks loaded successfully!");
        return true;
      } else {
        console.log("Running in development mode - loading demo bookmarks");
        const demoTree = [{
          id: "1",
          title: "Bookmarks Bar",
          children: [
            {
              id: "2",
              title: "Development",
              children: [
                {
                  id: "3",
                  title: "React Documentation",
                  url: "https://react.dev",
                },
                {
                  id: "4",
                  title: "TypeScript Handbook",
                  url: "https://www.typescriptlang.org/docs/",
                }
              ]
            },
            {
              id: "5",
              title: "Productivity",
              children: [
                {
                  id: "6",
                  title: "ChatGPT",
                  url: "https://chat.openai.com",
                },
                {
                  id: "7",
                  title: "Google Calendar",
                  url: "https://calendar.google.com",
                }
              ]
            }
          ]
        }];
        
        setBookmarkTree(demoTree);
        const rootFolders = new Set(demoTree[0].children?.map(node => node.id) || []);
        setSelectedBookmarks(rootFolders);
        
        toast.success("Demo bookmarks loaded successfully!");
        return true;
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks. Please try again.");
      return false;
    } finally {
      setIsLoadingBookmarks(false);
    }
  };

  const processSelectedBookmarks = async () => {
    setIsImporting(true);
    try {
      if (selectedBookmarks.size === 0) {
        toast.error("Please select at least one bookmark folder to import");
        return false;
      }

      const getBookmarksFromNode = async (nodeId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
        try {
          const subtree = await chrome.bookmarks.getSubTree(nodeId);
          return subtree;
        } catch (error) {
          console.error(`Error getting subtree for node ${nodeId}:`, error);
          return [];
        }
      };

      const selectedBookmarkNodes = await Promise.all(
        Array.from(selectedBookmarks).map(id => getBookmarksFromNode(id))
      );

      console.log("Processing selected bookmarks:", selectedBookmarkNodes);
      toast.success(`Successfully imported ${selectedBookmarks.size} bookmark folders!`);
      return true;
    } catch (error) {
      console.error("Error processing bookmarks:", error);
      toast.error("Failed to process bookmarks. Please try again.");
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll && bookmarkTree[0]?.children) {
      const allBookmarkIds = new Set<string>();
      const collectIds = (node: BookmarkNode) => {
        if (node.id) allBookmarkIds.add(node.id);
        node.children?.forEach(collectIds);
      };
      bookmarkTree[0].children.forEach(collectIds);
      setSelectedBookmarks(allBookmarkIds);
    } else {
      setSelectedBookmarks(new Set());
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const termsAccepted = localStorage.getItem('termsAccepted');
      if (!termsAccepted) {
        const confirmed = window.confirm(
          "By continuing, you agree to our Terms of Service and Privacy Policy. Would you like to proceed?"
        );
        if (!confirmed) return;
        localStorage.setItem('termsAccepted', 'true');
      }
    }
    
    if (currentStepData.requiresAuth && !user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        toast.error("Please sign in to continue");
        return;
      }
    }

    if (currentStep === 3 && !selectedPlan) {
      toast.error("Please select a plan to continue");
      return;
    }

    if (currentStep === 4) {
      if (bookmarkTree.length === 0) {
        const success = await loadBookmarkTree();
        if (!success) return;
      } else {
        const success = await processSelectedBookmarks();
        if (!success) return;
        setCurrentStep(currentStep + 1);
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <currentStepData.icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{currentStepData.title}</CardTitle>
          </div>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentStep === 4 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {selectAll ? "Deselect All" : "Select All"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedBookmarks.size} selected
                </span>
              </div>
              <ScrollArea className="h-[calc(100vh-400px)] min-h-[300px] rounded-md border p-4">
                {isLoadingBookmarks ? (
                  <div className="flex items-center justify-center h-full">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : bookmarkTree.length > 0 ? (
                  bookmarkTree.map(node => renderBookmarkTree(node))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                    <Upload className="h-12 w-12" />
                    <p>Click Next to load your bookmarks</p>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
          
          <p className="text-muted-foreground text-sm">
            {currentStepData.content}
          </p>
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <Button 
            variant="ghost"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={isProcessingPayment || isLoadingBookmarks}
            className="min-w-[100px]"
          >
            {isProcessingPayment || isLoadingBookmarks ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : null}
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

