
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Info } from "lucide-react";

const PayPalConfigForm = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>PayPal Integration</CardTitle>
        <CardDescription>
          Payment processing information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>PayPal Configured</AlertTitle>
          <AlertDescription>
            Your extension includes a pre-configured PayPal integration. All payment features are ready to use without any additional setup.
          </AlertDescription>
        </Alert>

        <div className="rounded-md bg-blue-50 p-4 mt-4">
          <div className="flex">
            <Info className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Users can make payments using credit or debit cards without creating a PayPal account.
                All transactions are securely processed through our verified payment gateway.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          ChroMarx uses PayPal's Card Processing API which allows customers to pay with major credit and debit cards without requiring a PayPal account.
        </p>
      </CardContent>
    </Card>
  );
};

export default PayPalConfigForm;
