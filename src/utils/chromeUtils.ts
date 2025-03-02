
import { toast } from "sonner";

export const getPayPalClientId = async (): Promise<string | null> => {
  try {
    // This is our sandbox PayPal client ID
    // In production, you'd fetch this from your server or extension storage
    // For now use the client ID from the Chrome extension storage or default to sandbox
    const clientId = "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";
    
    // Log for debugging purposes
    console.log("Using PayPal Client ID:", clientId);
    
    return clientId;
  } catch (error) {
    console.error('Error getting PayPal client ID:', error);
    toast.error('Failed to load payment configuration');
    return null;
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
