
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { geminiService } from "@/services/geminiService";

const AdvancedSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveApiKey = async () => {
    try {
      await geminiService.setApiKey(apiKey);
      setApiKey("");
      toast.success("API key saved successfully");
    } catch (error) {
      toast.error("Failed to save API key");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Advanced Settings</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <Button onClick={handleSaveApiKey}>Save</Button>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-api-key"
                checked={showApiKey}
                onCheckedChange={setShowApiKey}
              />
              <Label htmlFor="show-api-key">Show API key</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
