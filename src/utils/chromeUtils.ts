import { toast } from "sonner";

export const getPayPalClientId = async (): Promise<string | null> => {
  try {
    const clientId = await chrome.storage.sync.get('paypalClientId');
    return clientId?.paypalClientId || null;
  } catch (error) {
    console.error('Error getting PayPal client ID:', error);
    toast.error('Failed to load payment configuration');
    return null;
  }
};