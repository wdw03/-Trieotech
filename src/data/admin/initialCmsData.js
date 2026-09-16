// ══════════════════════════════════════════════════════════════════════
// AUTHENTIC TRIO ECART CMS INITIAL DATA
// Mapped directly from triotech storefront architecture
// ══════════════════════════════════════════════════════════════════════

export const initialHeroSlides = [
  {
    id: "a8aaab85-f8b5-4a9e-9c94-7917c53efc37",
    order: 1,
    isActive: true,
    badge: "Festive & Wedding 2026",
    tag: "Authentic Imperial Zari",
    // Desktop Content
    title: "Handcrafted Zardosi & Sacred Deity Patches",
    subtitle: "Ornate gold zari, zarkan stone cutwork, and royal peacock motifs hand-stitched by generational master karigars for bridal lehengas and festive couture.",
    ctaText: "Explore Patches",
    desktopCtaText: "Explore Embroidery Patches",
    ctaLink: "/category/patches",
    secondaryCtaText: "View Best Sellers",
    secondaryCtaLink: "/shop",
    image: "/products/shreenathji-statement-patch-1.jpg",
    secondaryImage: "/products/peacock-real-feathers-pair-1.jpg",
    // Mobile Optimized Content
    mobileTitle: "Handcrafted Zardosi & Deity Patches",
    mobileSubtitle: "Royal zari, zarkan stone cutwork & peacock motifs by master karigars.",
    mobileImage: "/products/shreenathji-statement-patch-1.jpg",
    mobileCtaText: "Explore Patches"
  },
  {
    id: "52feae47-3075-47c2-aac7-f157accac2b1",
    order: 2,
    isActive: true,
    badge: "100% Pure Tamra Jal Wellness",
    tag: "100% Pure Copper",
    // Desktop Content
    title: "Ayurvedic Hammered Pure Copper Bottles",
    subtitle: "Infuse your daily water with natural antimicrobial goodness and holistic vitality. Hand-hammered with heavy-gauge pure copper by traditional thatheras.",
    ctaText: "Shop Copper Bottles",
    desktopCtaText: "Shop Copper Bottles",
    ctaLink: "/category/bottle",
    secondaryCtaText: "Ayurveda Guide",
    secondaryCtaLink: "/blog/ayurvedic-benefits-pure-copper-water-bottle",
    image: "/products/hammered-copper-bottle-1.jpg",
    secondaryImage: "/products/jute-bottle-bag-1.jpg",
    // Mobile Optimized Content
    mobileTitle: "Pure Ayurvedic Copper Bottles",
    mobileSubtitle: "Hand-hammered heavy-gauge pure copper for holistic daily vitality.",
    mobileImage: "/products/hammered-copper-bottle-1.jpg",
    mobileCtaText: "Shop Bottles"
  },
  {
    id: "f7f9bee9-ff2e-4f3b-bb11-a5e5177973f5",
    order: 3,
    isActive: true,
    badge: "Devotion & Sacred Rituals",
    tag: "Auspicious Festivities",
    // Desktop Content
    title: "Royal Velvet Pooja Aasans & Brass Thalis",
    subtitle: "Elevate your daily aarti and festive mandir ceremonies with pure red velvet aasans, embellished brass diyas, and authentic desi cotton gamchas.",
    ctaText: "Discover Pooja Items",
    desktopCtaText: "Discover Pooja Essentials",
    ctaLink: "/category/aasan",
    secondaryCtaText: "Festival Special",
    secondaryCtaLink: "/category/towel-gamcha",
    image: "/products/pooja-thali-brass-diya-1.jpg",
    secondaryImage: "/products/lotus-kamal-aasan-1.jpg",
    // Mobile Optimized Content
    mobileTitle: "Velvet Pooja Aasans & Brass Thalis",
    mobileSubtitle: "Pure velvet aasans, embellished brass diyas & sacred essentials.",
    mobileImage: "/products/pooja-thali-brass-diya-1.jpg",
    mobileCtaText: "Shop Pooja Decor"
  }
];

