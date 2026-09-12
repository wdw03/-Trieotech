-- ══════════════════════════════════════════════════════════════
-- MIGRATION: SHIPMENTS & ORDERS EXPANSION V2
-- Supports full Shiprocket lifecycle, NDR, RTO, tracking events,
-- and financial field separation
-- ══════════════════════════════════════════════════════════════

-- 1. Expand status CHECK constraint on public.shipments
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_status_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_status_check 
  CHECK (status IN (
    'pending', 'pickup_scheduled', 'picked_up', 'in_transit',
    'out_for_delivery', 'delivered', 'rto_initiated', 'rto_delivered',
    'cancelled', 'lost',
    -- Expanded lifecycle statuses:
    'shipped', 'ndr', 'failed_delivery', 'reattempt_scheduled',
    'return_initiated', 'return_received', 'disposed'
  ));

-- 2. Add new columns to public.shipments
ALTER TABLE public.shipments 
  ADD COLUMN IF NOT EXISTS courier_freight_cost NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rto_cost NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_collectable NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS routing_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ndr_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ndr_action TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS manifest_url TEXT DEFAULT '';

-- 3. Create shipment_events table (audit / tracking log)
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_code TEXT DEFAULT '',
  activity TEXT DEFAULT '',
  location TEXT DEFAULT '',
  shiprocket_status_id TEXT DEFAULT '',
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment ON public.shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_events_time ON public.shipment_events(event_time DESC);

-- Enable RLS on shipment_events
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists, then recreate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shipment_events' AND policyname = 'Users can view own shipment events'
  ) THEN
    CREATE POLICY "Users can view own shipment events" ON public.shipment_events
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.shipments s
          JOIN public.orders o ON o.id = s.order_id
          WHERE s.id = shipment_events.shipment_id
          AND o.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 4. Add HSN, SKU, tax_rate, discount_amount to order_items
ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS hsn TEXT DEFAULT '6304',
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- 5. Add platform_fee, payment_status, refund_amount, refund_id to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_id TEXT DEFAULT '';

-- Set payment_status to 'paid' for existing confirmed/delivered/processing/packed/shipped orders
UPDATE public.orders 
SET payment_status = 'paid' 
WHERE payment_status = 'pending' 
  AND status IN ('confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered')
  AND payment_method != 'cod';
