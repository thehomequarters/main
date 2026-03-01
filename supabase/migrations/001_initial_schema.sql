-- HomeQuarters Database Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE membership_status AS ENUM ('pending', 'active', 'rejected');
CREATE TYPE venue_category AS ENUM ('restaurant', 'bar', 'cafe', 'experience');

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  member_code TEXT UNIQUE NOT NULL,
  membership_status membership_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Venues table
CREATE TABLE venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category venue_category NOT NULL,
  city TEXT NOT NULL DEFAULT 'Harare',
  country TEXT NOT NULL DEFAULT 'Zimbabwe',
  address TEXT NOT NULL DEFAULT '',
  latitude FLOAT DEFAULT 0,
  longitude FLOAT DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Deals table
CREATE TABLE deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  venue_id UUID REFERENCES venues ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  terms TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Redemptions table
CREATE TABLE redemptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals ON DELETE CASCADE NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Row Level Security

-- Profiles: users can read their own profile, verification page needs public read of limited fields
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can verify members by member_code"
  ON profiles FOR SELECT
  USING (true);

-- Venues: all authenticated users can read active venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active venues"
  ON venues FOR SELECT
  USING (is_active = true);

-- Deals: all authenticated users can read active deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active deals"
  ON deals FOR SELECT
  USING (is_active = true);

-- Redemptions: users can read and create their own redemptions
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own redemptions"
  ON redemptions FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "Users can create own redemptions"
  ON redemptions FOR INSERT
  WITH CHECK (auth.uid() = member_id);

-- Indexes
CREATE INDEX idx_venues_category ON venues(category);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_deals_venue_id ON deals(venue_id);
CREATE INDEX idx_redemptions_member_id ON redemptions(member_id);
CREATE INDEX idx_profiles_member_code ON profiles(member_code);
