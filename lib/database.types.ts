export type MembershipStatus = "pending" | "active" | "rejected";
export type VenueCategory = "restaurant" | "bar" | "cafe" | "experience";

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

export interface Redemption {
  id: string;
  member_id: string;
  venue_id: string;
  deal_id: string;
  redeemed_at: string;
}

