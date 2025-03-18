
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { geminiService } from "@/services/geminiService";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Key } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function GeminiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isKeyHidden, setIsKeyHidden] = useState(true);

  useEffect(() => {
    checkExistingKey();
  }, []);

  const checkExistingKey = async () => {
    const hasKey = await geminiService.hasApiKey();
    setHasExistingKey(hasKey);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    setIsSaving(true);
    
    try {
      const success = await geminiService.setApiKey(apiKey);
      if (success) {
        setHasExistingKey(true);
        setApiKey("");
        setIsKeyHidden(true);
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("Failed to save API key");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      await geminiService.clearApiKey();
      setHasExistingKey(false);
      toast.success("API key removed successfully");
    } catch (error) {
      console.error("Error clearing API key:", error);
      toast.error("Failed to remove API key");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Key className="h-5 w-5" />
          Gemini API Settings
        </CardTitle>
        <CardDescription>
          Configure your Google Gemini API key to enable AI features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingKey ? (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>API Key Configured</AlertTitle>
            <AlertDescription>
              Your Gemini API key is set up and working correctly.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              To use AI features, you need to add your Gemini API key. You can get one from the
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="underline ml-1"
              >
                Google AI Studio
              </a>.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="api-key">Gemini API Key</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type={isKeyHidden ? "password" : "text"}
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsKeyHidden(!isKeyHidden)}
            >
              {isKeyHidden ? "Show" : "Hide"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your API key is stored locally and never shared.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={!hasExistingKey || isSaving}
        >
          Remove Key
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!apiKey.trim() || isSaving}
        >
          {isSaving ? "Verifying..." : "Save API Key"}
        </Button>
      </CardFooter>
    </Card>
  );
}
