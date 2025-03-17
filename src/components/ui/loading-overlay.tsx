
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress, CircularProgress } from "@/components/ui/progress";
import { streamingAnimationFrames } from "@/utils/streamingUtils";
import { useState, useEffect } from "react";

interface LoadingOverlayProps {
  message?: string;
  className?: string;
  isLoading: boolean;
  progress?: number;
  variant?: "spinner" | "progress" | "circular" | "pulse";
  position?: "fixed" | "absolute";
  onCancel?: () => void;
  steps?: Array<string>;
  currentStep?: number;
}

export function LoadingOverlay({ 
  message = "Loading...", 
  className, 
  isLoading,
  progress,
  variant = "spinner",
  position = "fixed",
  onCancel,
  steps,
  currentStep = 0
}: LoadingOverlayProps) {
  const [animationFrame, setAnimationFrame] = useState(0);
  
  // For spinner animation
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % streamingAnimationFrames.length);
    }, 80);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const positionClass = position === "fixed" 
    ? "fixed inset-0" 
    : "absolute inset-0";

  return (
    <div className={cn(
      positionClass,
      "bg-background/80 backdrop-blur-sm z-50",
      "flex items-center justify-center",
      "animate-in fade-in-0",
      className
    )}>
      <div className="flex flex-col items-center gap-4 text-center max-w-md p-6 rounded-lg bg-card/50 shadow-lg">
        {variant === "spinner" && (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        )}
        
        {variant === "pulse" && (
          <div className="h-12 w-12 text-center text-primary text-2xl font-mono animate-pulse">
            {streamingAnimationFrames[animationFrame]}
          </div>
        )}
        
        {variant === "progress" && progress !== undefined && (
          <div className="w-full space-y-2">
            <Progress 
              value={progress} 
              className="h-2" 
              animated 
              showValue
              valuePosition="bottom"
            />
          </div>
        )}
        
        {variant === "circular" && progress !== undefined && (
          <CircularProgress 
            value={progress} 
            size={100} 
            strokeWidth={8} 
            showValue
            label="Loading"
          />
        )}
        
        <div className="space-y-2">
          <p className="text-base font-medium">{message}</p>
          
          {steps && steps.length > 0 && (
            <div className="mt-4 space-y-1">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index < currentStep ? (
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : index === currentStep ? (
                    <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                  )}
                  <span className={cn(
                    "text-xs",
                    index < currentStep ? "text-primary" : 
                    index === currentStep ? "text-foreground" : 
                    "text-muted-foreground"
                  )}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
