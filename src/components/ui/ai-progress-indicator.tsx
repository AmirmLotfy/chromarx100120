
import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AIProgressIndicatorProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showSparkles?: boolean;
  variant?: "inline" | "overlay" | "minimal";
  className?: string;
}

export function AIProgressIndicator({
  isLoading,
  message = "Processing with AI...",
  progress,
  showSparkles = true,
  variant = "inline",
  className = "",
}: AIProgressIndicatorProps) {
  if (!isLoading) return null;

  if (variant === "overlay") {
    return (
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4 bg-card p-6 rounded-lg shadow-lg max-w-md">
          {showSparkles ? (
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
          <div className="space-y-2 w-full">
            <p className="text-sm font-medium text-center">{message}</p>
            {progress !== undefined && (
              <Progress value={progress} className="h-1.5" />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showSparkles ? (
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`flex items-center gap-3 p-3 border bg-accent/20 rounded-md ${className}`}>
      {showSparkles ? (
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
      ) : (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      )}
      <div className="flex-1 space-y-2">
        <p className="text-sm">{message}</p>
        {progress !== undefined && (
          <Progress value={progress} className="h-1.5" />
        )}
      </div>
    </div>
  );
}
