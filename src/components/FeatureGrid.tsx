import { Link, useNavigate } from "react-router-dom";
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
import { useFirebase } from "@/contexts/FirebaseContext";
import { toast } from "sonner";

const FeatureGrid = () => {
  const navigate = useNavigate();
  const { user } = useFirebase();

  const handleNavigation = (path: string) => {
    if (!user) {
      toast.error("Please sign in to access this feature");
      return;
    }
    navigate(path);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        onClick={() => handleNavigation('/bookmarks')}
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#0EA5E9] hover:bg-gradient-to-br hover:from-[#0EA5E9] hover:to-[#38BDF8] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
      >
        <BookmarkIcon className="h-6 w-6" />
        <span className="font-medium">Bookmarks</span>
      </Button>
      
      <Button
        onClick={() => handleNavigation('/chat')}
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-gradient-to-br hover:from-[#8B5CF6] hover:to-[#A78BFA] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="font-medium">Chat</span>
      </Button>

      <Button
        onClick={() => handleNavigation('/summaries')}
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#D946EF] hover:bg-gradient-to-br hover:from-[#D946EF] hover:to-[#E879F9] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
      >
        <FileText className="h-6 w-6" />
        <span className="font-medium">Summaries</span>
      </Button>

      <Button
        onClick={() => handleNavigation('/analytics')}
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#F97316] hover:bg-gradient-to-br hover:from-[#F97316] hover:to-[#FB923C] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
      >
        <BarChart className="h-6 w-6" />
        <span className="font-medium">Analytics</span>
      </Button>

      <Button
        onClick={() => handleNavigation('/timer')}
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#10B981] hover:bg-gradient-to-br hover:from-[#10B981] hover:to-[#34D399] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
      >
        <Timer className="h-6 w-6" />
        <span className="font-medium">Timer</span>
      </Button>

      <Button
        onClick={() => handleNavigation('/tasks')}
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#6366F1] hover:bg-gradient-to-br hover:from-[#6366F1] hover:to-[#818CF8] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
      >
        <CheckSquare className="h-6 w-6" />
        <span className="font-medium">Tasks</span>
      </Button>

      <Button
        onClick={() => handleNavigation('/notes')}
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#EC4899] hover:bg-gradient-to-br hover:from-[#EC4899] hover:to-[#F472B6] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
      >
        <StickyNote className="h-6 w-6" />
        <span className="font-medium">Notes</span>
      </Button>

      <Button
        onClick={() => handleNavigation('/suggested-services')}
        variant="outline"
        className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-[#14B8A6] hover:bg-gradient-to-br hover:from-[#14B8A6] hover:to-[#2DD4BF] text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-none"
      >
        <Package className="h-6 w-6" />
        <span className="font-medium">Services</span>
      </Button>
    </div>
  );
};

export default FeatureGrid;