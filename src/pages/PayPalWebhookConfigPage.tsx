
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Info, Copy, Link, Check, AlertTriangle } from "lucide-react";
import { checkPayPalConfiguration } from "@/utils/chromeUtils";

const PayPalWebhookConfigPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookId, setWebhookId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [paypalConfigured, setPaypalConfigured] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Check if PayPal is configured
        const config = await checkPayPalConfiguration();
        setPaypalConfigured(config.configured);
        
        // Get webhook configuration
        const { data } = await supabase
          .from('paypal_webhooks')
          .select('*')
          .eq('active', true)
          .maybeSingle();
          
        if (data) {
          setWebhookId(data.webhook_id);
          setIsConfigured(true);
        }
        
        // Generate webhook URL based on current environment
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'hkpgkogqxnamvlptxhat';
        const webhookEndpoint = `https://${projectId}.supabase.co/functions/v1/paypal-webhook`;
        setWebhookUrl(webhookEndpoint);
      } catch (error) {
        console.error('Error loading webhook config:', error);
      }
    };
    
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookId) {
      toast.error("Please enter your PayPal Webhook ID");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First check if we already have a configuration
      const { data: existingData } = await supabase
        .from('paypal_webhooks')
        .select('*')
        .eq('active', true)
        .maybeSingle();
        
      if (existingData) {
        // Update existing configuration
        const { error } = await supabase
          .from('paypal_webhooks')
          .update({
            webhook_id: webhookId
          })
          .eq('id', existingData.id);
          
        if (error) throw error;
      } else {
        // Create new configuration
        const { error } = await supabase
          .from('paypal_webhooks')
          .insert({
            webhook_id: webhookId,
            url: webhookUrl,
            event_types: [
              'PAYMENT.SALE.COMPLETED',
              'BILLING.SUBSCRIPTION.CREATED',
              'BILLING.SUBSCRIPTION.CANCELLED',
              'BILLING.SUBSCRIPTION.EXPIRED'
            ]
          });
          
        if (error) throw error;
      }
      
      // Also store the webhook ID in the secrets for edge functions
      const { error: secretError } = await supabase.functions.invoke('update-secret', {
        body: {
          name: 'PAYPAL_WEBHOOK_ID',
          value: webhookId
        }
      });
      
      if (secretError) {
        console.error('Error updating secret:', secretError);
        toast.warning("Webhook ID saved, but couldn't update the secret. Please set it manually.");
      }
      
      toast.success("PayPal webhook configuration saved successfully");
      setIsConfigured(true);
    } catch (error) {
      console.error("Error saving PayPal webhook configuration:", error);
      toast.error("Failed to save PayPal webhook configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            PayPal Webhook Configuration
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Configure PayPal webhooks to enable automatic subscription renewal processing
          </p>
        </div>
        
        {!paypalConfigured && (
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>PayPal not configured</AlertTitle>
            <AlertDescription>
              You need to configure PayPal credentials before setting up webhooks.
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <a href="/paypal-config">Configure PayPal</a>
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="w-full max-w-md mx-auto mb-8">
          <CardHeader>
            <CardTitle>PayPal Webhook URL</CardTitle>
            <CardDescription>
              Create a webhook in PayPal Developer Dashboard and point it to this URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-3 rounded-md flex items-center justify-between">
              <code className="text-sm break-all">{webhookUrl}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyWebhookUrl}
                className="flex-shrink-0 ml-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                In the PayPal Developer Dashboard, create a webhook with this URL and subscribe to
                the following event types: PAYMENT.SALE.COMPLETED, BILLING.SUBSCRIPTION.CREATED,
                BILLING.SUBSCRIPTION.CANCELLED, BILLING.SUBSCRIPTION.EXPIRED
              </p>
            </div>
          </CardFooter>
        </Card>
        
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{isConfigured ? "Update Webhook ID" : "Configure Webhook"}</CardTitle>
            <CardDescription>
              Enter the Webhook ID provided by PayPal after creating your webhook
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookId">PayPal Webhook ID</Label>
                <Input
                  id="webhookId"
                  value={webhookId}
                  onChange={(e) => setWebhookId(e.target.value)}
                  placeholder="Enter your PayPal Webhook ID"
                  required
                />
              </div>
              
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Link className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  You can find your Webhook ID in the PayPal Developer Dashboard under "Webhooks"
                  after creating a webhook for your application.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !paypalConfigured}
              >
                {isLoading ? "Saving..." : isConfigured ? "Update Configuration" : "Save Configuration"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            PayPal webhooks are essential for processing automatic subscription renewals.
            Make sure to configure them correctly for uninterrupted service.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PayPalWebhookConfigPage;
