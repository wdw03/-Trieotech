export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { createRefund } from '../../../../../lib/razorpay';

/**
 * PATCH: Admin approves, rejects, or processes refund for a return claim
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, status: requestedStatus, adminNotes = '', refundAmount } = body;

    const targetAction = action || (requestedStatus ? requestedStatus.toLowerCase() : 'approve');

    // 1. Locate the order by ID, order_number, or ticketId in notes
    let order = null;

    // Check by DB UUID or order_number
    const { data: byId } = await supabaseAdmin
      .from('orders')
      .select('*, payments(*)')
      .eq('id', id)
      .maybeSingle();

    if (byId) {
      order = byId;
    } else {
      const { data: byNum } = await supabaseAdmin
        .from('orders')
        .select('*, payments(*)')
        .eq('order_number', id)
        .maybeSingle();

      if (byNum) {
        order = byNum;
      }
    }

    // If still not found, search in all orders for matching ticketId in notes
    if (!order) {
      const { data: allOrders } = await supabaseAdmin
        .from('orders')
        .select('*, payments(*)')
        .order('updated_at', { ascending: false });

      order = (allOrders || []).find((o) => {
        if (!o.notes) return false;
        try {
          const parsed = JSON.parse(o.notes);
          return (
            parsed.returnClaim?.ticketId === id ||
            `RET-${o.order_number}` === id ||
            `RET-${o.id}` === id
          );
        } catch {
          return false;
        }
      });
    }

    if (!order) {
      return NextResponse.json({ error: 'Return claim / Order not found' }, { status: 404 });
    }

    // 2. Parse existing notes & returnClaim
    let notesObj = {};
    if (order.notes) {
      try {
        notesObj = JSON.parse(order.notes);
      } catch {
        notesObj = { legacyNotes: order.notes };
      }
    }

    const claim = notesObj.returnClaim || {
      ticketId: `TKT-RET-${order.order_number || order.id.slice(0, 8)}`,
      status: 'pending_review',
      reason: 'Return Claim',
      description: 'Customer return claim',
      images: [],
      resolution: 'refund',
      refundAmount: Number(order.total || 0),
      requestedAt: new Date().toISOString(),
      history: [],
    };

    const nowIso = new Date().toISOString();
    let newOrderStatus = order.status;
    let newPaymentStatus = order.payment_status;
    let refundResult = null;

    if (targetAction === 'approve' || targetAction === 'approved') {
      claim.status = 'approved';
      claim.adminNotes = adminNotes || 'Return request verified and approved by admin. Reverse pickup authorized.';
      claim.history = claim.history || [];
      claim.history.push({
        step: 'Claim Approved by Admin',
        timestamp: nowIso,
        note: claim.adminNotes,
      });
      newOrderStatus = 'return_approved';
    } else if (targetAction === 'reject' || targetAction === 'rejected') {
      claim.status = 'rejected';
      claim.adminNotes = adminNotes || 'Return claim was reviewed and rejected. Does not meet replacement policy.';
      claim.history = claim.history || [];
      claim.history.push({
        step: 'Claim Rejected by Admin',
        timestamp: nowIso,
        note: claim.adminNotes,
      });
      // Revert order status to delivered
      newOrderStatus = 'delivered';
    } else if (targetAction === 'refund' || targetAction === 'refunded') {
      claim.status = 'refunded';
      claim.adminNotes = adminNotes || 'Refund successfully issued to customer.';
      claim.history = claim.history || [];
      claim.history.push({
        step: 'Refund Completed',
        timestamp: nowIso,
        note: claim.adminNotes,
      });
      newOrderStatus = 'refunded';
      newPaymentStatus = 'refunded';

      // If Razorpay prepaid payment exists, trigger online refund
      const paymentRecord = Array.isArray(order.payments) && order.payments.length > 0
        ? order.payments.find((p) => p.status === 'captured' || p.status === 'completed' || p.razorpay_payment_id)
        : null;

      const paymentId = paymentRecord?.razorpay_payment_id || order.razorpay_payment_id;
      const amountToRefund = refundAmount || claim.refundAmount || order.total || 0;

      if (paymentId && paymentId.startsWith('pay_')) {
        try {
          refundResult = await createRefund(paymentId, amountToRefund, {
            order_id: order.id,
            reason: claim.reason || 'Customer return',
          });
          console.log(`Razorpay refund issued for payment ${paymentId}:`, refundResult?.id);
        } catch (rfErr) {
          console.warn('Razorpay automated refund skipped/failed:', rfErr.message);
        }
      }
    } else if (targetAction === 'pickup_scheduled') {
      claim.status = 'pickup_scheduled';
      claim.history = claim.history || [];
      claim.history.push({
        step: 'Reverse Courier Pickup Scheduled',
        timestamp: nowIso,
        note: adminNotes || 'Courier assigned for doorstep return',
      });
      newOrderStatus = 'returned';
    }

    notesObj.returnClaim = claim;

    // 3. Update order in Supabase
    const updatePayload = {
      status: newOrderStatus,
      notes: JSON.stringify(notesObj),
      updated_at: nowIso,
    };

    if (newPaymentStatus) {
      updatePayload.payment_status = newPaymentStatus;
    }

    const { data: updatedOrder, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update order return status:', updateErr);
      throw updateErr;
    }

    return NextResponse.json({
      success: true,
      claim,
      order: updatedOrder,
      refundResult,
      message: `Return claim updated to "${claim.status}" successfully.`,
    });
  } catch (err) {
    console.error('Update return claim error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update return claim' }, { status: 500 });
  }
}
