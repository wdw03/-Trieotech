export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// Map claim status to dashboard title case tabs
const STATUS_MAP = {
  pending_review: 'Return Requested',
  return_requested: 'Return Requested',
  approved: 'Approved',
  pickup_scheduled: 'Pickup Scheduled',
  returned: 'Returned',
  refund_pending: 'Refund Pending',
  refunded: 'Refunded',
  rejected: 'Rejected',
};

/**
 * GET: Fetch all returns and refund claims for Admin Dashboard
 */
export async function GET() {
  try {
    // 1. Query orders that have return status or returnClaim notes
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*), payments(*), shipments(*)')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const returnClaims = [];

    (orders || []).forEach((order) => {
      let claim = null;
      if (order.notes) {
        try {
          const parsed = JSON.parse(order.notes);
          if (parsed.returnClaim) {
            claim = parsed.returnClaim;
          }
        } catch (_) {}
      }

      const isReturnStatus = ['return_requested', 'return_approved', 'returned', 'refunded'].includes(
        (order.status || '').toLowerCase()
      );

      // Only include orders that have an explicit claim or return status
      if (!claim && !isReturnStatus) return;

      const itemsSummary = (order.order_items || [])
        .map((it) => `${it.product_name || it.name || 'Handcrafted Item'} (x${it.quantity})`)
        .join(', ') || 'Handcrafted Artisan Product';

      const shipment = Array.isArray(order.shipments) && order.shipments.length > 0 ? order.shipments[0] : {};

      const claimStatusKey = (claim?.status || order.status || 'return_requested').toLowerCase();
      const displayStatus = STATUS_MAP[claimStatusKey] || (claim?.status ? claim.status : 'Return Requested');

      const claimId = claim?.ticketId || `RET-${order.order_number || order.id.slice(0, 8)}`;

      const claimTimeline = claim?.history && Array.isArray(claim.history) && claim.history.length > 0
        ? claim.history.map((h, i) => ({
            step: h.step || `Stage ${i + 1}`,
            date: h.timestamp ? new Date(h.timestamp).toLocaleString('en-IN') : new Date().toLocaleDateString(),
            done: true,
            note: h.note || '',
          }))
        : [
            {
              step: 'Claim Submitted by Customer',
              date: claim?.requestedAt ? new Date(claim.requestedAt).toLocaleString('en-IN') : new Date(order.created_at).toLocaleDateString(),
              done: true,
              note: `${claim?.images?.length || 0} proof photos attached`,
            },
            {
              step: 'Admin Review & Photo Inspection',
              date: claim?.status !== 'pending_review' ? new Date(order.updated_at).toLocaleString('en-IN') : 'Awaiting Review',
              done: claim?.status !== 'pending_review',
              note: claim?.adminNotes || 'Verification in progress',
            },
            {
              step: 'Reverse Doorstep Pickup',
              date: ['approved', 'pickup_scheduled', 'returned', 'refunded'].includes(claimStatusKey) ? 'Approved' : 'Pending Approval',
              done: ['pickup_scheduled', 'returned', 'refunded'].includes(claimStatusKey),
              note: '',
            },
            {
              step: 'Refund Issued / Replacement Sent',
              date: claimStatusKey === 'refunded' ? 'Completed' : 'Pending',
              done: claimStatusKey === 'refunded',
              note: '',
            },
          ];

      returnClaims.push({
        id: claimId,
        ticketId: claimId,
        dbOrderId: order.id,
        orderId: order.order_number || order.id,
        customer: order.shipping_address?.name || 'Artisan Customer',
        email: order.shipping_address?.email || '',
        phone: order.shipping_address?.phone || '',
        productName: itemsSummary,
        reason: claim?.reason || 'Damaged product / Defect in shipment',
        reasonDetails: claim?.description || 'Customer reported defective or damaged condition upon delivery.',
        images: Array.isArray(claim?.images) ? claim.images : [],
        amount: Number(claim?.refundAmount || order.total || 0),
        resolution: claim?.resolution || 'refund',
        pickupCourier: shipment.courier_name || 'BlueDart / Delhivery Surface',
        trackingNumber: shipment.awb_number || 'Awaiting Reverse AWB',
        status: displayStatus,
        rawStatus: claimStatusKey,
        adminNotes: claim?.adminNotes || '',
        date: claim?.requestedAt ? claim.requestedAt.split('T')[0] : order.created_at ? order.created_at.split('T')[0] : '2026-09-08',
        timeline: claimTimeline,
        items: order.order_items || [],
        paymentMethod: order.payment_method || 'Prepaid',
      });
    });

    return NextResponse.json({
      success: true,
      returns: returnClaims,
      count: returnClaims.length,
    });
  } catch (err) {
    console.error('Fetch returns error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch returns' }, { status: 500 });
  }
}
