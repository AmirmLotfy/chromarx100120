import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

const FeatureGrid = () => {
  const features = [
    { 
      icon: BookmarkIcon, 
      label: "Bookmarks", 
      path: "/bookmarks",
      hoverClass: "hover:bg-[#9b87f5]/10 hover:border-[#9b87f5]/30" 
    },
    { 
      icon: MessageSquare, 
      label: "Chat", 
      path: "/chat",
      hoverClass: "hover:bg-[#33C3F0]/10 hover:border-[#33C3F0]/30"
    },
    { 
      icon: FileText, 
      label: "Summaries", 
      path: "/summaries",
      hoverClass: "hover:bg-[#D946EF]/10 hover:border-[#D946EF]/30"
    },
    { 
      icon: BarChart, 
      label: "Analytics", 
      path: "/analytics",
      hoverClass: "hover:bg-[#F97316]/10 hover:border-[#F97316]/30"
    },
    { 
      icon: Timer, 
      label: "Timer", 
      path: "/timer",
      hoverClass: "hover:bg-[#8B5CF6]/10 hover:border-[#8B5CF6]/30"
    },
    { 
      icon: CheckSquare, 
      label: "Tasks", 
      path: "/tasks",
      hoverClass: "hover:bg-[#1EAEDB]/10 hover:border-[#1EAEDB]/30"
    },
    { 
      icon: StickyNote, 
      label: "Notes", 
      path: "/notes",
      hoverClass: "hover:bg-[#0FA0CE]/10 hover:border-[#0FA0CE]/30"
    },
    { 
      icon: Package, 
      label: "Services", 
      path: "/suggested-services",
      hoverClass: "hover:bg-[#8E9196]/10 hover:border-[#8E9196]/30"
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 px-1 sm:px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4 md:gap-5">
      {features.map((feature) => (
        <Link
          key={feature.path}
          to={feature.path}
          className="no-underline hover:no-underline"
        >
          <Button
            variant="outline"
            className={`group h-20 sm:h-24 w-full rounded-xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 ${feature.hoverClass}`}
          >
            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
              <feature.icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 sm:h-6 sm:w-6" />
              <span className="font-medium tracking-wide text-xs sm:text-sm">
                {feature.label}
              </span>
            </div>
          </Button>
        </Link>
      ))}
    </div>
  );
};

export default FeatureGrid;