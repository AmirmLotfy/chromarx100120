
import React from "react";
import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  progress: number;
  message?: string;
}

export const ProgressIndicator = ({ progress, message }: ProgressIndicatorProps) => {
  return (
    <div className="w-full space-y-2">
      <Progress value={progress} className="w-full" />
      {message && (
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      )}
    </div>
  );
};
