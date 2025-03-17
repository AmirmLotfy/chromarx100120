
import React, { useState, useEffect } from "react";
import { Loader2, Sparkles, CloudOff, FileCheck, Scan, Brain, Zap, ArrowRight } from "lucide-react";
import { Progress, GradientProgress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { streamingAnimationFrames } from "@/utils/streamingUtils";

interface AIProgressIndicatorProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showSparkles?: boolean;
  variant?: "inline" | "overlay" | "minimal" | "gradient" | "detailed";
  className?: string;
  status?: "processing" | "offline" | "success" | "importing" | "scanning" | "thinking" | "generating" | "analyzing";
  onCancel?: () => void; 
  autoProgress?: boolean;
  steps?: Array<{label: string, status: "pending" | "in-progress" | "completed" | "error"}>;
}

export function AIProgressIndicator({
  isLoading,
  message = "Processing with AI...",
  progress,
  showSparkles = true,
  variant = "inline",
  className = "",
  status = "processing",
  onCancel,
  autoProgress = false,
  steps
}: AIProgressIndicatorProps) {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [internalProgress, setInternalProgress] = useState(0);

  // Update animation frame for spinner
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % streamingAnimationFrames.length);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto increment progress if no external progress is provided
  useEffect(() => {
    if (!isLoading || !autoProgress || progress !== undefined) return;
    
    // Start at a random value between 5-15%
    if (internalProgress === 0) {
      setInternalProgress(Math.floor(Math.random() * 10) + 5);
    }
    
    const interval = setInterval(() => {
      setInternalProgress(prev => {
        // Progress more quickly at the beginning, slower as we approach 90%
        const increment = 
          prev < 30 ? Math.random() * 4 + 1 : // 1-5% increments
          prev < 60 ? Math.random() * 2 + 0.5 : // 0.5-2.5% increments
          prev < 85 ? Math.random() * 0.5 + 0.1 : // 0.1-0.6% increments
          0.05; // Very slow near the end
        
        return Math.min(prev + increment, 90); // Never reach 100% automatically
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, [isLoading, autoProgress, progress]);

  // Reset internal progress when loading stops
  useEffect(() => {
    if (!isLoading) {
      setInternalProgress(0);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  const displayProgress = progress ?? internalProgress;

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
      case "thinking":
        return <Brain className={getIconClass("text-indigo-500")} />;
      case "generating":
        return <Zap className={getIconClass("text-amber-500")} />;
      case "analyzing":
        return <ArrowRight className={getIconClass("text-blue-500")} />;
      case "processing":
      default:
        return <Sparkles className={getIconClass("text-primary")} />;
    }
  };

  const getStreamingAnimationIcon = () => {
    return (
      <div className={getIconClass("text-primary font-mono")}>
        {streamingAnimationFrames[animationFrame]}
      </div>
    );
  };

  const getIconClass = (color = "") => {
    const baseClass = "animate-pulse ";
    switch (variant) {
      case "overlay":
        return baseClass + "h-8 w-8 " + color;
      case "minimal":
        return baseClass + "h-4 w-4 " + color;
      case "detailed":
        return baseClass + "h-6 w-6 " + color;
      default:
        return baseClass + "h-5 w-5 " + color;
    }
  };

  const renderSteps = () => {
    if (!steps || steps.length === 0) return null;
    
    return (
      <div className="mt-3 space-y-2 text-xs">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            {step.status === "completed" ? (
              <FileCheck className="h-4 w-4 text-green-500" />
            ) : step.status === "in-progress" ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : step.status === "error" ? (
              <CloudOff className="h-4 w-4 text-red-500" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
            )}
            <span className={cn(
              step.status === "completed" ? "text-green-500" :
              step.status === "in-progress" ? "text-primary" :
              step.status === "error" ? "text-red-500" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (variant === "overlay") {
    return (
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-4 bg-card p-6 rounded-lg shadow-lg max-w-md">
          {status === "processing" ? getStreamingAnimationIcon() : getIcon()}
          <div className="space-y-3 w-full">
            <p className="text-sm font-medium text-center">{message}</p>
            {displayProgress !== undefined && (
              <GradientProgress value={displayProgress} className="h-2" animated showValue valuePosition="bottom" />
            )}
            {renderSteps()}
          </div>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {status === "processing" ? getStreamingAnimationIcon() : getIcon()}
        <span className="text-xs text-muted-foreground">{message}</span>
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div className={`flex flex-col gap-2 p-3 border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-md ${className}`}>
        <div className="flex items-center gap-3">
          {status === "processing" ? getStreamingAnimationIcon() : getIcon()}
          <p className="text-sm">{message}</p>
        </div>
        {displayProgress !== undefined && (
          <GradientProgress value={displayProgress} className="h-2 mt-1" animated />
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`flex flex-col gap-3 p-4 border bg-card/50 rounded-md shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          {status === "processing" ? getStreamingAnimationIcon() : getIcon()}
          <div>
            <p className="text-sm font-medium">{message}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "processing" 
                ? "AI is processing your request..." 
                : status === "thinking" 
                  ? "Thinking about possible solutions..." 
                  : status === "generating" 
                    ? "Generating content for you..." 
                    : status === "analyzing" 
                      ? "Analyzing your data..." 
                      : "Working on your request..."}
            </p>
          </div>
        </div>
        {displayProgress !== undefined && (
          <GradientProgress 
            value={displayProgress} 
            className="h-2.5" 
            animated 
            showValue 
            valuePosition="right" 
          />
        )}
        {renderSteps()}
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`flex items-center gap-3 p-3 border bg-accent/20 rounded-md ${className}`}>
      {status === "processing" ? getStreamingAnimationIcon() : getIcon()}
      <div className="flex-1 space-y-2">
        <p className="text-sm">{message}</p>
        {displayProgress !== undefined && (
          <Progress value={displayProgress} className="h-1.5" animated />
        )}
      </div>
    </div>
  );
}
