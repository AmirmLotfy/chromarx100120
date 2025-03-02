
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// PayPal configuration types
interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
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

// Verify and process payment using Supabase Edge Function
export const verifyPayPalPayment = async (orderId: string, planId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-payment', {
      body: {
        orderId,
        planId
      }
    });

    if (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment verification failed');
      return false;
    }

    if (!data.success) {
      console.error('Payment processing failed:', data.error);
      toast.error(data.error || 'Payment processing failed');
      return false;
    }

    console.log('Payment processed successfully:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error verifying payment:', error);
    toast.error('Payment verification failed');
    return false;
  }
};

// These functions are deprecated and will be removed in future versions
// Use verifyPayPalPayment() instead
export const createPayPalOrder = async (planId: string, amount: number): Promise<any> => {
  console.warn('Direct order creation is deprecated. Use the PayPal SDK instead.');
  try {
    return {
      id: `TEST-${Date.now()}`,
      status: "CREATED",
      amount: amount
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    toast.error('Failed to create order');
    throw error;
  }
};

export const capturePayPalOrder = async (orderId: string): Promise<any> => {
  console.warn('Direct order capture is deprecated. Use verifyPayPalPayment() instead.');
  try {
    return {
      id: orderId,
      status: "COMPLETED",
      payer: {
        email_address: "test@example.com"
      }
    };
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    toast.error('Failed to process payment');
    throw error;
  }
};
