export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// GET: Fetch FAQs (public gets visible only; ?all=true gets all)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (!all) {
      query = query.eq('is_visible', true);
    }

    if (category && category !== 'all' && category !== 'All') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching FAQs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ faqs: data || [] });
  } catch (err) {
    console.error('GET /api/faqs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new FAQ
export async function POST(request) {
  try {
    const body = await request.json();
    const { question, answer, category = 'General', sort_order = 0, is_visible = true } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }
    if (!answer || !answer.trim()) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('faqs')
      .insert([
        {
          question: question.trim(),
          answer: answer.trim(),
          category: category.trim() || 'General',
          sort_order: Number(sort_order) || 0,
          is_visible: Boolean(is_visible),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error creating FAQ:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, faq: data?.[0] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/faqs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update an existing FAQ
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, question, answer, category, sort_order, is_visible } = body;

    if (!id) {
      return NextResponse.json({ error: 'FAQ id is required for update' }, { status: 400 });
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (question !== undefined) updates.question = question.trim();
    if (answer !== undefined) updates.answer = answer.trim();
    if (category !== undefined) updates.category = category.trim();
    if (sort_order !== undefined) updates.sort_order = Number(sort_order);
    if (is_visible !== undefined) updates.is_visible = Boolean(is_visible);

    const { data, error } = await supabaseAdmin
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating FAQ:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, faq: data?.[0] });
  } catch (err) {
    console.error('PUT /api/faqs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete an FAQ
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {
        // body might be empty
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'FAQ id is required to delete' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting FAQ:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/faqs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
