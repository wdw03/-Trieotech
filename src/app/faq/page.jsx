import FAQClient from '../../components/static/FAQClient';

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

const FAQS = [
  {
    q: "Are all Trio Enterprises embroidery patches authentic handmade zardosi?",
    a: "Yes. Every patch in our collection is hand-stitched by skilled karigars using traditional wooden addas, genuine metallic bullion coils (zari), glass zarkans, and faux pearls. We do not sell flat machine-printed imitations."
  },
  {
    q: "How do I stitch or affix embroidery appliques to lehengas, dupattas, or blouses?",
    a: "Our applique patches feature reinforced backing that can easily be hand-stitched along the borders with a matching needle and thread, or fabric-glued using high-grade craft adhesive before fine edge stitching for permanent bridal wear."
  },
  {
    q: "Is your copper water bottle 100% pure copper?",
    a: "Yes. Our hammered and plain matte copper bottles are crafted from 100% lab-tested, food-grade pure copper without inner chemical lacquers or lead, ensuring optimal Ayurvedic Tamra Jal health benefits."
  },
  {
    q: "How long does domestic delivery take across India?",
    a: "All orders are dispatched within 24 business hours from our Jaipur craft center. Metro cities receive deliveries in 2-3 business days, while other locations take 3-5 days via BlueDart Air Express."
  },
  {
    q: "What is your return and replacement policy?",
    a: "We offer a 7-day doorstep replacement guarantee on all items. If an item arrives transit-damaged or differs from your expectations, contact our WhatsApp support at +91 98765 43210 for an instant replacement or full refund."
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Yes! Cash on Delivery is available across 19,000+ Indian pincodes. You can also pay via UPI QR to the delivery agent upon doorstep arrival."
  }
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
};

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FAQClient />
    </>
  );
}
