
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
    const { data, error } = await supabase.functions.invoke('get-paypal-config', {
      method: 'GET'
    });

    if (error) {
      throw new Error(`Failed to fetch PayPal config: ${error.message}`);
    }

    return data.clientId;
  } catch (error) {
    console.error('Error fetching PayPal client ID:', error);
    // Fallback to default client ID if fetch fails
    return DEFAULT_CLIENT_ID;
  }
};

export const getPayPalMode = async (): Promise<'sandbox' | 'live'> => {
  try {
    // Try to fetch from Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('get-paypal-config', {
      method: 'GET'
    });

    if (error) {
      throw new Error(`Failed to fetch PayPal config: ${error.message}`);
    }

    return data.mode || DEFAULT_MODE;
  } catch (error) {
    console.error('Error fetching PayPal mode:', error);
    // Fallback to default mode if fetch fails
    return DEFAULT_MODE;
  }
};

// Additional utility functions for PayPal integration
export const createPayPalOrder = async (planId: string, amount: number): Promise<any> => {
  try {
    // Normally, you would make an API call to your backend to create the order
    // But for demonstration, we're creating it directly
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
  try {
    // Normally, you would make an API call to your backend to capture the order
    // But for demonstration, we're capturing it directly
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
