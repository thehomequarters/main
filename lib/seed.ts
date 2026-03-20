import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { EventCategory, PostTopic } from "./database.types";

const VENUES = [
  {
    name: "The Boma",
    description:
      "Iconic restaurant serving traditional Southern African cuisine with a modern twist. Known for their slow-cooked stews, grilled meats, and rooftop views of the city.",
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
    homeland_tags: ["Zimbabwe", "Southern Africa"],
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
    homeland_tags: ["Zimbabwe", "South Africa", "Southern Africa"],
  },
  {
    name: "Pariah State",
    description:
      "A vibrant cocktail bar and creative hub. Craft cocktails, local art on the walls, and a killer weekend DJ lineup spinning Afrobeats and amapiano.",
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
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    name: "Gava's Restaurant",
    description:
      "A warm institution for over two decades. Generous portions of traditional Southern African dishes in a family-friendly setting beloved by the community.",
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
    homeland_tags: ["Zimbabwe", "South Africa"],
  },
  {
    name: "Kaldora's Coffee",
    description:
      "Specialty coffee roasters sourcing single-origin beans from across the continent. Homemade scones and a quiet courtyard — the perfect spot for work.",
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
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    name: "Shoko Festival Lounge",
    description:
      "Year-round creative space and bar celebrating global music culture. Live music, spoken word, and an eclectic cocktail menu that keeps the crowd coming back.",
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
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    name: "Chang Thai",
    description:
      "A favourite Thai restaurant bringing authentic South-East Asian flavours. Fresh ingredients and a serene garden setting — always a reliable choice.",
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
    homeland_tags: [],
  },
  {
    name: "Maarera Wellness",
    description:
      "Holistic wellness studio offering yoga, meditation, and healing sessions. Find your balance in a serene woodland setting away from the city noise.",
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
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    name: "Vibe Cafe",
    description:
      "All-day brunch spot and bakery. Fresh juices, stuffed croissants, and a flat white that regulars swear by. A must for weekend mornings.",
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
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    name: "The Sunday Market",
    description:
      "Weekly curated market with live music, food trucks, local designers, and craft beer. Every Sunday — the place to be for the whole community.",
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
    homeland_tags: ["Zimbabwe", "Southern Africa"],
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

const EVENTS: Array<{
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  end_time: string;
  image_url: string;
  category: EventCategory;
  capacity: number;
  homeland_tags: string[];
}> = [
  {
    title: "Sundowner Sessions",
    description:
      "Weekly DJ set on the rooftop with selectors spinning Afrobeats, amapiano, and deep house as the sun goes down. Complimentary welcome drink for HQ members.",
    venue: "Pariah State",
    date: "2026-03-06",
    time: "17:00",
    end_time: "22:00",
    image_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    category: "music",
    capacity: 80,
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    title: "Farm-to-Table Dinner",
    description:
      "An intimate five-course dinner showcasing the best seasonal produce from local farms. A menu that celebrates regional flavours with modern technique.",
    venue: "Amanzi Restaurant",
    date: "2026-03-07",
    time: "19:00",
    end_time: "22:30",
    image_url:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    category: "dining",
    capacity: 30,
    homeland_tags: ["Zimbabwe", "South Africa"],
  },
  {
    title: "Morning Yoga in the Gardens",
    description:
      "Start your Saturday with a rejuvenating vinyasa flow session in the woodland gardens. Mats provided. All levels welcome. Herbal tea served afterwards.",
    venue: "Maarera Wellness",
    date: "2026-03-07",
    time: "07:00",
    end_time: "08:30",
    image_url:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    category: "wellness",
    capacity: 25,
    homeland_tags: [],
  },
  {
    title: "Creatives Connect Mixer",
    description:
      "Monthly networking mixer for HQ members in creative industries. Meet photographers, designers, musicians, and entrepreneurs over cocktails and canapés.",
    venue: "Shoko Festival Lounge",
    date: "2026-03-08",
    time: "18:00",
    end_time: "21:00",
    image_url:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
    category: "social",
    capacity: 60,
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    title: "Wine & Canvas Night",
    description:
      "Guided painting session paired with curated wines. No experience needed — just bring your creativity. Take home your masterpiece at the end of the evening.",
    venue: "Pariah State",
    date: "2026-03-10",
    time: "18:30",
    end_time: "21:00",
    image_url:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
    category: "arts",
    capacity: 25,
    homeland_tags: [],
  },
  {
    title: "Saturday Jazz Brunch",
    description:
      "Live jazz trio accompanies a lavish brunch spread featuring local and continental dishes. Free-flowing mimosas for HQ members.",
    venue: "Amanzi Restaurant",
    date: "2026-03-14",
    time: "10:00",
    end_time: "14:00",
    image_url:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80",
    category: "dining",
    capacity: 50,
    homeland_tags: ["Zimbabwe", "South Africa"],
  },
  {
    title: "Spoken Word Evening",
    description:
      "An evening of powerful spoken word performances from the community's most exciting poets. Open mic slots available — sign up at the door.",
    venue: "Shoko Festival Lounge",
    date: "2026-03-14",
    time: "19:00",
    end_time: "22:00",
    image_url:
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80",
    category: "arts",
    capacity: 70,
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    title: "HQ Members' Braai",
    description:
      "Our signature social bringing HQ members together for an afternoon of good food, good music, and great company. All are welcome.",
    venue: "The Sunday Market",
    date: "2026-03-15",
    time: "12:00",
    end_time: "17:00",
    image_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
    category: "social",
    capacity: 100,
    homeland_tags: ["Zimbabwe", "South Africa"],
  },
  {
    title: "Meditation & Sound Bath",
    description:
      "A deeply relaxing guided meditation followed by a crystal singing bowl sound bath. Release the stress of the week and find your centre.",
    venue: "Maarera Wellness",
    date: "2026-03-18",
    time: "18:00",
    end_time: "19:30",
    image_url:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    category: "wellness",
    capacity: 20,
    homeland_tags: [],
  },
  {
    title: "Amapiano Night",
    description:
      "The diaspora's favourite party night returns. Two rooms, four DJs, one unforgettable vibe. Dress code: smart casual. No cover for HQ members.",
    venue: "Shoko Festival Lounge",
    date: "2026-03-21",
    time: "21:00",
    end_time: "03:00",
    image_url:
      "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
    category: "music",
    capacity: 120,
    homeland_tags: ["Zimbabwe", "South Africa"],
  },
  {
    title: "Coffee Cupping Workshop",
    description:
      "Learn to taste and evaluate specialty African coffee with our head roaster. Discover the difference between single-origin beans from different regions.",
    venue: "Kaldora's Coffee",
    date: "2026-03-22",
    time: "09:00",
    end_time: "11:00",
    image_url:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    category: "dining",
    capacity: 15,
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
  {
    title: "Photography Walk: City Centre",
    description:
      "Guided photography walk through the city's historic centre. Capture the architecture, street life, and hidden gems with fellow creatives.",
    venue: "The Boma",
    date: "2026-03-28",
    time: "08:00",
    end_time: "11:00",
    image_url:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80",
    category: "arts",
    capacity: 20,
    homeland_tags: ["Zimbabwe", "Southern Africa"],
  },
];

const SEED_POSTS: Array<{
  author_name: string;
  author_initials: string;
  author_title: string;
  author_city: string;
  content: string;
  topic: PostTopic;
  color: string;
  likes: number;
  comments: number;
}> = [
  {
    author_name: "Tanya Moyo",
    author_initials: "TM",
    author_title: "Photographer & Visual Artist",
    author_city: "London",
    content:
      "Looking for a creative collaborator for a photography series documenting diaspora music scenes across Europe. Need someone with video editing skills — happy to share credits and revenue. DM me if interested!",
    topic: "collaboration",
    color: "#C9A84C",
    likes: 24,
    comments: 8,
  },
  {
    author_name: "James Okonkwo",
    author_initials: "JO",
    author_title: "Architect",
    author_city: "London",
    content:
      "London ↔ Harare flat swap anyone? I have a 1-bed in Shoreditch available 15-30 March. Looking for somewhere in Borrowdale or Avondale. Professional, non-smoker, tidy.",
    topic: "flat-swap",
    color: "#4ECDC4",
    likes: 31,
    comments: 12,
  },
  {
    author_name: "Rudo Chikanza",
    author_initials: "RC",
    author_title: "Marketing Director",
    author_city: "Harare",
    content:
      "Heading to Pariah State this Friday for the Sundowner Sessions. Who's coming? Let's get a big HQ table going — the more the merrier. Drop a comment if you're in!",
    topic: "meetup",
    color: "#FF6B6B",
    likes: 45,
    comments: 19,
  },
  {
    author_name: "Kuda Masiiwa",
    author_initials: "KM",
    author_title: "Software Developer",
    author_city: "Amsterdam",
    content:
      "Just moved to Amsterdam after years in London. Excited to reconnect with the diaspora community here. Looking to meet other tech and design people — coffee this week?",
    topic: "general",
    color: "#A0A0A0",
    likes: 38,
    comments: 15,
  },
  {
    author_name: "Nyasha Tafirenyika",
    author_initials: "NT",
    author_title: "Brand Strategist",
    author_city: "Johannesburg",
    content:
      "Running a free workshop on personal branding for creatives next week. Limited to 20 people. HQ members get priority. Who's interested?",
    topic: "collaboration",
    color: "#C9A84C",
    likes: 52,
    comments: 23,
  },
  {
    author_name: "Adaeze Obi",
    author_initials: "AO",
    author_title: "Interior Designer",
    author_city: "Lagos",
    content:
      "Best coffee spots in your city for remote work? Building a list of HQ-approved spaces around the world. Drop your faves below!",
    topic: "recommendation",
    color: "#7B68EE",
    likes: 16,
    comments: 22,
  },
  {
    author_name: "Tapiwa Murisa",
    author_initials: "TM",
    author_title: "Graphic Designer",
    author_city: "Toronto",
    content:
      "Need a graphic designer for an event poster? I'm offering discounted rates for fellow HQ members this month. Portfolio in my profile — check it out.",
    topic: "collaboration",
    color: "#C9A84C",
    likes: 19,
    comments: 7,
  },
  {
    author_name: "Farai Nhamo",
    author_initials: "FN",
    author_title: "Events Producer",
    author_city: "Harare",
    content:
      "Anyone else heading to The Sunday Market this weekend? Planning to check out the new food truck section. Let's meet at the VIP lounge around 11am.",
    topic: "meetup",
    color: "#FF6B6B",
    likes: 27,
    comments: 11,
  },
];

const GROUPS = [
  {
    name: "Creatives Hub",
    description: "A space for photographers, designers, artists, and filmmakers to connect and collaborate.",
    icon: "brush-outline",
    member_count: 234,
  },
  {
    name: "Foodies Club",
    description: "Discover the best food spots, share recipes, and organise dinners together.",
    icon: "restaurant-outline",
    member_count: 187,
  },
  {
    name: "Tech & Startups",
    description: "For developers, founders, and tech enthusiasts building the future.",
    icon: "code-slash-outline",
    member_count: 156,
  },
  {
    name: "Wellness Circle",
    description: "Yoga, meditation, fitness, and mental health conversations.",
    icon: "leaf-outline",
    member_count: 98,
  },
  {
    name: "Music Scene",
    description: "From amapiano to jazz — connect with musicians, DJs, and music lovers.",
    icon: "musical-notes-outline",
    member_count: 312,
  },
  {
    name: "Flat Swaps",
    description: "Coordinate home swaps with members in cities around the world.",
    icon: "home-outline",
    member_count: 76,
  },
];

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

  // Create events
  for (const event of EVENTS) {
    const eventRef = doc(collection(db, "events"));
    await setDoc(eventRef, {
      ...event,
      is_active: true,
      created_at: new Date().toISOString(),
    });
  }

  // Create posts (with placeholder author_id — these are community seed posts)
  for (const post of SEED_POSTS) {
    const postRef = doc(collection(db, "posts"));
    await setDoc(postRef, {
      ...post,
      author_id: "seed",
      created_at: new Date().toISOString(),
    });
  }

  // Create groups
  for (const group of GROUPS) {
    const groupRef = doc(collection(db, "groups"));
    await setDoc(groupRef, {
      ...group,
      created_at: new Date().toISOString(),
    });
  }

  return Object.keys(venueIds).length;
}
