
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

// Default PayPal Client ID as fallback - for development only, should be replaced in production
const DEFAULT_CLIENT_ID = "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";
const DEFAULT_MODE = 'sandbox'; // Changed to sandbox for development

export const getPayPalClientId = async (): Promise<string> => {
  try {
    // Try to fetch from Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('get-paypal-config');
    
    if (error) {
      console.error('Error in getPayPalClientId:', error);
      throw new Error(`Failed to fetch PayPal config: ${error.message}`);
    }

    if (data && data.clientId) {
      return data.clientId;
    }
    
    // In production, we should not fallback to a default client ID
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PayPal client ID not available in production environment');
    }
    
    console.warn('PayPal client_id not found in config, using default (DEVELOPMENT ONLY)');
    return DEFAULT_CLIENT_ID;
  } catch (error) {
    console.error('Error fetching PayPal client ID:', error);
    // Only use fallback in development
    if (process.env.NODE_ENV !== 'production') {
      return DEFAULT_CLIENT_ID;
    }
    throw error;
  }
};

export const getPayPalMode = async (): Promise<'sandbox' | 'live'> => {
  try {
    // Try to fetch from Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('get-paypal-config');
    
    if (error) {
      console.error('Error in getPayPalMode:', error);
      throw new Error(`Failed to fetch PayPal config: ${error.message}`);
    }

    if (data && data.mode && (data.mode === 'sandbox' || data.mode === 'live')) {
      return data.mode;
    }
    
    // In production, default to live but log a warning
    if (process.env.NODE_ENV === 'production') {
      console.warn('PayPal mode not found in config, using live mode for production');
      return 'live';
    }
    
    console.warn('PayPal mode not found in config, using sandbox for development');
    return DEFAULT_MODE;
  } catch (error) {
    console.error('Error fetching PayPal mode:', error);
    // For safety, use sandbox in development, live in production (with warning)
    if (process.env.NODE_ENV === 'production') {
      console.warn('Error determining PayPal mode, using live mode for production');
      return 'live';
    }
    return DEFAULT_MODE;
  }
};

// New function to verify a payment with the server
export const verifyPayment = async (orderId: string, planId: string, userId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-payment', {
      body: { 
        orderId,
        planId,
        userId: userId || 'anonymous'
      }
    });
    
    if (error || !data.success) {
      console.error('Payment verification failed:', error || data.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};

// Enhanced validation with additional checks
export const validatePaymentData = (planId: string, amount: number): boolean => {
  if (!planId || planId.trim() === '') {
    toast.error('Invalid subscription plan selected');
    return false;
  }
  
  if (amount <= 0) {
    toast.error('Invalid payment amount');
    return false;
  }
  
  // Check if the plan exists in our configuration
  const validPlans = ['free', 'basic', 'premium'];
  if (!validPlans.includes(planId)) {
    toast.error('Invalid subscription plan');
    console.error(`Attempt to purchase invalid plan: ${planId}`);
    return false;
  }
  
  // Ensure amount matches expected values
  const expectedAmounts = {
    free: 0,
    basic: 4.99,
    premium: 9.99
  };
  
  // Allow small floating point differences (within 1 cent)
  if (Math.abs(amount - expectedAmounts[planId as keyof typeof expectedAmounts]) > 0.01) {
    toast.error('Invalid payment amount for selected plan');
    console.error(`Amount mismatch for plan ${planId}: expected ${expectedAmounts[planId as keyof typeof expectedAmounts]}, got ${amount}`);
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
  } else if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('UNAUTHORIZED')) {
    toast.error('Payment authorization failed. Please contact support.');
    // Log security-related errors
    console.error('SECURITY WARNING: Payment authorization error', error);
  } else {
    toast.error('Payment processing failed. Please try again or contact support.');
  }
};

// Format currency amounts
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// The following functions are kept for backward compatibility but marked as deprecated
export const createPayPalOrder = async (planId: string, amount: number): Promise<PaymentResult> => {
  console.warn('Deprecated: createPayPalOrder should not be called directly');
  try {
    console.log(`Creating PayPal order for plan: ${planId}, amount: $${amount}`);
    return {
      success: false,
      error: 'Direct order creation is disabled for security reasons'
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
  console.warn('Deprecated: capturePayPalOrder should not be called directly');
  try {
    console.log(`Capturing PayPal order: ${orderId}`);
    return {
      success: false,
      error: 'Direct order capture is disabled for security reasons'
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

// Generate a client token - stub that should be replaced with server implementation
export const generateClientToken = async (): Promise<string | null> => {
  try {
    // This should call your backend to generate a client token
    const { data, error } = await supabase.functions.invoke('get-paypal-client-token');
    
    if (error) {
      console.error('Error generating PayPal client token:', error);
      return null;
    }
    
    return data?.clientToken || null;
  } catch (error) {
    console.error('Error generating PayPal client token:', error);
    return null;
  }
};
