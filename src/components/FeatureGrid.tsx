
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatedGradient } from "@/components/ui/animated-gradient-with-svg";
import {
  BookmarkIcon,
  MessageSquare,
  FileText,
  BarChart,
  Timer,
  CheckSquare,
  StickyNote,
  Package,
} from "lucide-react";
import { motion } from "framer-motion";

const FeatureGrid = () => {
  const features = [
    { 
      icon: BookmarkIcon, 
      label: "Bookmarks", 
      path: "/bookmarks",
      colors: ["#8B5CF6", "#6366F1", "#A78BFA"]
    },
    { 
      icon: MessageSquare, 
      label: "Chat", 
      path: "/chat",
      colors: ["#3B82F6", "#60A5FA", "#93C5FD"]
    },
    { 
      icon: FileText, 
      label: "Summaries", 
      path: "/summaries",
      colors: ["#EC4899", "#F472B6", "#FBCFE8"]
    },
    { 
      icon: BarChart, 
      label: "Analytics", 
      path: "/analytics",
      colors: ["#F59E0B", "#FBBF24", "#FCD34D"]
    },
    { 
      icon: Timer, 
      label: "Timer", 
      path: "/timer",
      colors: ["#10B981", "#34D399", "#6EE7B7"]
    },
    { 
      icon: CheckSquare, 
      label: "Tasks", 
      path: "/tasks",
      colors: ["#6366F1", "#818CF8", "#A5B4FC"]
    },
    { 
      icon: StickyNote, 
      label: "Notes", 
      path: "/notes",
      colors: ["#9333EA", "#A855F7", "#C084FC"]
    },
    { 
      icon: Package, 
      label: "Services", 
      path: "/suggested-services",
      colors: ["#475569", "#64748B", "#94A3B8"]
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4 md:gap-5">
      {features.map((feature, index) => (
        <Link
          key={feature.path}
          to={feature.path}
          className="no-underline hover:no-underline"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative h-24 sm:h-28 rounded-xl overflow-hidden"
          >
            <AnimatedGradient colors={feature.colors} speed={0.05} blur="medium" />
            <Button
              variant="ghost"
              className="relative z-10 h-full w-full rounded-xl bg-background/50 backdrop-blur-sm border-2 border-primary/10 transition-all duration-200 hover:bg-background/60 hover:scale-[1.02]"
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <feature.icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-7 sm:w-7" />
                <span className="font-medium tracking-wide text-sm">
                  {feature.label}
                </span>
              </div>
            </Button>
          </motion.div>
        </Link>
      ))}
    </div>
  );
};

export default FeatureGrid;
