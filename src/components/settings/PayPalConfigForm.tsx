
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCircle } from "lucide-react";

const PayPalConfigForm = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>PayPal Integration</CardTitle>
        <CardDescription>
          Information about payment processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-blue-50 p-4 mt-4">
          <div className="flex">
            <InfoCircle className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                This extension works completely offline and does not require any payment credentials. 
                All features are available without any external payment integration.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          ChroMarx is designed to enhance your browsing experience without requiring any payment information. 
          Your data stays local and secure in your browser.
        </p>
      </CardContent>
    </Card>
  );
};

export default PayPalConfigForm;
