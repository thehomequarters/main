export type MembershipStatus = "pending" | "active" | "rejected" | "suspended";
export type MembershipTier =
  | "gold_card"
  | "platinum_card"
  | "founding_member"
  | "committee_member";
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
  membership_tier: MembershipTier;
  created_at: string;
  // Social fields (set via profile editing)
  title: string | null;
  bio: string | null;
  city: string | null;
  industry: MemberIndustry | null;
  interests: string[];
  // Social handles
  instagram_handle: string | null;
  linkedin_handle: string | null;
  // Push notifications
  push_token: string | null;
  // Privacy settings (all default to false = visible)
  hide_city?: boolean;
  hide_industry?: boolean;
  hide_interests?: boolean;
  hide_social_links?: boolean;
  allow_messages?: "all" | "connections";
  // Nomination system
  vouchers: string[];        // UIDs of members who have vouched
  voucher_count: number;     // denormalised length of vouchers
  application_code: string;  // short code applicants share to collect vouches
  nominations_used: number;  // how many nominations this member has sent
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: "connection_request" | "connection_accepted" | "new_message" | "nomination_received" | "event_reminder" | "membership_approved" | "membership_suspended";
  title: string;
  body: string;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  author_id: string;
  author_name: string;
  author_initials: string;
  content: string;
  created_at: string;
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
  image_urls: string[] | null;    // up to 3 carousel images
  logo_url: string | null;        // venue logo shown as avatar; tap opens stories
  tags: string[] | null;          // cuisine/vibe tags e.g. ['Middle Eastern', 'Halal']
  opening_hours: string | null;   // e.g. "Mon2013Sat 12pm201310pm 00b7 Sun Closed"
  is_active: boolean;
  created_at: string;
}

export interface VenueStory {
  id: string;
  venue_id: string;
  media_url: string;
  media_type: "image" | "video";  // video requires expo-av in the app
  caption: string | null;
  order: number;
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
  link_url: string | null;        // optional external event page / ticketing URL
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
