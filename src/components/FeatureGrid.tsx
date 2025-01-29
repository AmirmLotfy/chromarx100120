import {
  Bookmark,
  MessageSquare,
  BarChart,
  Clock,
  ListTodo,
  StickyNote,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    name: "Bookmarks",
    icon: Bookmark,
    path: "/bookmarks",
    color: "bg-accent",
  },
  {
    name: "Chat",
    icon: MessageSquare,
    path: "/chat",
    color: "bg-accent",
  },
  {
    name: "Analytics",
    icon: BarChart,
    path: "/analytics",
    color: "bg-accent",
  },
  {
    name: "Time",
    icon: Clock,
    path: "/time",
    color: "bg-accent",
  },
  {
    name: "Tasks",
    icon: ListTodo,
    path: "/tasks",
    color: "bg-accent",
  },
  {
    name: "Notes",
    icon: StickyNote,
    path: "/notes",
    color: "bg-accent",
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/settings",
    color: "bg-accent",
  },
];

const FeatureGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-4 animate-fade-in">
      {features.map((feature) => (
        <Link
          key={feature.name}
          to={feature.path}
          className="group p-4 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <div
            className={`${feature.color} rounded-lg p-6 flex flex-col items-center justify-center space-y-2 transition-colors group-hover:bg-primary/10`}
          >
            <feature.icon className="h-8 w-8 text-primary transition-colors group-hover:text-primary" />
            <span className="text-sm font-medium text-foreground">
              {feature.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default FeatureGrid;