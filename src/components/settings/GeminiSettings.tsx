
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Shield } from "lucide-react";

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
            Your extension uses a secure proxy service to access Gemini AI. All API keys are stored securely on the server.
          </AlertDescription>
        </Alert>
        
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Shield className="h-4 w-4" />
          <AlertTitle>Enhanced Security</AlertTitle>
          <AlertDescription>
            API requests are processed through a secure server-side function, protecting your data and API credentials.
          </AlertDescription>
        </Alert>
        
        <p className="text-sm text-muted-foreground">
          This secure setup enables AI-powered features like content summarization, bookmark categorization, and smart timer suggestions without exposing sensitive API keys.
        </p>
      </CardContent>
    </Card>
  );
}
