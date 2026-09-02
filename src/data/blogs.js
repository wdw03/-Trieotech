export const blogs = [
  {
    id: 1,
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
    content: `
      <h2>The Living Legacy of Zari & Zardosi</h2>
      <p>Originating from the Persian words <em>Zar</em> (gold) and <em>Dozi</em> (embroidery), Zardosi is a centuries-old imperial craft that flourished under Mughal patronage in Lucknow, Varanasi, and Hyderabad. Unlike flat surface threadwork, authentic Zardosi is three-dimensional sculpture on fabric.</p>
      
      <h3>How Karigars Stitch the Magic</h3>
      <p>Artisans stretch pure silk, velvet, or organza tightly across a wooden frame called the <strong>Adda</strong>. Using a hooked needle (ari), they meticulously guide spangles (sitara), bullion coils (salma), seed pearls, and glass zarkans one by one into intricate peacock, floral, and sacred paisley motifs.</p>

      <blockquote>"Each motif is not merely a design; it is hours of disciplined meditation by generational craftsmen preserving India's royal legacy."</blockquote>

      <h3>Styling Zardosi Patches on Contemporary Wardrobes</h3>
      <p>Today, DIY designers and boutique couriers use ready-made handcrafted Zardosi patches to transform plain georgette dupattas, velvet blouses, raw silk jackets, and festive potli bags into heirloom couture masterpieces without spending lakhs.</p>
    `
  },
  {
    id: 2,
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
    content: `
      <h2>The Ancient Practice of Tamra Jal</h2>
      <p>In classical Ayurvedic texts like the <em>Charaka Samhita</em>, storing clean water overnight in pure copper vessels (Tamra Patra) is prescribed as an essential daily habit known as <strong>Tamra Jal</strong>.</p>
      
      <h3>Scientifically Proven Oligodynamic Effect</h3>
      <p>Modern microbiological studies show that copper ions exert an oligodynamic effect, neutralizing harmful bacteria and microorganisms naturally within 8 to 12 hours of contact, rendering water revitalized and energetically balanced.</p>

      <h3>How to Care for Your Hand-Hammered Copper Vessel</h3>
      <ul>
        <li>Never store lemon juice, vinegar, or carbonated drinks in copper.</li>
        <li>Clean the interior weekly with natural tamarind pulp or salt and lemon.</li>
        <li>Wipe dry with a soft microfiber cloth to prevent water spots and preserve the copper luster.</li>
      </ul>
    `
  },
  {
    id: 3,
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
    content: `
      <h2>The Significance of Asana in Daily Worship</h2>
      <p>In Vedic spiritual practices, sitting directly on the bare floor during prayer causes energy dissipation. A consecrated pure velvet, silk, or kusha grass <strong>Aasan</strong> insulates the devotee's spiritual energy and anchors sacred focus.</p>

      <h3>The 5 Essential Elements of a Sacred Aarti Thali</h3>
      <ol>
        <li><strong>Red Velvet or Brass Base:</strong> Symbol of auspicious Shakti energy.</li>
        <li><strong>Solid Brass Diyas:</strong> Representing the inner flame of wisdom burning away darkness.</li>
        <li><strong>Roli, Akshat & Chandan Cups:</strong> Sacred paste for divine tilak.</li>
        <li><strong>Fresh Floral Pollens:</strong> Symbolizing devotion and pure fragrance.</li>
        <li><strong>Pure Cotton Angavastram:</strong> Traditional purity garment for ritual conduct.</li>
      </ol>
    `
  }
];

export const getBlogBySlug = (slug) => {
  if (!slug) return null;
  return blogs.find(b => b.slug === slug);
};

export default blogs;
