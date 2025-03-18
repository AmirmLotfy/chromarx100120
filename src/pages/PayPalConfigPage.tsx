
import Layout from "@/components/Layout";
import PayPalConfigForm from "@/components/settings/PayPalConfigForm";

const PayPalConfigPage = () => {
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Extension Information
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            About how ChroMarx works with your browser
          </p>
        </div>
        
        <PayPalConfigForm />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This extension operates completely within your browser's local storage.
            No external payment processing or credentials are required.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default PayPalConfigPage;
