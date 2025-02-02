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
    { icon: BookmarkIcon, label: "Bookmarks", path: "/bookmarks" },
    { icon: MessageSquare, label: "Chat", path: "/chat" },
    { icon: FileText, label: "Summaries", path: "/summaries" },
    { icon: BarChart, label: "Analytics", path: "/analytics" },
    { icon: Timer, label: "Timer", path: "/timer" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: StickyNote, label: "Notes", path: "/notes" },
    { icon: Package, label: "Services", path: "/suggested-services" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4 md:gap-5 sm:px-4">
      {features.map((feature) => (
        <Link
          key={feature.path}
          to={feature.path}
          className="no-underline hover:no-underline"
        >
          <Button
            variant="outline"
            className="group h-24 w-full rounded-2xl border-2 border-primary/10 bg-primary/5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/10 sm:h-32"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <feature.icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
              <span className="font-medium tracking-wide text-sm sm:text-base">
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