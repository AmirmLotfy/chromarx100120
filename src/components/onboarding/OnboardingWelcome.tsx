
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface OnboardingWelcomeProps {
  onNext: () => void;
}

const OnboardingWelcome = ({ onNext }: OnboardingWelcomeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Welcome to ChroMarx</h2>
        <p className="text-muted-foreground">
          Your Gemini-Powered Bookmark Manager – Organize, Optimize, Excel!
        </p>
        <p className="text-sm text-muted-foreground">
          Transform your bookmarks into an intelligent, organized, and productive system.
        </p>
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={onNext} size="lg">
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default OnboardingWelcome;
