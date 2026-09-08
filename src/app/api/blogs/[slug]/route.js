import { NextResponse } from 'next/server';
import { getBlogBySlug, updateBlog, deleteBlog } from '../../../../lib/blogs';

// GET: Fetch single blog by slug
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const blog = getBlogBySlug(slug);

    if (!blog) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ blog });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Update an existing blog
export async function PUT(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const updated = updateBlog(slug, body);

    if (!updated) {
      return NextResponse.json({ error: 'Article not found to update' }, { status: 404 });
    }

    return NextResponse.json({ success: true, blog: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a blog
export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;
    const deleted = deleteBlog(slug);

    if (!deleted) {
      return NextResponse.json({ error: 'Article not found to delete' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
