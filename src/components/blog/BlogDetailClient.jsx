'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import { getBlogBySlug, blogs as fallbackBlogs } from '../../data/blogs';
import { fetchLiveBlogs } from '../../lib/api/store';
import { Clock, Tag, Share2, ArrowLeft, ArrowRight, Sparkles, BookOpen, Link2, Copy, ChevronRight, List } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// Extract headings from HTML content for TOC
function extractHeadings(html) {
  if (!html) return [];
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  const headings = [];
  let match;
  let index = 0;
  while ((match = regex.exec(html)) !== null) {
    const id = `section-${index}`;
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, ''),
      id
    });
    index++;
  }
  return headings;
}

// Inject IDs into HTML headings for anchor scrolling
function injectHeadingIds(html) {
  if (!html) return '';
  let index = 0;
  return html.replace(/<h([23])([^>]*)>/gi, (match, level, attrs) => {
    const id = `section-${index}`;
    index++;
    return `<h${level}${attrs} id="${id}">`;
  });
}

export default function BlogDetailClient({ initialSlug, initialBlog }) {
  const params = useParams();
  const slug = initialSlug || params?.slug;
  const { addToast } = useToast();
  const articleRef = useRef(null);

  const [blog, setBlog] = useState(() => initialBlog || getBlogBySlug(slug));
  const [allBlogs, setAllBlogs] = useState(fallbackBlogs);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showToc, setShowToc] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchLiveBlogs()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setAllBlogs(data);
          const found = data.find((b) => b.slug === slug || String(b.id) === String(slug));
          if (found) setBlog(found);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const articleHeight = rect.height;
      const scrolled = window.scrollY - articleTop;
      const progress = Math.min(100, Math.max(0, (scrolled / articleHeight) * 100));
      setReadingProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [blog]);

  const relatedBlogs = allBlogs.filter(b => b.slug !== slug).slice(0, 3);

  const headings = useMemo(() => extractHeadings(blog?.content), [blog?.content]);
  const processedContent = useMemo(() => injectHeadingIds(blog?.content), [blog?.content]);

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

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://trioenterprises.in/blog/${blog.slug}`;
  const shareTitle = blog.seoTitle || blog.title;

  // Schema.org structured data for Article
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.seoDescription || blog.excerpt || '',
    image: blog.image,
    author: {
      '@type': 'Person',
      name: blog.author,
      jobTitle: blog.authorRole || blog.author_role
    },
    publisher: {
      '@type': 'Organization',
      name: 'Trio Enterprises',
      logo: { '@type': 'ImageObject', url: 'https://trioenterprises.in/logo.png' }
    },
    datePublished: blog.date,
    dateModified: blog.date,
    mainEntityOfPage: shareUrl
  };

  return (
    <>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-maroon-700 via-gold-500 to-maroon-700 transition-all duration-150 ease-out shadow-sm"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 font-inter">
        
        <Breadcrumb
          items={[
            { name: 'Craft Journal', url: '/blog' },
            { name: blog.title, url: `/blog/${blog.slug}` }
          ]}
        />

        {/* Article Header */}
        <div className="space-y-4 text-center sm:text-left font-inter">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maroon-100 dark:bg-maroon-950 text-maroon-800 dark:text-gold-300 text-xs font-bold uppercase tracking-wider border border-maroon-300 dark:border-gold-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{blog.category}</span>
          </div>

          <h1 className="font-inter font-extrabold text-2xl sm:text-4xl md:text-5xl text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
            {blog.title}
          </h1>

          {/* Author & Read Time Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 pb-6 border-b border-gold-500/20 text-xs text-slate-500 font-medium font-inter">
            <div className="flex items-center gap-3">
              <img src={blog.authorImage || blog.author_image} alt={blog.author} className="w-10 h-10 rounded-full object-cover border border-gold-500/40" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-none">{blog.author}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{blog.authorRole || blog.author_role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gold-600" /> {blog.readTime || blog.read_time}
              </span>
              <span>•</span>
              <span>{blog.date}</span>
              
              {/* Social Share Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-ivory-200 dark:bg-stone-800 hover:text-maroon-700 transition-colors"
                  title="Copy link"
                  aria-label="Copy article link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-ivory-200 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                  title="Share on WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-ivory-200 dark:bg-stone-800 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-4 h-4 fill-current text-blue-600" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z"/>
                  </svg>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-ivory-200 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  title="Share on X (Twitter)"
                  aria-label="Share on X"
                >
                  <svg className="w-4 h-4 fill-current text-stone-800 dark:text-stone-200" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="aspect-[16/9] rounded-3xl overflow-hidden ethnic-card border-2 border-gold-500/30 shadow-2xl">
          <img
            src={blog.image}
            alt={blog.imageAlt || blog.image_alt || blog.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Table of Contents (if headings exist) */}
        {headings.length > 2 && (
          <div className="ethnic-card rounded-2xl border border-gold-500/20 overflow-hidden">
            <button
              onClick={() => setShowToc(!showToc)}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-stone-800 dark:text-gold-300"
            >
              <span className="flex items-center gap-2">
                <List className="w-4 h-4 text-gold-600" />
                Table of Contents ({headings.length} sections)
              </span>
              <ChevronRight className={`w-4 h-4 text-gold-600 transition-transform ${showToc ? 'rotate-90' : ''}`} />
            </button>
            {showToc && (
              <div className="px-4 pb-4 border-t border-gold-500/10 font-inter">
                <nav className="space-y-1.5 pt-3 font-medium text-xs sm:text-sm">
                  {headings.map((h, idx) => (
                    <a
                      key={idx}
                      href={`#${h.id}`}
                      className={`block transition-colors hover:text-maroon-700 dark:hover:text-gold-400 ${
                        h.level === 3 ? 'pl-4 text-slate-500 dark:text-slate-400 font-normal' : 'font-semibold text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {h.level === 2 ? '📖 ' : '• '}{h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </div>
        )}

        {/* Rich Article Body Content */}
        <article
          ref={articleRef}
          className="blog-content blog-typography font-inter font-medium text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed space-y-4 max-w-none prose dark:prose-invert prose-headings:scroll-mt-20"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />

        {/* Tags Row */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="pt-6 border-t border-gold-500/20 flex items-center gap-2 flex-wrap font-inter">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
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

        {/* Share Strip */}
        <div className="pt-4 pb-2 border-t border-gold-500/20 flex items-center justify-between font-inter">
          <span className="text-xs font-bold text-slate-500">Share this article:</span>
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 hover:shadow-sm transition-all"
            >
              <img src="/whatsapp.png" alt="WhatsApp" className="w-4 h-4 object-contain" /> WhatsApp
            </a>
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 hover:shadow-sm transition-all"
            >
              <Link2 className="w-3.5 h-3.5" /> Copy Link
            </button>
          </div>
        </div>

        {/* Related Blog Articles */}
        {relatedBlogs.length > 0 && (
          <div className="pt-10 border-t border-gold-500/30 space-y-6 font-inter">
            <h3 className="font-inter font-bold text-xl text-slate-900 dark:text-slate-100">
              More from the Artisan Journal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedBlogs.map((b) => (
                <Link
                  key={b.id}
                  href={`/blog/${b.slug}`}
                  className="ethnic-card rounded-2xl overflow-hidden group hover:border-gold-500/50 transition-all transform hover:-translate-y-1"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img src={b.image} alt={b.imageAlt || b.image_alt || b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-4 space-y-1.5 font-inter">
                    <span className="text-[10px] font-bold uppercase text-gold-700 dark:text-gold-400">{b.category}</span>
                    <h4 className="font-inter font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-maroon-700 dark:group-hover:text-gold-400 line-clamp-2">
                      {b.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3 h-3 text-gold-500" /> {b.readTime || b.read_time} • {b.date}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="pt-4 text-center">
          <Link href="/blog" className="btn-outline-maroon py-2.5 px-6 text-xs font-bold inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </Link>
        </div>
      </div>
    </>
  );
};
