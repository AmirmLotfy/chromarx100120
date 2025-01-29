import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGemini } from "@/contexts/GeminiContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const GeminiApiKeyForm = () => {
  const [key, setKey] = useState("");
  const { setApiKey, apiKey } = useGemini();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    await setApiKey(key);
    setKey("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gemini API Key</CardTitle>
        <CardDescription>
          Enter your Gemini API key to enable AI features. The key will be securely stored and encrypted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder={apiKey ? "••••••••" : "Enter Gemini API key"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <Button type="submit">Save API Key</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GeminiApiKeyForm;