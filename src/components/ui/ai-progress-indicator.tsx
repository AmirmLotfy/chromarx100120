
import React from "react";
import { Loader2, Sparkles, CloudOff, FileCheck, Scan } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AIProgressIndicatorProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showSparkles?: boolean;
  variant?: "inline" | "overlay" | "minimal";
  className?: string;
  status?: "processing" | "offline" | "success" | "importing" | "scanning";
}

export function AIProgressIndicator({
  isLoading,
  message = "Processing with AI...",
  progress,
  showSparkles = true,
  variant = "inline",
  className = "",
  status = "processing",
}: AIProgressIndicatorProps) {
  if (!isLoading) return null;

  const getIcon = () => {
    if (!showSparkles) return <Loader2 className={getIconClass()} />;
    
    switch (status) {
      case "offline":
        return <CloudOff className={getIconClass("text-amber-500")} />;
      case "success":
        return <FileCheck className={getIconClass("text-green-500")} />;
      case "importing":
        return <FileCheck className={getIconClass("text-blue-500")} />;
      case "scanning":
        return <Scan className={getIconClass("text-purple-500")} />;
      case "processing":
      default:
        return <Sparkles className={getIconClass("text-primary")} />;
    }
  };

  const getIconClass = (color = "") => {
    const baseClass = "animate-pulse ";
    switch (variant) {
      case "overlay":
        return baseClass + "h-8 w-8 " + color;
      case "minimal":
        return baseClass + "h-4 w-4 " + color;
      default:
        return baseClass + "h-5 w-5 " + color;
    }
  };

  if (variant === "overlay") {
    return (
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4 bg-card p-6 rounded-lg shadow-lg max-w-md">
          {getIcon()}
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
        {getIcon()}
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`flex items-center gap-3 p-3 border bg-accent/20 rounded-md ${className}`}>
      {getIcon()}
      <div className="flex-1 space-y-2">
        <p className="text-sm">{message}</p>
        {progress !== undefined && (
          <Progress value={progress} className="h-1.5" />
        )}
      </div>
    </div>
  );
}
