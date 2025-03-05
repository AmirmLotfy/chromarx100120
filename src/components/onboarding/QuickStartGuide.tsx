
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, Bookmark, FolderPlus, Search, Sparkles, Tag, ChevronRight } from "lucide-react";
import { useOnboarding } from "./OnboardingProvider";

interface QuickStartGuideProps {
  trigger?: React.ReactNode;
}

export function QuickStartGuide({ trigger }: QuickStartGuideProps) {
  const { restartOnboarding } = useOnboarding();
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-primary" />
            Quick Start Guide
          </DialogTitle>
          <DialogDescription>
            Get up to speed with ChroMarx's key features
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="font-medium text-sm mb-2">Key Features</div>
          
          <div className="space-y-3">
            {[
              {
                icon: <Bookmark className="h-5 w-5 text-blue-500" />,
                title: "Bookmark Organization",
                description: "Create folders and organize bookmarks with drag-and-drop functionality."
              },
              {
                icon: <Tag className="h-5 w-5 text-green-500" />,
                title: "Custom Categories",
                description: "Assign categories to bookmarks for easier filtering and access."
              },
              {
                icon: <Search className="h-5 w-5 text-amber-500" />,
                title: "Advanced Search",
                description: "Find bookmarks by text, tags, domains, or dates."
              },
              {
                icon: <Sparkles className="h-5 w-5 text-purple-500" />,
                title: "AI Features",
                description: "Use AI to categorize, summarize, and organize your bookmarks."
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border bg-accent/5">
                <div className="flex-shrink-0 mt-0.5">{feature.icon}</div>
                <div>
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 mt-6">
            <Button 
              variant="outline" 
              className="w-full justify-between rounded-lg"
              onClick={restartOnboarding}
            >
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Restart Interactive Tutorial
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
