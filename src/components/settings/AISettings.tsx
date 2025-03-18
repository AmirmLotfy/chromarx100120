
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeminiSettings from "./GeminiSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function AISettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Settings</h2>
      </div>
      
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
