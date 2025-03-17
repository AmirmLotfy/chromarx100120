
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  showValue?: boolean;
  valuePosition?: 'inside' | 'right' | 'bottom';
  animated?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value, 
  indicatorClassName,
  showValue = false,
  valuePosition = 'right',
  animated = false,
  variant = 'default',
  ...props 
}, ref) => {
  // Get variant colors
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return "bg-emerald-100 dark:bg-emerald-950/20";
      case 'warning':
        return "bg-amber-100 dark:bg-amber-950/20";
      case 'error':
        return "bg-red-100 dark:bg-red-950/20";
      case 'info':
        return "bg-blue-100 dark:bg-blue-950/20";
      default:
        return "bg-secondary";
    }
  };

  const getIndicatorStyles = () => {
    switch (variant) {
      case 'success':
        return "bg-emerald-500";
      case 'warning':
        return "bg-amber-500";
      case 'error':
        return "bg-red-500";
      case 'info':
        return "bg-blue-500";
      default:
        return "bg-primary";
    }
  };

  // Render progress component with variants and animation options
  return (
    <div className={cn("relative", showValue && valuePosition === 'bottom' && "mb-6")}>
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full",
          getVariantStyles(),
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all",
            animated && "animate-pulse",
            getIndicatorStyles(),
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      
      {showValue && (
        valuePosition === 'right' ? (
          <span className="absolute -right-8 top-0 text-xs text-muted-foreground">
            {value || 0}%
          </span>
        ) : valuePosition === 'inside' && value && value > 15 ? (
          <span className="absolute left-2 top-0 text-xs text-white -translate-y-0.5">
            {value || 0}%
          </span>
        ) : valuePosition === 'bottom' ? (
          <span className="absolute left-0 bottom-0 text-xs text-muted-foreground -mb-5">
            {value || 0}%
          </span>
        ) : null
      )}
    </div>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Circular Progress Component for the timer
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  animated?: boolean;
  label?: string;
}

const CircularProgress = ({
  value,
  size = 120,
  strokeWidth = 10,
  showValue = false,
  className,
  variant = 'default',
  animated = false,
  label,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Get variant colors for circular progress
  const getTrackColor = () => {
    switch (variant) {
      case 'success':
        return "stroke-emerald-100 dark:stroke-emerald-950/20";
      case 'warning':
        return "stroke-amber-100 dark:stroke-amber-950/20";
      case 'error':
        return "stroke-red-100 dark:stroke-red-950/20";
      case 'info':
        return "stroke-blue-100 dark:stroke-blue-950/20";
      default:
        return "stroke-muted";
    }
  };

  const getProgressColor = () => {
    switch (variant) {
      case 'success':
        return "stroke-emerald-500";
      case 'warning':
        return "stroke-amber-500";
      case 'error':
        return "stroke-red-500";
      case 'info':
        return "stroke-blue-500";
      default:
        return "stroke-primary";
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("transform", animated && "animate-pulse", className)}
      >
        <circle
          className={getTrackColor()}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          className={cn(
            getProgressColor(),
            "transition-all duration-500 ease-in-out"
          )}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold">{Math.round(value)}%</span>
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
        </div>
      )}
    </div>
  );
};

// Linear gradient progress
interface GradientProgressProps extends Omit<ProgressProps, 'variant'> {
  startColor?: string;
  endColor?: string;
}

const GradientProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  GradientProgressProps
>(({ 
  className, 
  value, 
  startColor = "#9b87f5", 
  endColor = "#D946EF",
  showValue = false,
  valuePosition = 'right',
  animated = false,
  ...props 
}, ref) => {
  // Create a unique ID for the gradient
  const gradientId = React.useId();
  
  return (
    <div className={cn("relative", showValue && valuePosition === 'bottom' && "mb-6")}>
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
        </svg>
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all",
            animated && "animate-pulse"
          )}
          style={{ 
            transform: `translateX(-${100 - (value || 0)}%)`,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='url(%23${gradientId})'/%3E%3C/svg%3E")`,
          }}
        />
      </ProgressPrimitive.Root>
      
      {showValue && (
        valuePosition === 'right' ? (
          <span className="absolute -right-8 top-0 text-xs text-muted-foreground">
            {value || 0}%
          </span>
        ) : valuePosition === 'inside' && value && value > 15 ? (
          <span className="absolute left-2 top-0 text-xs text-white -translate-y-0.5">
            {value || 0}%
          </span>
        ) : valuePosition === 'bottom' ? (
          <span className="absolute left-0 bottom-0 text-xs text-muted-foreground -mb-5">
            {value || 0}%
          </span>
        ) : null
      )}
    </div>
  );
});
GradientProgress.displayName = "GradientProgress";

// Stepped progress for multi-step workflows
interface SteppedProgressProps {
  steps: Array<{ label: string; completed: boolean; current?: boolean }>;
  className?: string;
}

const SteppedProgress = ({ steps, className }: SteppedProgressProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                  step.completed ? "bg-primary border-primary text-primary-foreground" : 
                  step.current ? "border-primary text-primary" : 
                  "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              {/* Step label */}
              <span className={cn(
                "mt-2 text-xs", 
                step.completed || step.current ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            
            {/* Connector line (except after last step) */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2">
                <div 
                  className={cn(
                    "h-full", 
                    steps[index].completed ? "bg-primary" : "bg-muted"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export { Progress, CircularProgress, GradientProgress, SteppedProgress }
