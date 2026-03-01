import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const VENUES = [
  {
    name: "Chishuru",
    description:
      "Award-winning West African fine dining in Brixton. Chef Joké Bakare serves bold, inventive plates rooted in the flavours of Nigeria and across the continent.",
    category: "restaurant",
    city: "London",
    country: "United Kingdom",
    address: "388 Coldharbour Lane, Brixton",
    latitude: 51.4613,
    longitude: -0.1156,
    image_url:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    is_active: true,
  },
  {
    name: "Ikoyi",
    description:
      "Michelin-starred restaurant celebrating West African spices and ingredients through a modern tasting menu. A must-visit culinary experience.",
    category: "restaurant",
    city: "London",
    country: "United Kingdom",
    address: "1 St James's Market, St James's",
    latitude: 51.5085,
    longitude: -0.1339,
    image_url:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    is_active: true,
  },
  {
    name: "Tatale",
    description:
      "Plant-forward dining inspired by Ghanaian cuisine. Fresh, seasonal, and entirely unique — named after the beloved Ghanaian plantain pancake.",
    category: "restaurant",
    city: "London",
    country: "United Kingdom",
    address: "25 Lordship Lane, East Dulwich",
    latitude: 51.4551,
    longitude: -0.0767,
    image_url:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    is_active: true,
  },
  {
    name: "Sweetbean Coffee",
    description:
      "Specialty Ethiopian coffee roasters serving single-origin brews and homemade pastries in a warm, minimalist space.",
    category: "cafe",
    city: "London",
    country: "United Kingdom",
    address: "17 Peckham Rye, Peckham",
    latitude: 51.4693,
    longitude: -0.0693,
    image_url:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    is_active: true,
  },
  {
    name: "Kadie's Club",
    description:
      "A stylish cocktail lounge with live Afrobeats, jazz, and soul nights. Intimate setting, world-class cocktails, and a vibrant crowd.",
    category: "bar",
    city: "London",
    country: "United Kingdom",
    address: "22 Kingly Court, Carnaby",
    latitude: 51.5131,
    longitude: -0.1393,
    image_url:
      "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80",
    is_active: true,
  },
  {
    name: "TEN Lagos Bar",
    description:
      "Lagos-inspired cocktail bar bringing Nigerian nightlife energy to Shoreditch. Suya bites, Chapman cocktails, and Afrobeats on rotation.",
    category: "bar",
    city: "London",
    country: "United Kingdom",
    address: "10 Rivington Street, Shoreditch",
    latitude: 51.5265,
    longitude: -0.0793,
    image_url:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
    is_active: true,
  },
  {
    name: "Nok by Alara",
    description:
      "Contemporary pan-African cuisine in a beautifully designed space. From jollof arancini to plantain desserts — African flavours reimagined.",
    category: "restaurant",
    city: "London",
    country: "United Kingdom",
    address: "12 Upper St Martin's Lane, Covent Garden",
    latitude: 51.5128,
    longitude: -0.1266,
    image_url:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    is_active: true,
  },
  {
    name: "Jamii Wellness",
    description:
      "Holistic wellness studio offering yoga, breathwork, and sound healing sessions rooted in African and Eastern traditions. Community-centred healing.",
    category: "experience",
    city: "London",
    country: "United Kingdom",
    address: "44 Dalston Lane, Dalston",
    latitude: 51.5462,
    longitude: -0.0751,
    image_url:
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
    is_active: true,
  },
  {
    name: "Iya London",
    description:
      "All-day cafe and bakery serving Nigerian-inspired brunch, pastries, and specialty drinks. Think chin chin French toast and zobo mimosas.",
    category: "cafe",
    city: "London",
    country: "United Kingdom",
    address: "67 Atlantic Road, Brixton",
    latitude: 51.4617,
    longitude: -0.1148,
    image_url:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    is_active: true,
  },
  {
    name: "The Afrobeats Experience",
    description:
      "Monthly curated events featuring live Afrobeats, amapiano DJs, art showcases, and networking. The ultimate diaspora social experience.",
    category: "experience",
    city: "London",
    country: "United Kingdom",
    address: "Boxpark Croydon, 99 George St",
    latitude: 51.3762,
    longitude: -0.0987,
    image_url:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    is_active: true,
  },
];

