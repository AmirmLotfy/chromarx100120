import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface SummariesButtonProps {
  newSummariesCount?: number;
}

const SummariesButton = ({ newSummariesCount = 0 }: SummariesButtonProps) => {
  const navigate = useNavigate();
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    setShowBadge(newSummariesCount > 0);
  }, [newSummariesCount]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate("/summaries")}
      className="relative ml-1"
    >
      <FileText className="h-4 w-4 mr-2" />
      Summaries
      {showBadge && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {newSummariesCount}
        </Badge>
      )}
    </Button>
  );
};

export default SummariesButton;