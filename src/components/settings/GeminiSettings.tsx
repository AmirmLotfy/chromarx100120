
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

export default function GeminiSettings() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Gemini API Settings</CardTitle>
        <CardDescription>
          Information about the Gemini AI integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>API Key Configured</AlertTitle>
          <AlertDescription>
            Your extension has a built-in Gemini API key. All AI features are ready to use without any additional setup.
          </AlertDescription>
        </Alert>
        
        <p className="text-sm text-muted-foreground">
          The built-in API key enables AI-powered features like content summarization, bookmark categorization, and smart timer suggestions.
        </p>
      </CardContent>
    </Card>
  );
}
