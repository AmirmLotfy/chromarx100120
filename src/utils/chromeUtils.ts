
import { toast } from "sonner";

export const getPayPalClientId = async (): Promise<string | null> => {
  try {
    // This is our sandbox PayPal client ID
    return "AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R";
  } catch (error) {
    console.error('Error getting PayPal client ID:', error);
    toast.error('Failed to load payment configuration');
    return null;
  }
};
