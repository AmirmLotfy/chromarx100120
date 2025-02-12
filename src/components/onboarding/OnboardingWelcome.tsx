
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
      className="space-y-8 px-4"
    >
      <div className="text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
          Welcome to ChroMarx
        </h2>
        <div className="space-y-3">
          <p className="text-lg sm:text-xl text-foreground/90 font-medium">
            Your Gemini-Powered Bookmark Manager
          </p>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Transform your bookmarks into an intelligent, organized, and productive system.
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button 
          onClick={onNext} 
          size="lg" 
          className="h-14 px-8 text-lg rounded-full transition-all duration-300 hover:scale-105 active:scale-100 shadow-lg hover:shadow-xl active:shadow-md"
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default OnboardingWelcome;
