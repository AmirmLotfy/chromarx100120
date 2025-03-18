
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeminiSettings from "./GeminiSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AISettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Settings</h2>
      </div>
      
      <Alert className="bg-green-50 border-green-200 text-green-800">
        <Sparkles className="h-4 w-4" />
        <AlertTitle>AI Features Ready to Use</AlertTitle>
        <AlertDescription>
          AI features are already enabled with our shared API key. You can optionally add your own key for increased usage limits.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="apikey" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apikey">API Key (Optional)</TabsTrigger>
          <TabsTrigger value="preferences">AI Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="apikey" className="mt-4">
          <GeminiSettings />
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Preferences</CardTitle>
              <CardDescription>
                Configure how AI features work in the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AI preference settings will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
