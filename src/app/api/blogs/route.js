import { NextResponse } from 'next/server';
import { getAllBlogs, createBlog } from '../../../lib/blogs';

// GET: List all blogs
export async function GET() {
  try {
    const blogs = getAllBlogs();
    return NextResponse.json({ blogs });
  } catch (err) {
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

    const newBlog = createBlog(body);
    return NextResponse.json({ success: true, blog: newBlog }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
