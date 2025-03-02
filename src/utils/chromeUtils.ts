
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// PayPal configuration types
interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

// Payment processing types
export interface PaymentResult {
  success: boolean;
  orderId?: string;
  error?: string;
  payerId?: string;
  details?: any;
}

// Default PayPal Client ID as fallback
const DEFAULT_CLIENT_ID = "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";
const DEFAULT_MODE = 'live';

export const getPayPalClientId = async (): Promise<string> => {
  try {
    // Try to fetch from Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('get-paypal-config');
    
    if (error) {
      throw new Error(`Failed to fetch PayPal config: ${error.message}`);
    }

    if (data && data.clientId) {
      return data.clientId;
    }
    
    console.warn('PayPal client_id not found in config, using default');
    return DEFAULT_CLIENT_ID;
  } catch (error) {
    console.error('Error fetching PayPal client ID:', error);
    // Fallback to default client ID if fetch fails
    return DEFAULT_CLIENT_ID;
  }
};

export const getPayPalMode = async (): Promise<'sandbox' | 'live'> => {
  try {
    // Try to fetch from Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('get-paypal-config');
    
    if (error) {
      throw new Error(`Failed to fetch PayPal config: ${error.message}`);
    }

    if (data && data.mode && (data.mode === 'sandbox' || data.mode === 'live')) {
      return data.mode;
    }
    
    console.warn('PayPal mode not found in config, using default');
    return DEFAULT_MODE;
  } catch (error) {
    console.error('Error fetching PayPal mode:', error);
    // Fallback to default mode if fetch fails
    return DEFAULT_MODE;
  }
};

// Enhanced utility functions for PayPal integration
export const createPayPalOrder = async (planId: string, amount: number): Promise<PaymentResult> => {
  try {
    console.log(`Creating PayPal order for plan: ${planId}, amount: $${amount}`);
    // Here we would typically make an API call to your backend to create the order
    // For now, returning a demo response
    return {
      success: true,
      orderId: `ORDER-${Date.now()}`,
      details: {
        id: `ORDER-${Date.now()}`,
        status: "CREATED",
        amount: amount,
        planId: planId,
        created: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    toast.error('Failed to create payment order. Please try again.');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating order'
    };
  }
};

export const capturePayPalOrder = async (orderId: string): Promise<PaymentResult> => {
  try {
    console.log(`Capturing PayPal order: ${orderId}`);
    // Here we would typically make an API call to your backend to capture the order
    // For now, returning a demo response
    return {
      success: true,
      orderId,
      payerId: `PAYER-${Date.now()}`,
      details: {
        id: orderId,
        status: "COMPLETED",
        update_time: new Date().toISOString(),
        payer: {
          email_address: "customer@example.com",
          payer_id: `PAYER-${Date.now()}`
        }
      }
    };
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    toast.error('Payment processing failed. Please try again or contact support.');
    return {
      success: false,
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error processing payment'
    };
  }
};

// New function to validate payment data
export const validatePaymentData = (planId: string, amount: number): boolean => {
  if (!planId || planId.trim() === '') {
    toast.error('Invalid subscription plan selected');
    return false;
  }
  
  if (amount <= 0) {
    toast.error('Invalid payment amount');
    return false;
  }
  
  return true;
};

// New function to handle payment errors with more user-friendly messages
export const handlePaymentError = (error: any): void => {
  console.error('Payment processing error:', error);
  
  // Extract error message or code for more specific error handling
  const errorMessage = error?.message || 'Unknown error';
  
  if (errorMessage.includes('INSTRUMENT_DECLINED')) {
    toast.error('Your payment method was declined. Please try another payment method.');
  } else if (errorMessage.includes('PAYER_ACTION_REQUIRED')) {
    toast.error('Additional actions required. Please complete all steps in the PayPal window.');
  } else if (errorMessage.includes('ORDER_ALREADY_CAPTURED')) {
    toast.info('This payment has already been processed. No further action is needed.');
  } else if (errorMessage.includes('INTERNAL_SERVER_ERROR')) {
    toast.error('Payment service is temporarily unavailable. Please try again later.');
  } else {
    toast.error('Payment processing failed. Please try again or contact support.');
  }
};

// New function to format currency amounts
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};
