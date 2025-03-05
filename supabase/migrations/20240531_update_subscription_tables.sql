
-- Add PayPal subscription ID to subscriptions table
ALTER TABLE IF EXISTS public.subscriptions 
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;

-- Add PayPal subscription ID to payment_history table
ALTER TABLE IF EXISTS public.payment_history 
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;

-- Create webhook_events table to track processed webhook events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'processed',
  raw_data JSONB
);

-- Allow webhook events to be processed by the service role
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage webhook_events" ON public.webhook_events
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger for webhook_events
CREATE TRIGGER set_webhook_events_updated_at
BEFORE UPDATE ON public.webhook_events
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create a table for storing PayPal webhook configuration
CREATE TABLE IF NOT EXISTS public.paypal_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Allow webhooks to be managed by the service role
ALTER TABLE public.paypal_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage paypal_webhooks" ON public.paypal_webhooks
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger for paypal_webhooks
CREATE TRIGGER set_paypal_webhooks_updated_at
BEFORE UPDATE ON public.paypal_webhooks
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
