
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PayPalConfigForm from "@/components/settings/PayPalConfigForm";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

const PayPalConfigPage = () => {
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            PayPal Configuration
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Configure your PayPal integration for payment processing
          </p>
          
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/paypal-webhook" className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                Configure Webhooks
              </Link>
            </Button>
          </div>
        </div>
        
        <PayPalConfigForm />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This configuration will be securely stored in your Supabase database
            and used for processing payments in your application.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PayPalConfigPage;
