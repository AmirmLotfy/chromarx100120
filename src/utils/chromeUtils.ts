
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
    // Try to fetch from Supabase directly
    const { data, error } = await supabase
      .from('app_configuration')
      .select('value')
      .eq('key', 'paypal')
      .single();

    if (error) {
      throw new Error(`Failed to fetch PayPal config: ${error.message}`);
    }

    // Check if data.value is an object with a client_id property
    if (data && data.value && typeof data.value === 'object' && 'client_id' in data.value) {
      return data.value.client_id as string;
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
    // Try to fetch from Supabase directly
    const { data, error } = await supabase
      .from('app_configuration')
      .select('value')
      .eq('key', 'paypal')
      .single();

    if (error) {
      throw new Error(`Failed to fetch PayPal config: ${error.message}`);
    }

    // Check if data.value is an object with a mode property
    if (data && data.value && typeof data.value === 'object' && 'mode' in data.value) {
      const mode = data.value.mode as string;
      return (mode === 'sandbox' || mode === 'live') ? mode : DEFAULT_MODE;
    }
    
    console.warn('PayPal mode not found in config, using default');
    return DEFAULT_MODE;
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
