
import React from "react";
import { Progress, GradientProgress } from "@/components/ui/progress";
import { Loader2, AlertCircle, CheckCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  progress: number;
  message?: string;
  status?: "loading" | "success" | "error" | "paused";
  variant?: "default" | "gradient" | "success" | "warning" | "error" | "info";
  showValue?: boolean;
  valuePosition?: "inside" | "right" | "bottom";
  animated?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const ProgressIndicator = ({ 
  progress, 
  message,
  status = "loading",
  variant = "default",
  showValue = false,
  valuePosition = "right",
  animated = false,
  className,
  size = "md",
  showIcon = true
}: ProgressIndicatorProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "paused":
        return <Timer className="h-4 w-4 text-amber-500" />;
      case "loading":
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
  };

  const getHeightClass = () => {
    switch (size) {
      case "sm":
        return "h-1";
      case "lg":
        return "h-3";
      case "md":
      default:
        return "h-2";
    }
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {(message || showIcon) && (
        <div className="flex items-center gap-2 mb-1">
          {showIcon && getStatusIcon()}
          {message && (
            <p className={cn(
              "text-sm",
              status === "loading" ? "text-muted-foreground" :
              status === "success" ? "text-emerald-500" :
              status === "error" ? "text-red-500" :
              status === "paused" ? "text-amber-500" : "text-muted-foreground"
            )}>
              {message}
            </p>
          )}
          {!showValue && progress > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{progress}%</span>
          )}
        </div>
      )}

      {variant === "gradient" ? (
        <GradientProgress 
          value={progress} 
          animated={animated}
          showValue={showValue}
          valuePosition={valuePosition}
          className={getHeightClass()}
        />
      ) : (
        <Progress 
          value={progress} 
          animated={animated}
          showValue={showValue}
          valuePosition={valuePosition}
          variant={variant !== "default" ? variant : undefined}
          className={getHeightClass()}
        />
      )}
    </div>
  );
};

// Indeterminate progress indicator for when we don't know the exact progress
interface IndeterminateProgressProps {
  message?: string;
  className?: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export const IndeterminateProgress = ({
  message,
  className,
  variant = "default"
}: IndeterminateProgressProps) => {
  const getVariantClass = () => {
    switch (variant) {
      case "success": return "bg-emerald-500";
      case "warning": return "bg-amber-500";
      case "error": return "bg-red-500";
      case "info": return "bg-blue-500";
      default: return "bg-primary";
    }
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {message && (
        <p className="text-sm text-muted-foreground flex items-center">
          <Loader2 className="h-3 w-3 animate-spin mr-2" />
          {message}
        </p>
      )}
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full w-1/3 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]",
            getVariantClass()
          )}
        />
      </div>
    </div>
  );
};

// Export both components
export default ProgressIndicator;
