import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const VENUES = [
  {
    name: "The Boma",
    description:
      "Iconic Harare restaurant serving traditional Zimbabwean cuisine with a modern twist. Known for their sadza ne nyama, oxtail stew, and rooftop views of the city.",
    category: "restaurant",
    city: "Harare",
    country: "Zimbabwe",
    address: "5 Livingstone Avenue, Harare CBD",
    latitude: -17.8292,
    longitude: 31.0522,
    phone: "+263 242 700 100",
    menu_url: "https://theboma.co.zw/menu",
    image_url:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    is_active: true,
  },
  {
    name: "Amanzi Restaurant",
    description:
      "Upscale pan-African dining in the heart of Borrowdale. Fresh farm-to-table ingredients, an exceptional wine list, and live jazz on weekends.",
    category: "restaurant",
    city: "Harare",
    country: "Zimbabwe",
    address: "22 Borrowdale Road, Borrowdale",
    latitude: -17.7734,
    longitude: 31.0853,
    phone: "+263 242 882 441",
    menu_url: "https://amanzi.co.zw/menu",
    image_url:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    is_active: true,
  },
  {
    name: "Pariah State",
    description:
      "Harare's coolest cocktail bar and creative hub. Craft cocktails, local art on the walls, and a killer weekend DJ lineup spinning Afrobeats and amapiano.",
    category: "bar",
    city: "Harare",
    country: "Zimbabwe",
    address: "14 Sam Nujoma Street, Avondale",
    latitude: -17.7944,
    longitude: 31.0397,
    phone: "+263 77 234 5678",
    menu_url: null,
    image_url:
      "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80",
    is_active: true,
  },
  {
    name: "Gava's Restaurant",
    description:
      "A Harare institution for over two decades. Serving generous portions of traditional Shona dishes alongside South African braai platters in a warm, family-friendly setting.",
    category: "restaurant",
    city: "Harare",
    country: "Zimbabwe",
    address: "8 Mazowe Street, Harare CBD",
    latitude: -17.8316,
    longitude: 31.0485,
    phone: "+263 242 751 000",
    menu_url: "https://gavas.co.zw/menu",
    image_url:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    is_active: true,
  },
  {
    name: "Kaldora's Coffee",
    description:
      "Specialty Zimbabwean coffee roasters in Avondale. Single-origin beans from Chipinge and Honde Valley, homemade scones, and a quiet courtyard perfect for work.",
    category: "cafe",
    city: "Harare",
    country: "Zimbabwe",
    address: "3 King George Road, Avondale",
    latitude: -17.7978,
    longitude: 31.0409,
    phone: "+263 71 456 7890",
    menu_url: null,
    image_url:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
    is_active: true,
  },
  {
    name: "Shoko Festival Lounge",
    description:
      "Year-round creative space and bar inspired by the famous SHOKO Festival. Live music, spoken word, and Harare's most eclectic cocktail menu.",
    category: "bar",
    city: "Harare",
    country: "Zimbabwe",
    address: "17 Fife Avenue, Harare",
    latitude: -17.8172,
    longitude: 31.0459,
    phone: "+263 77 567 8901",
    menu_url: null,
    image_url:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
    is_active: true,
  },
  {
    name: "Chang Thai",
    description:
      "Harare's favourite Thai restaurant. Authentic flavours, fresh ingredients, and a serene garden setting in the heart of Borrowdale.",
    category: "restaurant",
    city: "Harare",
    country: "Zimbabwe",
    address: "Sam Levy's Village, Borrowdale",
    latitude: -17.7716,
    longitude: 31.0910,
    phone: "+263 242 885 600",
    menu_url: "https://changthai.co.zw/menu",
    image_url:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    is_active: true,
  },
  {
    name: "Maarera Wellness",
    description:
      "Holistic wellness studio offering yoga, meditation, and traditional healing sessions. Find your balance in a beautiful Msasa woodland setting.",
    category: "experience",
    city: "Harare",
    country: "Zimbabwe",
    address: "45 Enterprise Road, Highlands",
    latitude: -17.8100,
    longitude: 31.0780,
    phone: "+263 71 890 1234",
    menu_url: null,
    image_url:
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
    is_active: true,
  },
  {
    name: "Vibe Cafe",
    description:
      "All-day brunch spot and bakery in Avondale. Fresh juices, stuffed croissants, and the best flat white in Harare. A must for weekend mornings.",
    category: "cafe",
    city: "Harare",
    country: "Zimbabwe",
    address: "12 Maasdorp Avenue, Avondale",
    latitude: -17.7963,
    longitude: 31.0371,
    phone: "+263 77 321 6540",
    menu_url: null,
    image_url:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    is_active: true,
  },
  {
    name: "The Sunday Market",
    description:
      "Weekly curated market with live music, food trucks, local designers, and craft beer. Every Sunday at Borrowdale Racecourse — the place to be.",
    category: "experience",
    city: "Harare",
    country: "Zimbabwe",
    address: "Borrowdale Racecourse, Borrowdale",
    latitude: -17.7680,
    longitude: 31.0925,
    phone: "+263 77 999 0000",
    menu_url: null,
    image_url:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    is_active: true,
  },
];

