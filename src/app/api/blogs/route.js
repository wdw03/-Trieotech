export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAllBlogs, createBlog } from '../../../lib/blogs';

// GET: List all blogs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true' || searchParams.get('status') === 'all' || searchParams.get('status') === 'All';
    const status = searchParams.get('status');

    const blogs = await getAllBlogs({ all, status });
    return NextResponse.json({ blogs });
  } catch (err) {
    console.error('GET /api/blogs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new blog
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Blog title is required' }, { status: 400 });
    }

    const newBlog = await createBlog(body);
    return NextResponse.json({ success: true, blog: newBlog }, { status: 201 });
  } catch (err) {
    console.error('POST /api/blogs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
