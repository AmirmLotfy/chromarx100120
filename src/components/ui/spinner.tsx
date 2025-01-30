import { cn } from "@/lib/utils";
import { Loader2, LucideProps } from "lucide-react";

interface SpinnerProps extends Omit<LucideProps, "ref"> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} {...props} />
  );
}