
import Layout from "@/components/Layout";
import PayPalConfigForm from "@/components/settings/PayPalConfigForm";

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
        </div>
        
        <PayPalConfigForm />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This configuration will be securely stored in your local browser storage
            and used for processing payments in your application.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PayPalConfigPage;
