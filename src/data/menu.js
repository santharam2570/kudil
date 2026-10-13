export const BRAND = {
  name: 'Kudil Biryani',
  ta: 'குடில் பிரியாணி',
  tagline: 'Taste that stays with you…',
  promise: 'Good Food Brings People Together…',
  city: 'Trichy, Tamil Nadu',
  phone: '7708097333',
  phoneIntl: '917708097333',
  email: 'kudilbiriyani.trichy@gmail.com',
}

export const CATEGORIES = [
  { id: 'chicken', label: 'Chicken Biryani', ta: 'சிக்கன் பிரியாணி' },
  { id: 'mutton', label: 'Mutton Biryani', ta: 'மட்டன் பிரியாணி' },
  { id: 'sides', label: 'Additional Items', ta: 'கூடுதல் உணவுகள்' },
  { id: 'desserts', label: 'Desserts', ta: 'இனிப்புகள்' },
]

const TIERS = [
  { tier: 'Budget', taTier: 'பட்ஜெட்', rice: 'Thulasi Gold', variant: 0 },
  { tier: 'Premium', taTier: 'பிரீமியம்', rice: 'Kalyana Biryani', variant: 1 },
  { tier: 'Luxury', taTier: 'லக்ஸரி', rice: 'Pure Seeraga Samba', variant: 2 },
]

const chickenPrices = [1500, 1700, 2000]
const muttonPrices = [2750, 3000, 3600]

export const MENU = [
  ...TIERS.map((t, i) => ({
    id: `chicken-${t.tier.toLowerCase()}`,
    cat: 'chicken',
    name: `Chicken Biryani · ${t.tier} Pack`,
    ta: `சிக்கன் பிரியாணி · ${t.taTier}`,
    rice: t.rice,
    tier: t.tier,
    price: chickenPrices[i],
    unit: 'Padi',
    serves: '1 Padi ≈ 9 servings',
    details: ['10 chicken pieces (130g each)', 'Thalcha & Onion Raitha'],
    visual: 'handi-chicken',
    variant: t.variant,
  })),
  ...TIERS.map((t, i) => ({
    id: `mutton-${t.tier.toLowerCase()}`,
    cat: 'mutton',
    name: `Mutton Biryani · ${t.tier} Pack`,
    ta: `மட்டன் பிரியாணி · ${t.taTier}`,
    rice: t.rice,
    tier: t.tier,
    price: muttonPrices[i],
    unit: 'Padi',
    serves: '1 Padi ≈ 9 servings',
    details: ['Mutton pieces (1.5 kg)', 'Thalcha & Onion Raitha'],
    visual: 'handi-mutton',
    variant: t.variant,
  })),
  {
    id: 'chicken-65', cat: 'sides', name: 'Chicken 65', ta: 'சிக்கன் 65',
    price: 550, unit: 'kg', serves: 'Per 1 kg', details: ['Crispy, spicy, Trichy style'], visual: 'chicken65',
  },
  {
    id: 'chettinadu-gravy', cat: 'sides', name: 'Chettinadu Chicken Gravy', ta: 'செட்டிநாடு சிக்கன் கிரேவி',
    price: 600, unit: 'kg', serves: 'Per 1 kg', details: ['Freshly roasted Chettinadu masala'], visual: 'gravy-chettinad',
  },
  {
    id: 'pepper-gravy', cat: 'sides', name: 'Pepper Chicken Gravy', ta: 'பெப்பர் சிக்கன் கிரேவி',
    price: 650, unit: 'kg', serves: 'Per 1 kg', details: ['Crushed black pepper, curry leaves'], visual: 'gravy-pepper',
  },
  {
    id: 'kesari', cat: 'desserts', name: 'Kesari', ta: 'கேசரி',
    price: 300, unit: 'kg', serves: 'Per 1 kg', details: ['Ghee, cashew, saffron'], visual: 'kesari',
  },
  {
    id: 'bread-halwa', cat: 'desserts', name: 'Bread Halwa', ta: 'பிரெட் அல்வா',
    price: 400, unit: 'kg', serves: 'Per 1 kg', details: ['Wedding-style, rich & glossy'], visual: 'halwa',
  },
  {
    id: 'firni', cat: 'desserts', name: 'Firni', ta: 'பிர்னி',
    price: 600, unit: 'Litre', serves: 'Per 1 Litre', details: ['Chilled, cardamom & pista'], visual: 'firni',
  },
]

export const INGREDIENTS = [
  { ta: 'சீரக சம்பா அரிசி', en: 'Seeraga Samba Rice', note: 'Tiny fragrant grains from Thanjavur delta fields' },
  { ta: 'சின்ன வெங்காயம்', en: 'Small Onions', note: 'Shallots, hand-peeled every morning' },
  { ta: 'அரைத்த மசாலா', en: 'Stone-ground Masala', note: 'Ground on the ammi kal, never from a packet' },
  { ta: 'பட்டை · கிராம்பு · ஏலக்காய்', en: 'Cinnamon · Clove · Cardamom', note: 'Whole spices roasted in pure ghee' },
  { ta: 'புதினா · கொத்தமல்லி', en: 'Mint · Coriander', note: 'Fresh bunches from the Trichy market' },
  { ta: 'நெய்', en: 'Pure Ghee', note: 'The final pour before the dum seal' },
]

export const STEPS = [
  { n: '01', ta: 'மசாலா அரைப்பு', en: 'Grind', text: 'Amma grinds green chilli, ginger, garlic and mint on the ammi kal.' },
  { n: '02', ta: 'கறி வதக்கல்', en: 'Roast', text: 'The meat is sealed in ghee with shallots and our secret masala.' },
  { n: '03', ta: 'அரிசி சேர்த்தல்', en: 'Layer', text: 'Seeraga samba rice goes in. The water is measured by hand, not by cup.' },
  { n: '04', ta: 'தம் போடுதல்', en: 'Dum', text: 'The lid is sealed, coals go on top, and the biryani cooks slowly.' },
]

export const REVIEWS = [
  { name: 'Mr. Aswath', place: 'Mini Hall Catering', text: 'Guests asked for second helpings. The mutton was so tender it fell off the bone.' },
  { name: 'Lakshmi', place: 'Srirangam', text: 'Tastes like the biryani my patti used to make for festivals. Seeraga samba, done right.' },
  { name: 'Karthik', place: 'Thillai Nagar', text: 'Chicken 65 and the Chettinadu gravy were the stars of our office party.' },
]

export const formatINR = (n) => '₹' + n.toLocaleString('en-IN')
