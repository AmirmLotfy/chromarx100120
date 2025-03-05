
import React from "react";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { QuickStartGuide } from "./QuickStartGuide";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function HeaderHelp() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <QuickStartGuide 
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                  <span className="sr-only">Help</span>
                </Button>
              } 
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Quick Start Guide</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
