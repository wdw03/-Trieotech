import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import { getBlogBySlug, blogs } from '../../data/blogs';
import { Clock, Tag, Share2, ArrowLeft, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const BlogDetailPage = () => {
  const { slug } = useParams();
  const { addToast } = useToast();

  const blog = getBlogBySlug(slug);

  const relatedBlogs = blogs.filter(b => b.slug !== slug).slice(0, 2);

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <EmptyState
          title="Article Not Found"
          description="The craft article you are searching for may have moved or been updated."
          actionText="Explore All Articles"
          actionUrl="/blog"
        />
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: blog.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Article link copied to clipboard!', 'success');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO
        title={blog.title}
        description={blog.excerpt}
        image={blog.image}
        breadcrumbs={[
          { name: 'Craft Journal', url: '/blog' },
          { name: blog.title, url: `/blog/${blog.slug}` }
        ]}
      />

      <Breadcrumb
        items={[
          { name: 'Craft Journal', url: '/blog' },
          { name: blog.title, url: `/blog/${blog.slug}` }
        ]}
      />

      {/* Article Header */}
      <div className="space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maroon-100 dark:bg-maroon-950 text-maroon-800 dark:text-gold-300 text-xs font-bold uppercase tracking-wider border border-maroon-300 dark:border-gold-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{blog.category}</span>
        </div>

        <h1 className="font-serif font-black text-2xl sm:text-4xl md:text-5xl text-stone-900 dark:text-ivory-100 leading-tight">
          {blog.title}
        </h1>

        {/* Author & Read Time Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 pb-6 border-b border-gold-500/20 text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <img src={blog.authorImage} alt={blog.author} className="w-10 h-10 rounded-full object-cover border border-gold-500/40" />
            <div>
              <p className="font-bold text-stone-900 dark:text-ivory-100 text-sm leading-none">{blog.author}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{blog.authorRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gold-600" /> {blog.readTime}
            </span>
            <span>•</span>
            <span>{blog.date}</span>
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-ivory-200 dark:bg-stone-800 hover:text-maroon-700 transition-colors"
              title="Share"
              aria-label="Share article"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="aspect-[16/9] rounded-3xl overflow-hidden ethnic-card border-2 border-gold-500/30 shadow-2xl">
        <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
      </div>

      {/* Rich Article Body Content */}
      <article
        className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed space-y-4 font-sans"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Tags Row */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="pt-6 border-t border-gold-500/20 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-gold-600" /> Tags:
          </span>
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-gold-500/10 text-gold-800 dark:text-gold-300 border border-gold-500/20 text-xs font-semibold"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Related Blog Articles */}
      {relatedBlogs.length > 0 && (
        <div className="pt-10 border-t border-gold-500/30 space-y-6">
          <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-ivory-100">
            More from the Artisan Journal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedBlogs.map((b) => (
              <Link
                key={b.id}
                to={`/blog/${b.slug}`}
                className="ethnic-card p-4 rounded-2xl flex gap-4 items-center group hover:border-gold-500/50 transition-all"
              >
                <img src={b.image} alt={b.title} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-gold-500/20" />
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-gold-700 dark:text-gold-400">{b.category}</span>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-ivory-100 group-hover:text-maroon-700 dark:group-hover:text-gold-400 line-clamp-2">
                    {b.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back to Blog */}
      <div className="pt-4 text-center">
        <Link to="/blog" className="btn-outline-maroon py-2.5 px-6 text-xs font-bold inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Articles</span>
        </Link>
      </div>
    </div>
  );
};

export default BlogDetailPage;
