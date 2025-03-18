
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, Info, CheckCircle } from "lucide-react";

export default function AISettings() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Settings</h2>
      </div>
      
      <Alert className="bg-green-50 border-green-200 text-green-800">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>AI Ready</AlertTitle>
        <AlertDescription>
          AI features are ready to use. Your extension includes a built-in API key for Google Gemini.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="preferences" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="preferences">AI Preferences</TabsTrigger>
        </TabsList>
        
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
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Available AI Features</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Content summarization</li>
                  <li>Bookmark categorization</li>
                  <li>Smart timer suggestions</li>
                  <li>AI-powered productivity insights</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
