export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getBlogBySlug, updateBlog, deleteBlog } from '../../../../lib/blogs';

// GET: Fetch single blog by slug
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const blog = await getBlogBySlug(slug);

    if (!blog) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ blog });
  } catch (err) {
    console.error('GET /api/blogs/[slug] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update an existing blog
export async function PUT(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const updated = await updateBlog(slug, body);

    if (!updated) {
      return NextResponse.json({ error: 'Article not found to update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, blog: updated });
  } catch (err) {
    console.error('PUT /api/blogs/[slug] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a blog
export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;
    await deleteBlog(slug);

    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/blogs/[slug] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
