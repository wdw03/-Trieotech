import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import RatingStars from '../../components/common/RatingStars';
import Badge from '../../components/common/Badge';
import ProductCard from '../../components/common/ProductCard';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { getProductBySlug, getRelatedProducts, products } from '../../data/products';
import { getReviewsByProductId } from '../../data/reviews';
import {
  Heart,
  ShoppingBag,
  Zap,
  Truck,
  RotateCcw,
  ShieldCheck,
  Award,
  Check,
  Share2,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Send,
  MessageCircle,
  Copy
} from 'lucide-react';

export const ProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  const { recentlyViewed, addRecentlyViewed } = useRecentlyViewed();

  const product = useMemo(() => {
    return getProductBySlug(slug) || products.find(p => p.id === Number(slug));
  }, [slug]);

  // States
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // description | specs | features | reviews

  // Pincode checker state
  const [pincode, setPincode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);

  // Review submission state
  const [userReview, setUserReview] = useState({ rating: 5, title: '', comment: '', name: '' });
  const [reviewsList, setReviewsList] = useState([]);

  // Initialize product state on slug change
  useEffect(() => {
    if (product) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      setSelectedImage(product.images?.[0] || '/products/shreenathji-statement-patch-1.jpg');
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : null);
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
      setQuantity(1);
      setDeliveryEstimate(null);
      addRecentlyViewed(product);

      // Load initial mock reviews
      const initialReviews = getReviewsByProductId(product.id);
      setReviewsList(initialReviews.length > 0 ? initialReviews : [
        {
          id: 1,
          user: "Ananya Sharma",
          rating: 5,
          date: "12 August 2026",
          title: "Stunning Indian Craftsmanship",
          comment: "The details and finishing are far superior than what pictures show. Truly royal!",
          helpful: 8,
          verified: true
        }
      ]);
    }
  }, [product, addRecentlyViewed]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-ivory-100">Product Not Found</h2>
        <p className="text-xs text-stone-500">The craft item you are looking for may have been retired or sold out.</p>
        <Link to="/shop" className="btn-primary text-xs font-bold uppercase tracking-wider inline-flex">
          Explore All Products
        </Link>
      </div>
    );
  }

  // Variant calculations
  const activePrice = selectedColor?.price || product.price;
  const activeOriginalPrice = selectedColor?.originalPrice || product.originalPrice;
  const discountPercent = activeOriginalPrice && activeOriginalPrice > activePrice
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
    : product.discount || 0;

  const isWishlisted = isInWishlist(product.id);
  const relatedProducts = getRelatedProducts(product, 4);

  // Filter recently viewed (excluding current product)
  const otherRecentlyViewed = recentlyViewed.filter(p => p.id !== product.id).slice(0, 4);

  const handleColorChange = (col) => {
    setSelectedColor(col);
    if (col.image) {
      setSelectedImage(col.image);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor?.name, selectedSize);
    openCart();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedColor?.name, selectedSize);
    navigate('/checkout');
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
      addToast('Please enter a valid 6-digit Indian PIN code', 'error');
      return;
    }
    const days = (Number(pincode) % 3) + 3; // 3 to 5 days
    setDeliveryEstimate({
      pincode,
      date: new Date(Date.now() + days * 86400000).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      codAvailable: true
    });
    addToast(`Delivery available for PIN ${pincode}`, 'success');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription,
          url
        });
      } catch (e) {
        // Fallback copy
      }
    } else {
      navigator.clipboard.writeText(url);
      addToast('Product link copied to clipboard!', 'success');
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!userReview.comment || !userReview.name) {
      addToast('Please enter your name and review comment', 'error');
      return;
    }
    const newRev = {
      id: Date.now(),
      user: userReview.name,
      rating: userReview.rating,
      date: 'Just now',
      title: userReview.title || 'Verified Patron Experience',
      comment: userReview.comment,
      helpful: 0,
      verified: true
    };
    setReviewsList([newRev, ...reviewsList]);
    setUserReview({ rating: 5, title: '', comment: '', name: '' });
    addToast('Thank you for submitting your artisan review!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-10 pb-20 lg:pb-10">
      {/* Dynamic SEO Meta & Product Schema */}
      <SEO
        title={product.name}
        description={product.shortDescription || product.description}
        image={product.images?.[0]}
        product={product}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: product.category, url: `/category/${product.category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')}` },
          { name: product.name, url: `/product/${product.slug}` }
        ]}
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { name: 'Categories', url: '/shop' },
          { name: product.category, url: `/category/${product.category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')}` },
          { name: product.name, url: `/product/${product.slug}` }
        ]}
      />

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Image Gallery (5 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Visual Display with Hover Zoom */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden ethnic-card border-2 border-gold-500/30 bg-white dark:bg-stone-900 group shadow-lg">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 items-start">
              {product.badge && <Badge type={product.badge} />}
              {discountPercent > 0 && (
                <span className="badge-ribbon bg-maroon-700 text-white font-extrabold border border-white/40">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all ${
                isWishlisted
                  ? 'bg-maroon-700 text-white shadow-maroon-sm scale-105'
                  : 'bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 hover:text-maroon-700 hover:scale-110'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Thumbnails Navigation Row */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-16 sm:w-20 aspect-square rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-maroon-700 ring-2 ring-gold-500 scale-105 shadow-md'
                      : 'border-gold-500/20 opacity-70 hover:opacity-100 hover:border-gold-500'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Actions (6 Cols) */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Category & Ratings */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400">
                {product.category} • {product.subcategory || 'Handcrafted'}
              </span>
              <div className="flex items-center gap-2">
                <RatingStars rating={product.rating || 4.8} reviewCount={product.reviewCount || 12} showValue />
              </div>
            </div>

            {/* Product Title */}
            <h1 className="font-serif font-black text-xl sm:text-2xl md:text-3xl text-stone-900 dark:text-ivory-100 leading-snug">
              {product.name}
            </h1>

            {/* Price Box */}
            <div className="flex items-baseline gap-3.5 p-4 rounded-2xl bg-ivory-200/70 dark:bg-stone-900/70 border border-gold-500/30">
              <span className="font-serif font-black text-2xl sm:text-3xl text-maroon-800 dark:text-gold-400">
                ₹{activePrice.toLocaleString('en-IN')}
              </span>
              {activeOriginalPrice && activeOriginalPrice > activePrice && (
                <span className="text-sm text-stone-400 line-through">
                  ₹{activeOriginalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                  Save {discountPercent}% Today
                </span>
              )}
              <span className="text-[11px] text-stone-500 ml-auto font-medium">
                (Inclusive of all taxes)
              </span>
            </div>

            {/* Short Narrative */}
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
              {product.shortDescription || product.description}
            </p>

            {/* Color Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gold-500/20">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-stone-900 dark:text-ivory-100">
                    Selected Variant / Shade:
                  </span>
                  <span className="font-semibold text-gold-700 dark:text-gold-400">
                    {selectedColor?.name || 'Default'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleColorChange(col)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                        selectedColor?.name === col.name
                          ? 'border-maroon-700 bg-maroon-50 text-maroon-900 dark:bg-maroon-950/60 dark:border-gold-500 dark:text-gold-300 shadow-xs ring-1 ring-gold-500'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-gold-500'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border shrink-0" style={{ backgroundColor: col.hex || '#C5A028' }} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size / Pack Options */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gold-500/20">
                <span className="font-bold text-xs text-stone-900 dark:text-ivory-100 block">
                  Package / Size Options:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedSize === s
                          ? 'bg-maroon-700 text-white border-maroon-700 shadow-xs'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-maroon-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Stock status */}
            <div className="flex items-center gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-stone-500">Quantity</span>
                <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-xl overflow-hidden bg-white dark:bg-stone-900">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-stone-900 dark:text-ivory-100 min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-3.5 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1 pl-4">
                <span className="text-[11px] font-bold text-stone-500">Stock Status</span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>{product.inStock ? 'Ready for Dispatch in 24 Hrs' : 'Out of Stock'}</span>
                </div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 btn-primary py-3.5 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-maroon-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="flex-1 btn-gold py-3.5 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-gold-md"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Buy Now (Instant Checkout)</span>
              </button>

              <button
                onClick={handleShare}
                className="p-3.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-gold-500 text-stone-600 dark:text-stone-300 hover:text-maroon-700 transition-colors flex items-center justify-center"
                title="Share product"
                aria-label="Share product"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Pincode Checker Box */}
            <div className="p-4 rounded-2xl bg-ivory-200/50 dark:bg-stone-900/50 border border-gold-500/20 space-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-ivory-100">
                <MapPin className="w-4 h-4 text-maroon-700 dark:text-gold-400" />
                <span>Delivery &amp; Service Availability Check</span>
              </div>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Indian PIN (e.g. 302001)"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-stone-900 dark:text-ivory-100 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-gold-500 text-white dark:text-maroon-950 text-xs font-bold"
                >
                  Check
                </button>
              </form>

              {deliveryEstimate && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1 animate-fade-in text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1 font-bold">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Estimated Delivery by {deliveryEstimate.date}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400">
                    Free Delivery eligible | Cash on Delivery (COD) available for PIN {deliveryEstimate.pincode}
                  </p>
                </div>
              )}
            </div>

            {/* Reassurance Feature Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0" />
                <span>100% Genuine Handcrafted</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-gold-600 shrink-0" />
                <span>7-Day Hassle-Free Return</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold-600 shrink-0" />
                <span>Free Express Delivery &gt; ₹999</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gold-600 shrink-0" />
                <span>Direct Karigar Collective</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Tabs Navigation Section (Description, Specs, Features, Reviews) */}
      <div className="space-y-6 pt-6 border-t border-gold-500/30">
        <div className="flex items-center gap-2 border-b border-gold-500/20 overflow-x-auto no-scrollbar">
          {[
            { id: 'description', label: 'Detailed Description' },
            { id: 'specs', label: 'Specifications & Care' },
            { id: 'features', label: 'Craft Features' },
            { id: 'reviews', label: `Patron Reviews (${reviewsList.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-maroon-700 text-maroon-700 dark:border-gold-500 dark:text-gold-400'
                  : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Detailed Description */}
        {activeTab === 'description' && (
          <div className="p-6 sm:p-8 rounded-3xl ethnic-card space-y-4 animate-fade-in text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
              Artisan Craft Narrative
            </h3>
            <p>{product.fullDescription || product.description}</p>
            <p>
              Handcrafted in India by generational master karigars using traditional tools, authentic raw materials, and royal zari techniques. Every individual piece undergoes strict hand inspection before sacred packaging.
            </p>
          </div>
        )}

        {/* Tab 2: Specifications & Care */}
        {activeTab === 'specs' && (
          <div className="p-6 sm:p-8 rounded-3xl ethnic-card space-y-6 animate-fade-in">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
              Craft &amp; Material Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 flex justify-between">
                <span className="text-stone-500">Brand</span>
                <span className="font-bold text-stone-900 dark:text-ivory-100">{product.brand || 'Trio Ecart'}</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 flex justify-between">
                <span className="text-stone-500">Country of Origin</span>
                <span className="font-bold text-stone-900 dark:text-ivory-100">{product.countryOfOrigin || 'India'}</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 flex justify-between">
                <span className="text-stone-500">Primary Material</span>
                <span className="font-bold text-stone-900 dark:text-ivory-100">{product.material || 'Authentic Handcraft'}</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 flex justify-between">
                <span className="text-stone-500">Package Quantity</span>
                <span className="font-bold text-stone-900 dark:text-ivory-100">{product.packageQuantity || '1 Set'}</span>
              </div>
              {product.specifications && Object.entries(product.specifications).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-ivory-100 dark:bg-stone-900/60 border border-gold-500/20 flex justify-between">
                  <span className="text-stone-500">{k}</span>
                  <span className="font-bold text-stone-900 dark:text-ivory-100 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Craft Features */}
        {activeTab === 'features' && (
          <div className="p-6 sm:p-8 rounded-3xl ethnic-card space-y-4 animate-fade-in">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100">
              Key Artisan Highlights
            </h3>
            {product.features && product.features.length > 0 ? (
              <ul className="space-y-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-700 dark:text-gold-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-500">Detailed craft features verified by Trio Ecart master guild.</p>
            )}
          </div>
        )}

        {/* Tab 4: Reviews Section */}
        {activeTab === 'reviews' && (
          <div className="p-6 sm:p-8 rounded-3xl ethnic-card space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gold-500/20">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400">
                  Patron Rating Breakdown
                </span>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 dark:text-ivory-100">
                  Customer Reviews
                </h3>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-ivory-100 dark:bg-stone-900 border border-gold-500/30">
                <span className="font-serif font-black text-3xl sm:text-4xl text-maroon-800 dark:text-gold-400">
                  {product.rating || 4.8}
                </span>
                <div className="space-y-1">
                  <RatingStars rating={product.rating || 4.8} size="md" />
                  <p className="text-[11px] text-stone-500">Based on {reviewsList.length} verified ratings</p>
                </div>
              </div>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="p-6 rounded-2xl bg-ivory-100/70 dark:bg-stone-900/70 border border-gold-500/30 space-y-4">
              <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-ivory-100">
                Write a Patron Review
              </h4>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Your Rating:</span>
                <RatingStars
                  rating={userReview.rating}
                  interactive
                  onRate={(r) => setUserReview(prev => ({ ...prev, rating: r }))}
                  size="md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Your Name (e.g. Radhika Sharma)"
                  value={userReview.name}
                  onChange={(e) => setUserReview(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs outline-none"
                />
                <input
                  type="text"
                  placeholder="Review Headline (e.g. Magnificent Zari Work)"
                  value={userReview.title}
                  onChange={(e) => setUserReview(prev => ({ ...prev, title: e.target.value }))}
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs outline-none"
                />
              </div>

              <textarea
                rows={3}
                required
                placeholder="Share your experience with the craftsmanship, delivery, and festive aesthetics..."
                value={userReview.comment}
                onChange={(e) => setUserReview(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-gold-500/30 text-xs outline-none"
              />

              <button
                type="submit"
                className="btn-primary text-xs font-bold uppercase tracking-wider py-2.5 px-6"
              >
                Submit Review
              </button>
            </form>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsList.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-ivory-50 dark:bg-stone-900/40 border border-gold-500/20 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-stone-900 dark:text-ivory-100">{rev.user}</span>
                      {rev.verified && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400">{rev.date}</span>
                  </div>

                  <RatingStars rating={rev.rating} size="xs" />
                  
                  {rev.title && (
                    <h5 className="font-serif font-bold text-xs text-stone-900 dark:text-ivory-100">
                      {rev.title}
                    </h5>
                  )}

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <div className="pt-10 border-t border-gold-500/30 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400">
                You May Also Cherish
              </span>
              <h2 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-ivory-100">
                Related Handcrafted Pieces
              </h2>
            </div>
            <Link
              to={`/category/${product.category.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')}`}
              className="text-xs font-bold text-maroon-700 dark:text-gold-400 hover:underline flex items-center gap-1"
            >
              <span>View Category</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products */}
      {otherRecentlyViewed.length > 0 && (
        <div className="pt-10 border-t border-gold-500/30 space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gold-700 dark:text-gold-400">
              Your Browsing Trail
            </span>
            <h2 className="font-serif font-black text-xl sm:text-2xl text-stone-900 dark:text-ivory-100">
              Recently Viewed Crafts
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {otherRecentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#140D08]/95 backdrop-blur-md border-t border-gold-500/30 p-3 z-30 lg:hidden flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0">
          <span className="text-[10px] text-stone-500 block truncate">{selectedColor?.name || product.name}</span>
          <span className="font-serif font-bold text-base text-maroon-800 dark:text-gold-400 leading-none">
            ₹{activePrice.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleWishlist(product)}
            className={`p-2.5 rounded-xl border ${
              isWishlisted ? 'bg-maroon-700 text-white' : 'border-stone-300 dark:border-stone-700 text-stone-700'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="btn-primary py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          <button
            onClick={handleBuyNow}
            disabled={!product.inStock}
            className="btn-gold py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Buy</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProductPage;
