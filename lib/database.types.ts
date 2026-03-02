export type MembershipStatus = "pending" | "active" | "rejected" | "suspended";
export type VenueCategory = "restaurant" | "bar" | "cafe" | "experience";
export type EventCategory = "social" | "dining" | "wellness" | "music" | "arts";
export type PostTopic =
  | "collaboration"
  | "flat-swap"
  | "meetup"
  | "general"
  | "recommendation";
export type ConnectionStatus = "pending" | "accepted" | "rejected";
export type MemberIndustry =
  | "creative"
  | "tech"
  | "hospitality"
  | "music"
  | "business"
  | "wellness";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  member_code: string;
  membership_status: MembershipStatus;
  created_at: string;
  // Social fields (set via profile editing)
  title: string | null;
  bio: string | null;
  city: string | null;
  industry: MemberIndustry | null;
  interests: string[];
  // Push notifications
  push_token: string | null;
}

export interface Invite {
  id: string;
  code: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  used: boolean;
  used_by: string | null;
  used_at: string | null;
  note: string | null;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  category: VenueCategory;
  city: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  menu_url: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Deal {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  terms: string | null;
  is_active: boolean;
  created_at: string;
}

export interface HQEvent {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  time: string;
  end_time: string;
  image_url: string;
  category: EventCategory;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  member_id: string;
  event_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_initials: string;
  author_title: string;
  author_city: string;
  content: string;
  topic: PostTopic;
  color: string;
  image_url: string | null;
  likes: number;
  comments: number;
  created_at: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  member_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_initials: string;
  content: string;
  created_at: string;
}

export interface Connection {
  id: string;
  from_id: string;
  to_id: string;
  status: ConnectionStatus;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  member_id: string;
  joined_at: string;
}

export interface Redemption {
  id: string;
  member_id: string;
  venue_id: string;
  deal_id: string;
  redeemed_at: string;
}

export interface Conversation {
  id: string;
  participants: [string, string];
  participant_names: Record<string, string>;
  participant_initials: Record<string, string>;
  last_message: string;
  last_message_at: string;
  last_sender_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_initials: string;
  text: string;
  image_url: string | null;
  created_at: string;
}
