
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeminiSettings from "./GeminiSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AISettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Settings</h2>
      </div>
      
      <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
        <Info className="h-4 w-4" />
        <AlertTitle>API Key Required</AlertTitle>
        <AlertDescription>
          To use AI features, you need to add your own Google Gemini API key. You can get one from the Google AI Studio.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="apikey" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apikey">API Key</TabsTrigger>
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
