export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// POST: Submit a new contact message / inquiry
export async function POST(request) {
  try {
    const body = await request.json();

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const message = String(body.message || '').trim();
    const phone = String(body.phone || '').trim();
    const subject = String(body.subject || 'General Inquiry').trim();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!message || message.length < 5) {
      return NextResponse.json({ error: 'Message must be at least 5 characters long' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .insert({
        name,
        email,
        phone,
        subject,
        message,
        status: 'unread',
        is_starred: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Contact insert error:', error);
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your inquiry has been received! Our support team will get in touch shortly.',
        data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('API /api/contact error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
