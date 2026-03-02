export type PostTopic =
  | "collaboration"
  | "flat-swap"
  | "meetup"
  | "general"
  | "recommendation";

export interface PostAuthor {
  name: string;
  title: string;
  initials: string;
  city: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  topic: PostTopic;
  likes: number;
  comments: number;
  created_at: string;
  color: string;
}

export const topicLabels: Record<PostTopic, string> = {
  collaboration: "Collaboration",
  "flat-swap": "Flat Swap",
  meetup: "Meetup",
  general: "General",
  recommendation: "Recommendation",
};

export const topicColors: Record<PostTopic, string> = {
  collaboration: "#C9A84C",
  "flat-swap": "#4ECDC4",
  meetup: "#FF6B6B",
  general: "#A0A0A0",
  recommendation: "#7B68EE",
};

export const POSTS: Post[] = [
  {
    id: "post-1",
    author: {
      name: "Tanya Moyo",
      title: "Photographer & Visual Artist",
      initials: "TM",
      city: "Harare",
    },
    content:
      "Looking for a creative collaborator for a photography series documenting Harare's music scene. Need someone with video editing skills — happy to share credits and revenue. DM me if interested!",
    topic: "collaboration",
    likes: 24,
    comments: 8,
    created_at: "2h ago",
    color: "#C9A84C",
  },
  {
    id: "post-2",
    author: {
      name: "James Okonkwo",
      title: "Architect",
      initials: "JO",
      city: "London",
    },
    content:
      "London ↔ Harare flat swap anyone? I have a 1-bed in Shoreditch available 15-30 March. Looking for somewhere in Borrowdale or Avondale. Professional, non-smoker, tidy.",
    topic: "flat-swap",
    likes: 31,
    comments: 12,
    created_at: "4h ago",
    color: "#4ECDC4",
  },
  {
    id: "post-3",
    author: {
      name: "Rudo Chikanza",
      title: "Marketing Director",
      initials: "RC",
      city: "Harare",
    },
    content:
      "Heading to Pariah State this Friday for the Sundowner Sessions. Who's coming? Let's get a big HQ table going — the more the merrier. Drop a comment if you're in!",
    topic: "meetup",
    likes: 45,
    comments: 19,
    created_at: "5h ago",
    color: "#FF6B6B",
  },
  {
    id: "post-4",
    author: {
      name: "Kuda Masiiwa",
      title: "Software Developer",
      initials: "KM",
      city: "Harare",
    },
    content:
      "Just moved back to Harare after 5 years in Cape Town. Excited to reconnect with the creative scene here. Looking to meet other tech and design people — coffee this week?",
    topic: "general",
    likes: 38,
    comments: 15,
    created_at: "8h ago",
    color: "#A0A0A0",
  },
  {
    id: "post-5",
    author: {
      name: "Nyasha Tafirenyika",
      title: "Brand Strategist",
      initials: "NT",
      city: "Harare",
    },
    content:
      "Running a free workshop on personal branding for creatives next week at Shoko. Limited to 20 people. HQ members get priority. Who's interested?",
    topic: "collaboration",
    likes: 52,
    comments: 23,
    created_at: "12h ago",
    color: "#C9A84C",
  },
  {
    id: "post-6",
    author: {
      name: "Chenai Mutasa",
      title: "Interior Designer",
      initials: "CM",
      city: "Harare",
    },
    content:
      "Best coffee spots in Borrowdale? Just moved to the area and need my morning fix sorted. Bonus points if they have good wifi for working!",
    topic: "recommendation",
    likes: 16,
    comments: 22,
    created_at: "1d ago",
    color: "#7B68EE",
  },
  {
    id: "post-7",
    author: {
      name: "Tapiwa Murisa",
      title: "Graphic Designer",
      initials: "TM",
      city: "Harare",
    },
    content:
      "Need a graphic designer for an event poster? I'm offering discounted rates for fellow HQ members this month. Portfolio in my profile — check it out.",
    topic: "collaboration",
    likes: 19,
    comments: 7,
    created_at: "1d ago",
    color: "#C9A84C",
  },
  {
    id: "post-8",
    author: {
      name: "Farai Nhamo",
      title: "Events Producer",
      initials: "FN",
      city: "Harare",
    },
    content:
      "Anyone else heading to The Sunday Market this weekend? Planning to check out the new food truck section. Let's meet at the VIP lounge around 11am.",
    topic: "meetup",
    likes: 27,
    comments: 11,
    created_at: "2d ago",
    color: "#FF6B6B",
  },
];