export const initialHomeSections = {
  heroCarousel: {
    id: "heroCarousel",
    name: "Hero Banner Carousel",
    description: "Main rotating slider at the top of the Home Page",
    isEnabled: true,
    autoplaySpeed: 5500
  },
  categoryGrid: {
    id: "categoryGrid",
    name: "Featured Categories Grid",
    description: "Visual cards showcasing top craft collections",
    isEnabled: true,
    title: "Browse By Craft Category",
    subtitle: "Discover centuries-old traditions curated into bespoke handicraft collections",
    viewAllLink: "/shop"
  },
  bestSellers: {
    id: "bestSellers",
    name: "Artisan Best Sellers Carousel",
    description: "Carousel displaying high-performing catalog products",
    isEnabled: true,
    title: "Artisan Best Sellers",
    subtitle: "Our most cherished handcrafted patches, copper bottles, and pooja essentials loved by thousands of patrons.",
    badge: "Patron Favorites",
    productLimit: 4,
    viewAllLink: "/shop?sort=bestseller"
  },
  promotionalBanners: {
    id: "promotionalBanners",
    name: "Festive & Wedding Dual Promotional Banners",
    description: "Side-by-side promotional cards for Wedding Couture and Festive Mandir collections",
    isEnabled: true,
    weddingBanner: {
      badge: "Royal Bridal Couture",
      title: "Wedding Special Patches & Latkans",
      description: "Elevate bridal lehengas and wedding ensembles with hand-stitched peacock appliques and pearl parandas.",
      buttonText: "Shop Bridal Collection",
      buttonLink: "/category/patches",
      image: "/products/peacock-real-feathers-pair-1.jpg"
    },
    festivalBanner: {
      badge: "Auspicious Festivities",
      title: "Sacred Pooja Aasans & Thalis",
      description: "Conceive divine blessings for Diwali, Navratri, and Griha Pravesh with red velvet thalis and brass diyas.",
      buttonText: "Explore Mandir Decor",
      buttonLink: "/category/aasan",
      image: "/products/pooja-thali-brass-diya-1.jpg"
    }
  },
  newArrivals: {
    id: "newArrivals",
    name: "Fresh Arrivals Atelier Carousel",
    description: "Latest creations just completed by the artisan collective",
    isEnabled: true,
    title: "Fresh from the Artisan Ateliers",
    subtitle: "Newly woven cotton gamchas, pure copper sets, and floral decor recently completed by our craft collective.",
    badge: "Just Arrived",
    productLimit: 4,
    viewAllLink: "/shop?sort=newest"
  },
  brandStory: {
    id: "brandStory",
    name: "Brand Heritage Story Strip",
    description: "Collage strip showcasing generational craft preservation",
    isEnabled: true,
    badge: "Generational Heritage",
    title: "Preserving Ancient Indian Needlework & Sacred Arts",
    description: "Every stitch in our zardosi motifs and every hammer mark on our copper vessels carries forward the living heritage of master artisans from Jaipur, Surat, and Varanasi.",
    stat1Number: "400+",
    stat1Label: "Generational Artisans Supported",
    stat2Number: "100%",
    stat2Label: "Authentic Handmade Craft",
    stat3Number: "25,000+",
    stat3Label: "Devotees & Designers Served",
    images: [
      "/products/peacock-real-feathers-pair-1.jpg",
      "/products/lotus-kamal-aasan-1.jpg",
      "/products/hammered-copper-bottle-1.jpg"
    ]
  },
  trending: {
    id: "trending",
    name: "Trending Handicrafts Carousel",
    description: "Popular products in high demand this week",
    isEnabled: true,
    title: "Trending Handicrafts",
    subtitle: "Highly in-demand zardosi butti motifs, cup chains, and puja chowki cloths.",
    badge: "Popular This Week",
    productLimit: 4,
    viewAllLink: "/shop"
  },
  testimonials: {
    id: "testimonials",
    name: "Patron Reviews & Testimonials",
    description: "Verified customer feedback from bridal designers and temple decorators",
    isEnabled: true,
    badge: "Verified Patron Feedback",
    title: "Loved by Couturiers, Decorators & Devotees",
    subtitle: "Real experiences from authentic patrons celebrating weddings, daily pooja rituals, and bespoke bridal fashion."
  },
  blogPreview: {
    id: "blogPreview",
    name: "Artisan Stories & Journal Preview",
    description: "Latest educational guides on Indian crafts and Ayurveda",
    isEnabled: true,
    badge: "Artisan Journal & Stories",
    title: "Chronicles of Indian Craftsmanship",
    subtitle: "Immerse yourself in authentic stories of royal needlework, ancient Vedic wellness, and festive decor guides.",
    viewAllLink: "/blog",
    postLimit: 3
  },
  footer: {
    id: "footer",
    name: "Global Store Footer Content",
    description: "Footer branding, contact details, and warehouse address",
    isEnabled: true,
    brandName: "TRIO ECART",
    tagline: "Preserving India's Timeless Handicrafts, Sacred Devotions & Ayurvedic Wellness",
    aboutText: "Direct from the artisan clusters of Jaipur, Surat, and Moradabad. Handcrafted decorative patches, pure copper drinkware, and traditional pooja essentials.",
    supportEmail: "support@trioecart.com",
    supportPhone: "+91 7065120322",
    warehouseAddress: "UNIT NO. 16, First Floor, E-43, Nehru Ground, N.I.T Faridabad, Near R.B.A COLLEGE, 121001",
    copyrightText: "© 2026 Trio Ecart (Trieotech Enterprise). Handcrafted with pride in India."
  }
};

