
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { configurationService } from "@/services/configurationService";

const PayPalConfigForm = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<{ clientId: string; mode: 'sandbox' | 'live' }>({
    clientId: '',
    mode: 'sandbox'
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const paypalConfig = await configurationService.getPayPalConfig();
        // Type assertion to ensure we have the correct type
        setConfig({
          clientId: typeof paypalConfig.clientId === 'string' ? paypalConfig.clientId : '',
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>PayPal Configuration</CardTitle>
        <CardDescription>
          Your PayPal integration is ready to use for payment processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
              {isLoading ? 'Checking...' : 'Configured'}
            </Badge>
          </div>
        </div>
        
        <div className="rounded-md bg-blue-50 p-4 mt-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                PayPal integration is managed by the extension. No additional configuration is needed.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Payments are processed securely through PayPal's API.
        </p>
      </CardFooter>
    </Card>
  );
};

export default PayPalConfigForm;
