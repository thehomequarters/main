export type MemberIndustry =
  | "creative"
  | "tech"
  | "hospitality"
  | "music"
  | "business"
  | "wellness";

export interface MemberSuggestion {
  id: string;
  name: string;
  title: string;
  industry: MemberIndustry;
  city: string;
  interests: string[];
  initials: string;
  mutual_connections: number;
}

export const industryFilters: {
  key: MemberIndustry | null;
  label: string;
}[] = [
  { key: null, label: "All" },
  { key: "creative", label: "Creatives" },
  { key: "tech", label: "Tech" },
  { key: "hospitality", label: "Hospitality" },
  { key: "music", label: "Music" },
  { key: "business", label: "Business" },
];

export const MEMBERS: MemberSuggestion[] = [
  {
    id: "mem-1",
    name: "Tanya Moyo",
    title: "Photographer & Visual Artist",
    industry: "creative",
    city: "Harare",
    interests: ["Photography", "Film", "Art Direction"],
    initials: "TM",
    mutual_connections: 4,
  },
  {
    id: "mem-2",
    name: "Kuda Masiiwa",
    title: "Senior Software Developer",
    industry: "tech",
    city: "Harare",
    interests: ["Startups", "AI", "Design Systems"],
    initials: "KM",
    mutual_connections: 2,
  },
  {
    id: "mem-3",
    name: "Nyasha Tafirenyika",
    title: "Brand Strategist",
    industry: "business",
    city: "Harare",
    interests: ["Branding", "Startups", "Public Speaking"],
    initials: "NT",
    mutual_connections: 6,
  },
  {
    id: "mem-4",
    name: "Rudo Chikanza",
    title: "Marketing Director at OMG Zim",
    industry: "business",
    city: "Harare",
    interests: ["Marketing", "Events", "Wine"],
    initials: "RC",
    mutual_connections: 3,
  },
  {
    id: "mem-5",
    name: "Farai Nhamo",
    title: "Events Producer & DJ",
    industry: "music",
    city: "Harare",
    interests: ["Amapiano", "Events", "Nightlife"],
    initials: "FN",
    mutual_connections: 8,
  },
  {
    id: "mem-6",
    name: "Chenai Mutasa",
    title: "Interior Designer",
    industry: "creative",
    city: "Harare",
    interests: ["Design", "Architecture", "Sustainability"],
    initials: "CM",
    mutual_connections: 1,
  },
  {
    id: "mem-7",
    name: "Tatenda Chigorimbo",
    title: "Head Chef at The Boma",
    industry: "hospitality",
    city: "Harare",
    interests: ["Cuisine", "Local Produce", "Sustainability"],
    initials: "TC",
    mutual_connections: 5,
  },
  {
    id: "mem-8",
    name: "Rufaro Manyika",
    title: "Yoga Instructor & Wellness Coach",
    industry: "wellness",
    city: "Harare",
    interests: ["Yoga", "Meditation", "Nutrition"],
    initials: "RM",
    mutual_connections: 3,
  },
  {
    id: "mem-9",
    name: "Simba Karumazondo",
    title: "Music Producer",
    industry: "music",
    city: "Harare",
    interests: ["Production", "Afrobeats", "Collaboration"],
    initials: "SK",
    mutual_connections: 7,
  },
  {
    id: "mem-10",
    name: "Tsitsi Banda",
    title: "UX Designer at Econet",
    industry: "tech",
    city: "Harare",
    interests: ["UX Design", "Prototyping", "User Research"],
    initials: "TB",
    mutual_connections: 4,
  },
  {
    id: "mem-11",
    name: "Mandla Ncube",
    title: "Boutique Hotel Owner",
    industry: "hospitality",
    city: "Harare",
    interests: ["Travel", "Hospitality", "Wine"],
    initials: "MN",
    mutual_connections: 2,
  },
  {
    id: "mem-12",
    name: "Tariro Chawatama",
    title: "Filmmaker & Screenwriter",
    industry: "creative",
    city: "Harare",
    interests: ["Film", "Storytelling", "Music Videos"],
    initials: "TC",
    mutual_connections: 5,
  },
];