export const initialCmsBlogs = [
  {
    id: "BLOG-1",
    title: "The Sacred Art of Zardosi: From Mughal Ateliers to Modern Bridal Couture",
    slug: "sacred-art-of-zardosi-embroidery-history",
    author: "Meera Sen",
    authorRole: "Heritage Textile Curator",
    authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    date: "August 28, 2026",
    category: "Artisan Heritage",
    image: "/products/peacock-real-feathers-pair-1.jpg",
    excerpt: "Explore how metallic bullion threads, zarkan stones, and pearls are hand-stitched on rich velvet by Indian karigars preserving ancient craft traditions.",
    tags: ["Zardosi", "Embroidery", "Indian Craft", "Bridal Fashion", "Handmade"],
    readTime: "6 min read",
    status: "Published",
    seoTitle: "The Sacred Art of Zardosi: Indian Craft & Bridal Couture History",
    seoDescription: "Learn about the ancient Mughal origins of Zardosi embroidery, the traditional Adda wooden frame method, and how ready-made patches elevate bridal couture.",
    content: `<h2>The Living Legacy of Zari & Zardosi</h2>
<p>Originating from the Persian words <em>Zar</em> (gold) and <em>Dozi</em> (embroidery), Zardosi is a centuries-old imperial craft that flourished under Mughal patronage in Lucknow, Varanasi, and Hyderabad. Unlike flat surface threadwork, authentic Zardosi is three-dimensional sculpture on fabric.</p>

<h3>How Karigars Stitch the Magic</h3>
<p>Artisans stretch pure silk, velvet, or organza tightly across a wooden frame called the <strong>Adda</strong>. Using a hooked needle (ari), they meticulously guide spangles (sitara), bullion coils (salma), seed pearls, and glass zarkans one by one into intricate peacock, floral, and sacred paisley motifs.</p>

<blockquote>"Each motif is not merely a design; it is hours of disciplined meditation by generational craftsmen preserving India's royal legacy."</blockquote>

<h3>Styling Zardosi Patches on Contemporary Wardrobes</h3>
<p>Today, DIY designers and boutique couriers use ready-made handcrafted Zardosi patches to transform plain georgette dupattas, velvet blouses, raw silk jackets, and festive potli bags into heirloom couture masterpieces without spending lakhs.</p>`
  },
  {
    id: "BLOG-2",
    title: "Ayurvedic Wisdom: The Scientific Benefits of Drinking from Pure Copper Bottles",
    slug: "ayurvedic-benefits-pure-copper-water-bottle",
    author: "Dr. Rajeshwar Bhatt",
    authorRole: "Ayurvedic Health Consultant",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    date: "August 24, 2026",
    category: "Wellness & Tradition",
    image: "/products/hammered-copper-bottle-1.jpg",
    excerpt: "Learn how the ancient practice of Tamra Jal balances the three doshas (Vata, Pitta, Kapha) and infuses drinking water with natural antimicrobial properties.",
    tags: ["Copper Bottle", "Ayurveda", "Tamra Jal", "Holistic Health", "Wellness"],
    readTime: "5 min read",
    status: "Published",
    seoTitle: "Ayurvedic Benefits of Drinking from Pure Copper Bottles (Tamra Jal)",
    seoDescription: "Discover why storing water in pure copper vessels balances the Tridoshas, provides natural antimicrobial protection, and enhances holistic daily vitality.",
    content: `<h2>The Ancient Practice of Tamra Jal</h2>
<p>In classical Ayurvedic texts like the <em>Charaka Samhita</em>, storing clean water overnight in pure copper vessels (Tamra Patra) is prescribed as an essential daily habit known as <strong>Tamra Jal</strong>.</p>

<h3>Scientifically Proven Oligodynamic Effect</h3>
<p>Modern microbiological studies show that copper ions exert an oligodynamic effect, neutralizing harmful bacteria and microorganisms naturally within 8 to 12 hours of contact, rendering water revitalized and energetically balanced.</p>

<h3>How to Care for Your Hand-Hammered Copper Vessel</h3>
<ul>
  <li>Never store lemon juice, vinegar, or carbonated drinks in copper.</li>
  <li>Clean the interior weekly with natural tamarind pulp or salt and lemon.</li>
  <li>Wipe dry with a soft microfiber cloth to prevent water spots and preserve the copper luster.</li>
</ul>`
  },
  {
    id: "BLOG-3",
    title: "Sacred Festive Decor: Setting Up a Divine Home Mandir for Diwali & Navratri",
    slug: "setting-up-sacred-home-mandir-diwali-pooja",
    author: "Gayatri Devi",
    authorRole: "Vedic Ritual Scholar",
    authorImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    date: "August 19, 2026",
    category: "Devotion & Rituals",
    image: "/products/pooja-thali-brass-diya-1.jpg",
    excerpt: "A complete step-by-step guide on choosing pooja aasans, brass diya arrangements, and sacred chowki decorations for auspicious festivals.",
    tags: ["Pooja Aasan", "Diwali Decor", "Mandir", "Brass Diya", "Devotion"],
    readTime: "7 min read",
    status: "Published",
    seoTitle: "How to Set Up a Divine Home Mandir for Diwali & Festivals | Trio Ecart",
    seoDescription: "Step-by-step Vedic guide on setting up your sacred pooja mandir with pure velvet aasans, solid brass diyas, and authentic handloom gamchas.",
    content: `<h2>The Significance of Asana in Daily Worship</h2>
<p>In Hindu spiritual tradition, the seat or <strong>Aasan</strong> provided to deities establishes a consecrated divine boundary. Using rich velvet embroidered with sacred lotus or om motifs invites auspicious serenity into prayer.</p>

<h3>Essential Elements of an Auspicious Pooja Setup</h3>
<ul>
  <li><strong>Velvet Lotus Kamal Aasan</strong>: Acts as a pure base for Laddu Gopal, Ganesh, and Lakshmi idols.</li>
  <li><strong>Solid Brass Thali & Diyas</strong>: Five-piece brass bhog plates retain sacred vibrations during aarti.</li>
  <li><strong>Pure Cotton Handloom Gamcha</strong>: Worn during puja rituals for breathability and spiritual purity.</li>
</ul>`
  }
];

