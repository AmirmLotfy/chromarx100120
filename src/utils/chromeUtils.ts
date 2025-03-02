
import { toast } from "sonner";
import { storage } from "@/lib/chrome-utils";

// PayPal configuration
interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

// Default PayPal Client ID - should be replaced with your live Client ID
const DEFAULT_CLIENT_ID = "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";
const DEFAULT_MODE = 'live'; // Default to live mode

export const getPayPalClientId = async (): Promise<string> => {
  // For production, always return the pre-configured client ID
  return DEFAULT_CLIENT_ID;
};

export const getPayPalMode = async (): Promise<'sandbox' | 'live'> => {
  // For production, always return the pre-configured mode
  return DEFAULT_MODE;
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
