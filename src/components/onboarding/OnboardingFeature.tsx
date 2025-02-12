
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Bookmark, BookOpen, BarChart2, ListTodo } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OnboardingFeatureProps {
  onNext: () => void;
  onBack: () => void;
}

const features = [
  {
    icon: Bookmark,
    title: "Smart Bookmark Management",
    description: "Organize your bookmarks effortlessly with smart categorization and auto-detection."
  },
  {
    icon: BookOpen,
    title: "AI-Powered Insights",
    description: "Get summaries, recommendations, and analytics powered by Gemini AI."
  },
  {
    icon: ListTodo,
    title: "Task & Note Management",
    description: "Stay productive with AI-driven task management and note-taking."
  },
  {
    icon: BarChart2,
    title: "Analytics Dashboard",
    description: "Track your browsing patterns and productivity trends."
  }
];

const OnboardingFeature = ({ onNext, onBack }: OnboardingFeatureProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Key Features</h2>
        <p className="text-muted-foreground">
          Discover what makes ChroMarx special
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="p-4 space-y-2 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default OnboardingFeature;
