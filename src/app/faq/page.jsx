import FAQClient from '../../components/static/FAQClient';
import { supabaseAdmin } from '../../lib/supabase/admin';

export const revalidate = 60; // ISR cache for 60 seconds

export const metadata = {
  title: 'Frequently Asked Questions | Trio Enterprises',
  description: 'Find answers regarding handcrafted Zardosi patches, pure copper bottle care, pooja aasan maintenance, and domestic delivery.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions | Trio Enterprises',
    description: 'Find answers regarding craft materials, patch applications, copper maintenance, and delivery.',
    url: 'https://trioenterprises.com/faq',
  },
};

const DEFAULT_FAQS = [
  {
    question: "Are all Trio Enterprises embroidery patches authentic handmade zardosi?",
    answer: "Yes. Every patch in our collection is hand-stitched by skilled karigars using traditional wooden addas, genuine metallic bullion coils (zari), glass zarkans, and faux pearls. We do not sell flat machine-printed imitations."
  },
  {
    question: "How do I stitch or affix embroidery appliques to lehengas, dupattas, or blouses?",
    answer: "Our applique patches feature reinforced backing that can easily be hand-stitched along the borders with a matching needle and thread, or fabric-glued using high-grade craft adhesive before fine edge stitching for permanent bridal wear."
  },
  {
    question: "Is your copper water bottle 100% pure copper?",
    answer: "Yes. Our hammered and plain matte copper bottles are crafted from 100% lab-tested, food-grade pure copper without inner chemical lacquers or lead, ensuring optimal Ayurvedic Tamra Jal health benefits."
  },
  {
    question: "How long does domestic delivery take across India?",
    answer: "All orders are dispatched within 24 business hours from our Jaipur craft center. Metro cities receive deliveries in 2-3 business days, while other locations take 3-5 days via BlueDart Air Express."
  },
  {
    question: "What is your return and replacement policy?",
    answer: "We offer a 7-day doorstep replacement guarantee on all items. If an item arrives transit-damaged or differs from your expectations, contact our WhatsApp support at +91 98765 43210 for an instant replacement or full refund."
  },
  {
    question: "Do you offer Cash on Delivery (COD)?",
    answer: "Yes! Cash on Delivery is available across 19,000+ Indian pincodes. You can also pay via UPI QR to the delivery agent upon doorstep arrival."
  }
];

async function getLiveFaqs() {
  try {
    const { data, error } = await supabaseAdmin
      .from('faqs')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_FAQS;
    }
    return data;
  } catch (err) {
    console.warn('Fallback to static FAQs in SSR:', err);
    return DEFAULT_FAQS;
  }
}

export default async function FAQPage() {
  const faqs = await getLiveFaqs();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question || faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer || faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FAQClient initialFaqs={faqs} />
    </>
  );
}
