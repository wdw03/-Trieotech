export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';

/**
 * POST: Customer raises a Return / Refund Support Ticket with up to 3 photos
 */
export async function POST(request, { params }) {
  try {
    const { orderId } = await params;

    // 1. Authenticate user if session exists
    let user = null;
    try {
      const supabase = await createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      user = u;
    } catch (_) {}

    // 2. Fetch the order
    let order = null;
    const { data: ord1 } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*), payments(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (ord1) {
      order = ord1;
    } else {
      const { data: ord2 } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*), payments(*)')
        .eq('order_number', orderId)
        .maybeSingle();
      order = ord2;
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. Ownership check if authenticated
    if (order.user_id && user && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to raise ticket for this order' }, { status: 403 });
    }

    // 4. Eligibility check: order should be delivered or confirmed
    const orderStatus = (order.status || '').toLowerCase();
    const isDeliveredOrShipped = ['delivered', 'shipped', 'completed'].includes(orderStatus);
    if (!isDeliveredOrShipped && orderStatus !== 'return_requested') {
      return NextResponse.json(
        { error: `Return claims can only be raised for delivered orders. Current order status is "${order.status}".` },
        { status: 400 }
      );
    }

    // 5. Parse request body
    const body = await request.json();
    const { reason, description, images = [], resolution = 'refund', itemId } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Please select a valid reason for return' }, { status: 400 });
    }

    if (!description || description.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide issue details (at least 5 characters)' }, { status: 400 });
    }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Please upload at least 1 photo showing the product / package defect.' }, { status: 400 });
    }

    if (images.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 photos can be uploaded per return claim.' }, { status: 400 });
    }

    // 6. Generate Ticket ID
    const shortRef = order.order_number || String(order.id).slice(0, 8);
    const ticketId = `TKT-RET-${shortRef}-${Math.floor(1000 + Math.random() * 9000)}`;

    const requestedAt = new Date().toISOString();

    // 7. Parse existing notes or initialize
    let existingNotesObj = {};
    if (order.notes) {
      try {
        existingNotesObj = JSON.parse(order.notes);
      } catch {
        existingNotesObj = { legacyNotes: order.notes };
      }
    }

    const returnClaim = {
      ticketId,
      status: 'pending_review', // pending_review | approved | rejected | refunded | replaced
      reason: reason.trim(),
      description: description.trim(),
      images: images.slice(0, 3),
      resolution: resolution === 'replacement' ? 'replacement' : 'refund',
      itemId: itemId || null,
      refundAmount: Number(order.total || 0),
      requestedAt,
      adminNotes: '',
      history: [
        {
          step: 'Ticket Raised',
          timestamp: requestedAt,
          note: `Customer requested ${resolution === 'replacement' ? 'replacement' : 'refund'} with ${images.length} proof photos.`,
        },
      ],
    };

    const updatedNotes = JSON.stringify({
      ...existingNotesObj,
      returnClaim,
    });

    // 8. Update order in Supabase (keep order.status to satisfy orders_status_check DB constraint)
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        notes: updatedNotes,
        updated_at: requestedAt,
      })
      .eq('id', order.id);

    if (updateErr) {
      console.error('Failed to update order for return claim:', updateErr);
      return NextResponse.json({ error: 'Failed to record return ticket in database' }, { status: 500 });
    }

    // 9. Also log into contact_messages for support redundancy
    try {
      const customerName = order.shipping_address?.name || 'Customer';
      const customerEmail = order.shipping_address?.email || user?.email || 'support@trioecart.com';
      const customerPhone = order.shipping_address?.phone || '';

      await supabaseAdmin.from('contact_messages').insert({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        subject: `SUPPORT_TICKET: Return Claim ${ticketId} for Order ${order.order_number || order.id}`,
        message: JSON.stringify({
          ticketId,
          orderId: order.id,
          orderNumber: order.order_number,
          reason,
          description,
          images,
          resolution,
        }),
        status: 'unread',
        created_at: requestedAt,
        updated_at: requestedAt,
      });
    } catch (msgErr) {
      console.warn('Backup contact message creation skipped:', msgErr.message);
    }

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Support ticket raised successfully! Our team will verify your photos and update status.',
      claim: returnClaim,
    });
  } catch (err) {
    console.error('Create return ticket error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit return ticket' }, { status: 500 });
  }
}

/**
 * GET: Customer retrieves the return ticket details and live status for an order
 */
export async function GET(request, { params }) {
  try {
    const { orderId } = await params;

    let order = null;
    const { data: ord1 } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status, notes, updated_at')
      .eq('id', orderId)
      .maybeSingle();

    if (ord1) {
      order = ord1;
    } else {
      const { data: ord2 } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, status, notes, updated_at')
        .eq('order_number', orderId)
        .maybeSingle();
      order = ord2;
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let returnClaim = null;
    if (order.notes) {
      try {
        const parsed = JSON.parse(order.notes);
        if (parsed.returnClaim) {
          returnClaim = parsed.returnClaim;
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      hasClaim: !!returnClaim,
      orderStatus: order.status,
      claim: returnClaim,
    });
  } catch (err) {
    console.error('Fetch return ticket error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
