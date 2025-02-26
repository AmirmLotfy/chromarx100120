
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Key } from "lucide-react";
import { toast } from "sonner";
import { chromeDb } from "@/lib/chrome-storage";

const GeminiKeySettings = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const savedKey = await chromeDb.get<string>("gemini_api_key");
        if (savedKey) {
          setApiKey(savedKey);
        }
      } catch (error) {
        console.error("Error loading API key:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, []);

  const handleSaveKey = async () => {
    try {
      await chromeDb.set("gemini_api_key", apiKey.trim());
      toast.success("API key saved successfully");
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("Failed to save API key");
    }
  };

  const handleRemoveKey = async () => {
    try {
      await chromeDb.remove("gemini_api_key");
      setApiKey("");
      toast.success("API key removed successfully");
    } catch (error) {
      console.error("Error removing API key:", error);
      toast.error("Failed to remove API key");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          <h3 className="font-semibold">Gemini API Key</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Enter your Gemini API key to enable AI features. You can get one from the{" "}
          <a 
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google AI Studio
          </a>
        </p>

        <div className="flex gap-2">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="flex-1"
          />
          <Button onClick={handleSaveKey} disabled={!apiKey.trim()}>
            Save
          </Button>
          {apiKey && (
            <Button variant="destructive" onClick={handleRemoveKey}>
              Remove
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GeminiKeySettings;
