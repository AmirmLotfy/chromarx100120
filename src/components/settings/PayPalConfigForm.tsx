
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { configurationService } from "@/services/configurationService";

// Define a proper type for the PayPal config
interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

const PayPalConfigForm = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<PayPalConfig>({
    clientId: '',
    mode: 'sandbox'
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const paypalConfig = await configurationService.getPayPalConfig();
        setConfig({
          clientId: paypalConfig.clientId || '',
          mode: paypalConfig.mode === 'live' ? 'live' : 'sandbox'
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading PayPal configuration:", error);
        toast.error("Failed to load PayPal configuration");
        setIsLoading(false);
      }
    };
    
    loadConfig();
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const success = await configurationService.savePayPalConfig(config);
      
      if (success) {
        toast.success("PayPal configuration saved successfully");
        setIsEditing(false);
      } else {
        toast.error("Failed to save PayPal configuration");
      }
    } catch (error) {
      console.error("Error saving PayPal configuration:", error);
      toast.error("An error occurred while saving configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setConfig(prev => ({
      ...prev,
      mode: prev.mode === 'sandbox' ? 'live' : 'sandbox'
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>PayPal Configuration</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Enter your PayPal credentials for payment processing" 
            : "Your PayPal integration settings for payment processing"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input 
                id="clientId"
                value={config.clientId}
                onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder="Your PayPal Client ID"
              />
              <p className="text-xs text-muted-foreground">
                Find this in your PayPal Developer Dashboard
              </p>
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="mode" className="flex-1">
                Use Production Mode
              </Label>
              <Switch 
                id="mode"
                checked={config.mode === 'live'}
                onCheckedChange={toggleMode}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {config.mode === 'sandbox' 
                ? "Using Sandbox mode for testing" 
                : "Using Production mode for real transactions"}
            </p>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Mode</span>
                <Badge variant={config.mode === 'live' ? "default" : "secondary"}>
                  {config.mode === 'live' ? 'Production' : 'Sandbox (Testing)'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {isLoading ? 'Checking...' : (config.clientId ? 'Configured' : 'Not Configured')}
                </Badge>
              </div>
            </div>
            
            <div className="rounded-md bg-blue-50 p-4 mt-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    PayPal credentials are securely stored using Chrome's encrypted storage.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Save Configuration
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
            {config.clientId ? 'Edit Configuration' : 'Add Configuration'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PayPalConfigForm;
