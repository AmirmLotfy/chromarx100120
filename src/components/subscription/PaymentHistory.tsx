
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { FileText, Download, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Payment {
  id: string;
  orderId: string;
  planId: string;
  amount: number;
  status: string;
  provider: string;
  autoRenew: boolean;
  createdAt: string;
  type?: string;
  billingCycle?: 'monthly' | 'yearly';
}

const PaymentHistory = () => {
  const { getPaymentHistory, getInvoiceUrl } = useSubscription();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const history = await getPaymentHistory();
        setPayments(history);
      } catch (error) {
        console.error("Error fetching payment history:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [getPaymentHistory]);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return "bg-green-50 text-green-700 hover:bg-green-50 border-green-200";
      case 'pending':
        return "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200";
      case 'failed':
        return "bg-red-50 text-red-700 hover:bg-red-50 border-red-200";
      case 'refunded':
        return "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200";
    }
  };
  
  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'renewal':
        return "Auto-renewal";
      case 'upgrade':
        return "Plan upgrade";
      case 'downgrade':
        return "Plan downgrade";
      case 'billing_change':
        return "Billing cycle change";
      default:
        return "New subscription";
    }
  };
  
  const downloadInvoice = (paymentId: string) => {
    // In a real implementation, this would download the PDF invoice
    // For now, just log to console
    console.log(`Downloading invoice for payment ${paymentId}`);
    const invoiceUrl = getInvoiceUrl(paymentId);
    window.open(invoiceUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>
          View your payment history and download invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Payments</TabsTrigger>
            <TabsTrigger value="renewals">Renewals</TabsTrigger>
            <TabsTrigger value="upgrades">Plan Changes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderPaymentTable(payments)}
          </TabsContent>
          
          <TabsContent value="renewals">
            {renderPaymentTable(payments.filter(p => p.type === 'renewal'))}
          </TabsContent>
          
          <TabsContent value="upgrades">
            {renderPaymentTable(payments.filter(p => ['upgrade', 'downgrade', 'billing_change'].includes(p.type || '')))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
  
  function renderPaymentTable(filteredPayments: Payment[]) {
    if (loading) {
      return <div className="text-center py-8">Loading payment history...</div>;
    }
    
    if (filteredPayments.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No payment records found.
        </div>
      );
    }
    
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(payment.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {getTypeLabel(payment.type)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payment.planId === 'pro' ? 'Pro Plan' : 'Free Plan'} 
                      {payment.billingCycle && ` (${payment.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`}
                    </div>
                  </div>
                </TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => downloadInvoice(payment.id)}
                    disabled={payment.status !== 'completed'}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    <span className="sr-only md:not-sr-only md:inline-block">Download</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
};

export default PaymentHistory;