export const initialCmsPages = {
  about: {
    id: "about",
    title: "About Trio Ecart",
    badge: "Heritage Craft Collective",
    headline: "Reviving Ancient Indian Craftsmanship for Modern Spaces",
    story: "Founded with a sacred mission to sustain traditional Indian artisans, Trio Ecart connects generational karigars from Jaipur, Surat, and Moradabad directly with fashion designers, temple decorators, and boutique patrons worldwide. Every embroidery patch, pure copper vessel, and pooja thali is handcrafted with deep spiritual reverence and meticulous dedication.",
    mission: "To ensure that no ancient Indian craft form fades into obscurity, while offering authentic, ethically sourced, and timeless creations at honest artisan prices.",
    values: [
      { title: "100% Genuine Artisan Origin", desc: "No mass-produced synthetic copies; purely crafted by generational masters." },
      { title: "Fair Artisan Livelihoods", desc: "Direct compensation that honors the immense time and skill invested in every piece." },
      { title: "Preservation of Sacred Arts", desc: "Keeping traditional Zari, Zardosi, Thathera metalwork, and Handloom weaving alive." }
    ]
  },
  contact: {
    id: "contact",
    title: "Contact & Warehouse Support",
    supportEmail: "support@trioecart.com",
    supportPhone: "+91 7065120322",
    whatsappNumber: "+91 7065120322",
    warehouseAddress: "UNIT NO. 16, First Floor, E-43, Nehru Ground, N.I.T Faridabad, Near R.B.A COLLEGE, 121001",
    businessHours: "Monday to Saturday: 10:00 AM – 7:00 PM IST",
    faqNotice: "For order tracking, returns, and wholesale queries, our artisan support team responds within 4 business hours."
  },
  faqs: [
    {
      id: "FAQ-1",
      question: "Are your embroidery patches genuinely handcrafted with real Zari?",
      answer: "Yes, 100%. Our master karigars in Jaipur and Surat hand-stitch bullion coils, seed pearls, and metallic zari threads using traditional Adda embroidery frames."
    },
    {
      id: "FAQ-2",
      question: "Are your copper bottles made of 100% pure copper?",
      answer: "Absolutely. All our copper drinkware is crafted from certified heavy-gauge pure food-grade copper with seamless joint-free construction, ideal for Ayurvedic Tamra Jal."
    },
    {
      id: "FAQ-3",
      question: "Can I order custom patch motifs for bridal or temple orders?",
      answer: "Yes! We cater to boutique designers, temple trusts, and wedding coordinators for bulk custom motifs. Contact us via WhatsApp or email."
    },
    {
      id: "FAQ-4",
      question: "What is the delivery time across India?",
      answer: "Metro cities take 2–3 business days via BlueDart Air Express. Other locations typically arrive within 3–5 business days."
    }
  ]
};
