import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getGeminiResponse } from "@/utils/geminiUtils";
import { Lightbulb } from "lucide-react";

interface Tip {
  title: string;
  description: string;
  category: string;
}

const AITips = () => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await getGeminiResponse({
          prompt: "Analyze my browsing patterns and provide productivity tips",
          type: "summarize",
          language: "en",
          contentType: "productivity"
        });

        const parsedTips = JSON.parse(response.result);
        setTips(parsedTips);
      } catch (error) {
        console.error("Error fetching AI tips:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTips();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="w-full h-[200px] animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tips.map((tip, index) => (
        <Card key={index} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold">{tip.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{tip.description}</p>
          <div className="text-xs font-medium text-primary">{tip.category}</div>
        </Card>
      ))}
    </div>
  );
};

export default AITips;