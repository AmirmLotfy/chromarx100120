
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { localStorageClient as supabase } from "@/lib/local-storage-client";

const PayPalConfigForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [mode, setMode] = useState<"sandbox" | "live">("live");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !clientSecret) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await supabase
        .from('app_configuration')
        .upsert({
          key: 'paypal',
          value: {
            client_id: clientId,
            client_secret: clientSecret,
            mode: mode
          }
        });
        
      if (result.error) {
        throw result.error;
      }
      
      toast.success("PayPal configuration saved successfully");
      setClientId("");
      setClientSecret("");
    } catch (error) {
      console.error("Error saving PayPal configuration:", error);
      toast.error("Failed to save PayPal configuration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>PayPal Configuration</CardTitle>
        <CardDescription>
          Enter your PayPal API credentials to enable payment processing
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">PayPal Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your PayPal Client ID"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientSecret">PayPal Secret Key</Label>
            <Input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter your PayPal Secret Key"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mode">Environment</Label>
            <Select value={mode} onValueChange={(value: "sandbox" | "live") => setMode(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="live">Live (Production)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PayPalConfigForm;
