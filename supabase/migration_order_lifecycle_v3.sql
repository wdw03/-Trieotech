-- ══════════════════════════════════════════════════════════════
-- MIGRATION V3: PRODUCTION ORDER LIFECYCLE, AUDIT TRAIL,
-- IDEMPOTENT WEBHOOKS & REALTIME BROADCAST
-- ══════════════════════════════════════════════════════════════

-- 1. Expand status CHECK constraint on public.orders to support full lifecycle
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending_payment',
    'pending',
    'confirmed',
    'processing',
    'packed',
    'pickup_scheduled',
    'picked_up',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'failed_delivery',
    'rto_initiated',
    'rto_delivered',
    'return_requested',
    'return_approved',
    'returned',
    'refunded',
    'payment_failed'
  ));

-- 2. Create order_status_history table (Audit trail for transitions)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT DEFAULT 'system',
  source TEXT NOT NULL, -- 'customer', 'admin', 'shiprocket_webhook', 'system'
  reason TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON public.order_status_history(created_at DESC);

-- Enable RLS on order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'order_status_history' AND policyname = 'Users can view own order history'
  ) THEN
    CREATE POLICY "Users can view own order history" ON public.order_status_history
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = order_status_history.order_id
          AND o.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 3. Create webhook_logs table (Idempotency and duplicate prevention)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL DEFAULT 'shiprocket',
  event_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON public.webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON public.webhook_logs(processed_at DESC);

-- 4. Enable Supabase Realtime publication on orders, shipments, and order_status_history
DO $$
BEGIN
  -- Add public.orders to supabase_realtime if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  -- Add public.shipments to supabase_realtime if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shipments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
  END IF;

  -- Add public.order_status_history to supabase_realtime if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_status_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
  END IF;
END $$;

-- Set REPLICA IDENTITY FULL so updates broadcast complete row data
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.shipments REPLICA IDENTITY FULL;
ALTER TABLE public.order_status_history REPLICA IDENTITY FULL;
