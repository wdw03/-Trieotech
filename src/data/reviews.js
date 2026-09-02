export const reviews = [
  {
    id: 1,
    productId: 101,
    user: "Sunita Sharma",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    date: "18 August 2026",
    title: "Mesmerizing Shreenathji work! Superior craftsmanship",
    comment: "I used these patches for my daughter's wedding lehenga border. The stone shine and gold zardosi embroidery are exceptionally royal. 10/10 recommend Trio Ecart!",
    helpful: 28,
    verified: true,
    location: "Jaipur, Rajasthan"
  },
  {
    id: 2,
    productId: 102,
    user: "Ananya Iyer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    date: "22 August 2026",
    title: "Pure Ayurvedic copper and stunning hammered finish",
    comment: "Water tastes incredibly fresh when kept overnight in this copper bottle. The craftsmanship feels heavy and authentic, not like thin imitation metal.",
    helpful: 19,
    verified: true,
    location: "Bengaluru, Karnataka"
  },
  {
    id: 3,
    productId: 103,
    user: "Vikram Rathore",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    date: "25 August 2026",
    title: "Magnificent Pooja Thali for Diwali",
    comment: "The red velvet lining with solid brass diyas creates a divine aarti experience in our home mandir. Fast delivery and safe thermocol packaging.",
    helpful: 34,
    verified: true,
    location: "Udaipur, Rajasthan"
  },
  {
    id: 4,
    productId: 1,
    user: "Pooja Verma",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    date: "14 August 2026",
    title: "Pearl zardosi patches look breathtaking on dupattas",
    comment: "The pack of 20 applique patches was evenly stitched with glittering moti work. Added so much richness to my boutique blouses.",
    helpful: 15,
    verified: true,
    location: "Varanasi, UP"
  },
  {
    id: 5,
    productId: 14,
    user: "Deepak Mehra",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    rating: 5,
    date: "10 August 2026",
    title: "Pure soft desi cotton gamcha for rituals",
    comment: "Very high absorption and soft on the skin. We ordered 10 pieces for our family havan ritual. Authentic traditional quality.",
    helpful: 12,
    verified: true,
    location: "Haridwar, Uttarakhand"
  }
];

export const getReviewsByProductId = (productId) => {
  return reviews.filter(r => r.productId === Number(productId));
};

export default reviews;
