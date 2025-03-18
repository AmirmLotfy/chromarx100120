
export interface PaymentHistory {
  id: string;
  user_id: string;
  order_id: string;
  plan_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionDetails {
  id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'canceled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface PayPalConfig {
  configured: boolean;
  clientId: string;
  mode: 'sandbox' | 'production';
}
