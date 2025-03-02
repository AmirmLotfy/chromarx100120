
import { toast } from "sonner";
import { storage } from "@/lib/chrome-utils";

// PayPal configuration
interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

// Sandbox client ID - for development only
const SANDBOX_CLIENT_ID = "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";

// Default to sandbox mode for development, but allow overriding via storage
export const getPayPalClientId = async (): Promise<string | null> => {
  try {
    // Try to get the PayPal config from storage first
    const paypalConfig = await storage.get<PayPalConfig>('paypal_config');
    
    if (paypalConfig && paypalConfig.clientId) {
      console.log(`Using ${paypalConfig.mode} PayPal Client ID from storage`);
      return paypalConfig.clientId;
    }
    
    // Fall back to sandbox client ID if no config in storage
    console.log("Using default sandbox PayPal Client ID");
    return SANDBOX_CLIENT_ID;
  } catch (error) {
    console.error('Error getting PayPal client ID:', error);
    toast.error('Failed to load payment configuration');
    return null;
  }
};

// Function to save PayPal configuration to storage
export const setPayPalConfig = async (clientId: string, mode: 'sandbox' | 'live'): Promise<boolean> => {
  try {
    await storage.set('paypal_config', { clientId, mode });
    console.log(`PayPal config saved with mode: ${mode}`);
    return true;
  } catch (error) {
    console.error('Error saving PayPal config:', error);
    toast.error('Failed to save PayPal configuration');
    return false;
  }
};

// Get the current PayPal mode
export const getPayPalMode = async (): Promise<'sandbox' | 'live'> => {
  try {
    const paypalConfig = await storage.get<PayPalConfig>('paypal_config');
    return paypalConfig?.mode || 'sandbox';
  } catch (error) {
    console.error('Error getting PayPal mode:', error);
    return 'sandbox';
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
