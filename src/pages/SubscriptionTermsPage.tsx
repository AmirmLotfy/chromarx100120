
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Receipt, ShieldCheck } from "lucide-react";

const SubscriptionTermsPage = () => {
  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/subscription" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Subscription
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold tracking-tight mb-3">
            Subscription Terms & Conditions
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Please review our subscription terms carefully before subscribing to ChroMarx premium plans.
          </p>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Billing Terms
              </CardTitle>
              <CardDescription>
                Pricing and payment details for ChroMarx subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Pricing Structure</h3>
                <p className="text-sm text-muted-foreground">
                  ChroMarx offers different subscription plans with the following pricing:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Free Plan: $0/month</li>
                  <li>Pro Plan: $4.99/month or $49.99/year (save 20%)</li>
                  <li>Premium Plan: $9.99/month or $99.99/year (save 20%)</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Billing Cycle</h3>
                <p className="text-sm text-muted-foreground">
                  For monthly subscriptions, you will be billed every month on the date of your initial subscription. 
                  For yearly subscriptions, you will be billed every year on the date of your initial subscription.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Payment Processing</h3>
                <p className="text-sm text-muted-foreground">
                  All payments are processed securely through PayPal. We do not store your full credit card details.
                  By subscribing, you authorize ChroMarx to charge your chosen payment method on a recurring basis.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Subscription Management
              </CardTitle>
              <CardDescription>
                How to manage or cancel your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Cancellation Policy</h3>
                <p className="text-sm text-muted-foreground">
                  You may cancel your subscription at any time from the Subscription page. 
                  When you cancel, you will continue to have access to premium features until the end of your current billing period.
                  No refunds will be issued for partial subscription periods.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Automatic Renewal</h3>
                <p className="text-sm text-muted-foreground">
                  Subscriptions automatically renew unless auto-renewal is turned off at least 24 hours before the end of the current period.
                  You can manage auto-renewal from your Subscription page.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Plan Changes</h3>
                <p className="text-sm text-muted-foreground">
                  If you upgrade to a higher plan, the change will take effect immediately and you will be charged the prorated difference.
                  If you downgrade, the change will take effect at the end of your current billing period.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Refund Policy
              </CardTitle>
              <CardDescription>
                Terms for requesting and receiving refunds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  ChroMarx offers a 7-day refund policy for new subscriptions. If you are not satisfied with your subscription within the first 7 days, you may request a full refund by contacting our support team at support@chromarx.it.com.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  After the initial 7-day period, we generally do not offer refunds for the following reasons:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Cancellations after the refund period</li>
                  <li>Dissatisfaction with the service after the refund period</li>
                  <li>Misuse of the service</li>
                  <li>Accidental purchases (unless reported within 24 hours)</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">How to Request a Refund</h3>
                <p className="text-sm text-muted-foreground">
                  To request a refund, please email support@chromarx.it.com with the subject line "Refund Request" and include your account email and the date of purchase.
                  Our team will review your request and respond within 2 business days.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center">
          <Button asChild>
            <Link to="/subscription">Return to Subscription Page</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionTermsPage;