const DEALS: Record<
  string,
  Array<{ title: string; description: string; terms: string }>
> = {
  "The Boma": [
    {
      title: "Complimentary starter with any main",
      description:
        "Enjoy a free traditional starter when you order any main course.",
      terms: "Valid Mon-Thu. Cannot be combined with other offers.",
    },
    {
      title: "15% off your total bill",
      description: "Show your HQ membership card for 15% off food and drinks.",
      terms: "Valid for parties of up to 4. Excludes public holidays.",
    },
  ],
  "Amanzi Restaurant": [
    {
      title: "Complimentary welcome cocktail",
      description:
        "Start your evening with a signature cocktail, on the house.",
      terms: "One per member per visit. Must show HQ card.",
    },
    {
      title: "20% off Saturday jazz brunch",
      description: "Exclusive HQ discount on the popular Saturday brunch.",
      terms: "Booking required. Valid Saturdays 10am-2pm.",
    },
  ],
  "Pariah State": [
    {
      title: "2-for-1 cocktails at happy hour",
      description: "Double up on craft cocktails from 5-8pm every day.",
      terms: "Valid Mon-Fri, 5-8pm only.",
    },
    {
      title: "Free entry to all DJ nights",
      description: "Skip the cover charge for all weekend events.",
      terms: "Must show HQ card at door. Max 2 guests.",
    },
  ],
  "Gava's Restaurant": [
    {
      title: "Free dessert with any main course",
      description: "End your meal with a complimentary dessert of your choice.",
      terms: "Valid all week. One per member per visit.",
    },
    {
      title: "2-for-1 lunch special",
      description: "Bring a friend — the second lunch main is on us.",
      terms: "Mon-Fri only, 11:30am-2:30pm. Booking required.",
    },
  ],
  "Kaldora's Coffee": [
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
  "Shoko Festival Lounge": [
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
  "Chang Thai": [
    {
      title: "10% off the full menu",
      description: "Enjoy a discount on all à la carte dishes.",
      terms: "Valid all week. Excludes set menus and special events.",
    },
  ],
  "Maarera Wellness": [
    {
      title: "First class free",
      description: "Try any yoga or meditation class free of charge.",
      terms: "New members only. Book via HQ app.",
    },
    {
      title: "20% off monthly memberships",
      description: "Exclusive HQ rate on unlimited monthly classes.",
      terms: "Minimum 3 month commitment. Cancel anytime after.",
    },
  ],
  "Vibe Cafe": [
    {
      title: "Free pastry with any hot drink",
      description: "Choose any pastry when you order a coffee or tea.",
      terms: "Valid daily until 12pm. One per visit.",
    },
  ],
  "The Sunday Market": [
    {
      title: "Free entry to all Sunday events",
      description: "Skip the gate fee — HQ members always enter free.",
      terms: "Must show HQ card at gate. Non-transferable.",
    },
    {
      title: "VIP lounge access",
      description:
        "Exclusive access to the shaded VIP area with seating and bar.",
      terms: "Subject to capacity. Arrive before 11am for guaranteed access.",
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
