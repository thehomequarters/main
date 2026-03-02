export type EventCategory = "social" | "dining" | "wellness" | "music" | "arts";

export interface HQEvent {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  endTime: string;
  image_url: string;
  category: EventCategory;
  attendees: number;
  capacity: number;
  is_booked: boolean;
}

export const eventCategories: { key: EventCategory | null; label: string }[] = [
  { key: null, label: "All" },
  { key: "social", label: "Social" },
  { key: "dining", label: "Dining" },
  { key: "wellness", label: "Wellness" },
  { key: "music", label: "Music" },
  { key: "arts", label: "Arts" },
];

export const EVENTS: HQEvent[] = [
  {
    id: "evt-1",
    title: "Sundowner Sessions",
    description:
      "Weekly DJ set on the rooftop with Harare's finest selectors spinning Afrobeats, amapiano, and deep house as the sun goes down. Complimentary welcome drink for HQ members.",
    venue: "Pariah State",
    date: "2026-03-06",
    time: "17:00",
    endTime: "22:00",
    image_url:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    category: "music",
    attendees: 47,
    capacity: 80,
    is_booked: false,
  },
  {
    id: "evt-2",
    title: "Farm-to-Table Dinner",
    description:
      "An intimate five-course dinner showcasing the best seasonal produce from Zimbabwean farms. Chef Tari presents a menu that celebrates local flavours with modern technique.",
    venue: "Amanzi Restaurant",
    date: "2026-03-07",
    time: "19:00",
    endTime: "22:30",
    image_url:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    category: "dining",
    attendees: 22,
    capacity: 30,
    is_booked: true,
  },
  {
    id: "evt-3",
    title: "Morning Yoga in the Gardens",
    description:
      "Start your Saturday with a rejuvenating vinyasa flow session in the msasa woodland gardens. Mats provided. All levels welcome. Herbal tea served afterwards.",
    venue: "Maarera Wellness",
    date: "2026-03-07",
    time: "07:00",
    endTime: "08:30",
    image_url:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    category: "wellness",
    attendees: 14,
    capacity: 25,
    is_booked: false,
  },
  {
    id: "evt-4",
    title: "Creatives Connect Mixer",
    description:
      "Monthly networking mixer for HQ members in creative industries. Meet photographers, designers, musicians, and entrepreneurs over cocktails and canapés.",
    venue: "Shoko Festival Lounge",
    date: "2026-03-08",
    time: "18:00",
    endTime: "21:00",
    image_url:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
    category: "social",
    attendees: 35,
    capacity: 60,
    is_booked: false,
  },
  {
    id: "evt-5",
    title: "Wine & Canvas Night",
    description:
      "Guided painting session paired with South African wines. No experience needed — just bring your creativity. Take home your masterpiece at the end of the evening.",
    venue: "Pariah State",
    date: "2026-03-10",
    time: "18:30",
    endTime: "21:00",
    image_url:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80",
    category: "arts",
    attendees: 18,
    capacity: 25,
    is_booked: false,
  },
  {
    id: "evt-6",
    title: "Saturday Jazz Brunch",
    description:
      "Live jazz trio accompanies a lavish brunch spread featuring Zimbabwean and continental dishes. Free-flowing mimosas for HQ members.",
    venue: "Amanzi Restaurant",
    date: "2026-03-14",
    time: "10:00",
    endTime: "14:00",
    image_url:
      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80",
    category: "dining",
    attendees: 28,
    capacity: 50,
    is_booked: false,
  },
  {
    id: "evt-7",
    title: "Spoken Word Evening",
    description:
      "An evening of powerful spoken word performances from Zimbabwe's most exciting poets. Open mic slots available — sign up at the door.",
    venue: "Shoko Festival Lounge",
    date: "2026-03-14",
    time: "19:00",
    endTime: "22:00",
    image_url:
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80",
    category: "arts",
    attendees: 42,
    capacity: 70,
    is_booked: false,
  },
  {
    id: "evt-8",
    title: "HQ Members' Braai",
    description:
      "Our signature social braai bringing HQ members together for an afternoon of good food, good music, and great company. Families welcome.",
    venue: "The Sunday Market",
    date: "2026-03-15",
    time: "12:00",
    endTime: "17:00",
    image_url:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
    category: "social",
    attendees: 58,
    capacity: 100,
    is_booked: false,
  },
  {
    id: "evt-9",
    title: "Meditation & Sound Bath",
    description:
      "A deeply relaxing guided meditation followed by a crystal singing bowl sound bath. Release the stress of the week and find your centre.",
    venue: "Maarera Wellness",
    date: "2026-03-18",
    time: "18:00",
    endTime: "19:30",
    image_url:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    category: "wellness",
    attendees: 8,
    capacity: 20,
    is_booked: false,
  },
  {
    id: "evt-10",
    title: "Amapiano Night",
    description:
      "Harare's biggest amapiano night returns. Two rooms, four DJs, one unforgettable vibe. Dress code: smart casual. No cover for HQ members.",
    venue: "Shoko Festival Lounge",
    date: "2026-03-21",
    time: "21:00",
    endTime: "03:00",
    image_url:
      "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
    category: "music",
    attendees: 63,
    capacity: 120,
    is_booked: false,
  },
  {
    id: "evt-11",
    title: "Coffee Cupping Workshop",
    description:
      "Learn to taste and evaluate specialty Zimbabwean coffee with our head roaster. Discover the difference between Chipinge and Honde Valley beans.",
    venue: "Kaldora's Coffee",
    date: "2026-03-22",
    time: "09:00",
    endTime: "11:00",
    image_url:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    category: "dining",
    attendees: 10,
    capacity: 15,
    is_booked: false,
  },
  {
    id: "evt-12",
    title: "Photography Walk: Old Harare",
    description:
      "Guided photography walk through Harare's historic centre. Capture the architecture, street life, and hidden gems of the city with fellow creatives.",
    venue: "The Boma",
    date: "2026-03-28",
    time: "08:00",
    endTime: "11:00",
    image_url:
      "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80",
    category: "arts",
    attendees: 12,
    capacity: 20,
    is_booked: false,
  },
];

// Helper to get events for "This Week" and "This Month"
export function getThisWeekEvents(): HQEvent[] {
  return EVENTS.slice(0, 5);
}

export function getThisMonthEvents(): HQEvent[] {
  return EVENTS.slice(5);
}

export function getUpcomingEvents(count: number): HQEvent[] {
  return EVENTS.slice(0, count);
}