const DEALS: Record<string, Array<{ title: string; description: string; terms: string }>> = {
  Chishuru: [
    {
      title: "Complimentary starter with any tasting menu",
      description: "Enjoy a free starter dish when you order the tasting menu.",
      terms: "Valid Mon-Thu. Cannot be combined with other offers.",
    },
    {
      title: "15% off your total bill",
      description: "Show your HQ membership card for 15% off food and drinks.",
      terms: "Valid for parties of up to 4. Excludes bank holidays.",
    },
  ],
  Ikoyi: [
    {
      title: "Complimentary welcome cocktail",
      description: "Start your evening with a signature cocktail, on the house.",
      terms: "One per member per visit. Must show HQ card.",
    },
  ],
  Tatale: [
    {
      title: "Free dessert with any main course",
      description: "End your meal with a complimentary dessert of your choice.",
      terms: "Valid all week. One per member per visit.",
    },
    {
      title: "2-for-1 brunch on weekends",
      description: "Bring a friend — the second brunch is on us.",
      terms: "Sat-Sun only, 10am-2pm. Booking required.",
    },
  ],
  "Sweetbean Coffee": [
    {
      title: "Free coffee upgrade",
      description: "Upgrade any drink to a large, free of charge.",
      terms: "Valid daily. One per visit.",
    },
    {
      title: "Buy 5 get 1 free loyalty perk",
      description: "Your 6th specialty coffee is complimentary.",
      terms: "Tracked via HQ app. Cannot combine with other loyalty cards.",
    },
  ],
  "Kadie's Club": [
    {
      title: "Skip the queue + free entry",
      description: "Priority entry and no cover charge for HQ members.",
      terms: "Valid Fri-Sat before midnight. Max 2 guests.",
    },
    {
      title: "25% off bottle service",
      description: "Quarter off any bottle when you book a table.",
      terms: "Must book 24h in advance. Subject to availability.",
    },
  ],
  "TEN Lagos Bar": [
    {
      title: "2-for-1 cocktails during happy hour",
      description: "Double up on cocktails from 5-8pm every day.",
      terms: "Valid Mon-Fri, 5-8pm only.",
    },
    {
      title: "Free suya platter with drinks",
      description: "Order 4+ drinks and get a suya platter on the house.",
      terms: "One per table per visit.",
    },
  ],
  "Nok by Alara": [
    {
      title: "10% off à la carte dining",
      description: "Enjoy a discount on the full à la carte menu.",
      terms: "Valid all week. Excludes set menus and special events.",
    },
  ],
  "Jamii Wellness": [
    {
      title: "First class free",
      description: "Try any yoga or breathwork class free of charge.",
      terms: "New members only. Book via HQ app.",
    },
    {
      title: "20% off monthly memberships",
      description: "Exclusive HQ rate on unlimited monthly classes.",
      terms: "Minimum 3 month commitment. Cancel anytime after.",
    },
  ],
  "Iya London": [
    {
      title: "Free pastry with any hot drink",
      description: "Choose any pastry when you order a coffee or chai.",
      terms: "Valid daily until 12pm. One per visit.",
    },
  ],
  "The Afrobeats Experience": [
    {
      title: "Free entry to all monthly events",
      description: "Skip the ticket — HQ members always enter free.",
      terms: "Must show HQ card at door. Non-transferable.",
    },
    {
      title: "VIP area access",
      description: "Exclusive access to the VIP lounge at every event.",
      terms: "Subject to capacity. Arrive before 10pm for guaranteed access.",
    },
  ],
};

export async function seedDatabase() {
  const venueIds: Record<string, string> = {};

  // Create venues
  for (const venue of VENUES) {
    const venueRef = doc(collection(db, "venues"));
    await setDoc(venueRef, {
      ...venue,
      created_at: new Date().toISOString(),
    });
    venueIds[venue.name] = venueRef.id;
  }

  // Create deals
  for (const [venueName, deals] of Object.entries(DEALS)) {
    const venueId = venueIds[venueName];
    if (!venueId) continue;

    for (const deal of deals) {
      const dealRef = doc(collection(db, "deals"));
      await setDoc(dealRef, {
        venue_id: venueId,
        title: deal.title,
        description: deal.description,
        terms: deal.terms,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  return Object.keys(venueIds).length;
}
