
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Receipt, CalendarDays, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentRecord {
  id: string;
  created_at: string;
  order_id: string;
  plan_id: string;
  amount: number;
  status: string;
  provider: string;
}

interface PaymentHistoryData {
  payments: PaymentRecord[];
}

const SubscriptionHistoryPage = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        if (!user?.id) return;
        
        setIsLoading(true);
        
        // Temporarily use app_configuration to store/retrieve payment data
        const { data, error } = await supabase
          .from('app_configuration')
          .select('*')
          .eq('key', `payment_history_${user.id}`)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching payment history:', error);
          toast.error('Failed to load payment history');
          return;
        }
        
        // If we have payment history data, set it
        if (data && data.value) {
          // Fixed type casting
          const paymentData = data.value as unknown as PaymentHistoryData;
          if (paymentData.payments && Array.isArray(paymentData.payments)) {
            setPayments(paymentData.payments);
          } else {
            setPayments([]);
          }
        } else {
          setPayments([]);
        }
      } catch (error) {
        console.error('Error in payment history fetch:', error);
        toast.error('Failed to load payment history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPaymentHistory();
  }, [user?.id]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format plan name for display
  const formatPlanName = (planId: string) => {
    switch (planId) {
      case 'basic':
        return 'Pro Plan';
      case 'premium':
        return 'Premium Plan';
      case 'free':
        return 'Free Plan';
      default:
        return planId;
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to="/subscription" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Subscription
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">
                Payment History
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                View your subscription payment history and transaction details
              </p>
            </div>
            
            <Button asChild variant="outline">
              <Link to="/subscription/terms" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Subscription Terms
              </Link>
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-24 mt-1" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-12 rounded-md" />
                    <Skeleton className="h-12 rounded-md" />
                    <Skeleton className="h-12 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No payment history found</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                You haven't made any subscription payments yet. Visit the subscription page to upgrade your plan.
              </p>
              <Button asChild>
                <Link to="/subscription">View Subscription Plans</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {payments.map((payment) => (
              <Card key={payment.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {formatPlanName(payment.plan_id)}
                    </CardTitle>
                    <Badge variant={payment.status === 'completed' ? 'success' : (payment.status === 'pending' ? 'outline' : 'destructive')}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription>
                    Transaction #{payment.order_id.slice(0, 8)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="flex items-center text-muted-foreground text-sm mb-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                        Date
                      </div>
                      <div className="font-medium">
                        {formatDate(payment.created_at)}
                      </div>
                    </div>
                    
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="flex items-center text-muted-foreground text-sm mb-1">
                        <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                        Payment Method
                      </div>
                      <div className="font-medium capitalize">
                        {payment.provider}
                      </div>
                    </div>
                    
                    <div className="rounded-lg bg-muted/40 p-3">
                      <div className="flex items-center text-muted-foreground text-sm mb-1">
                        <Receipt className="h-3.5 w-3.5 mr-1.5" />
                        Amount
                      </div>
                      <div className="font-medium">
                        ${payment.amount.toFixed(2)} USD
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="mt-8 bg-muted/40 rounded-lg p-6">
          <h3 className="font-medium mb-2">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about your subscription or payments, please contact our support team at support@chromarx.it.com.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/subscription/terms">View Terms</Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <a href="mailto:support@chromarx.it.com">Contact Support</a>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionHistoryPage;
