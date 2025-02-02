import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps
  extends React.HTMLAttributes<SVGSVGElement> {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export const CircularProgress = React.forwardRef<
  SVGSVGElement,
  CircularProgressProps
>(({ value, size = 256, strokeWidth = 8, className, ...props }, ref) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("animate-in fade-in duration-1000", className)}
      {...props}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        className="stroke-muted fill-none"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="stroke-primary fill-none transition-all duration-500 ease-in-out"
        style={{
          transform: `rotate(-90deg)`,
          transformOrigin: "50% 50%",
        }}
      />
    </svg>
  );
});
CircularProgress.displayName = "CircularProgress";