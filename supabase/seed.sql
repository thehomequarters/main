-- HomeQuarters Seed Data
-- 15 Real Harare Venues with Deals
-- Run this in the Supabase SQL Editor after the migration

-- Restaurants
INSERT INTO venues (name, description, category, city, country, address, latitude, longitude, image_url) VALUES
(
  'The Brasserie',
  'Fine dining in the heart of Harare. Modern African cuisine with European influences in an elegant setting.',
  'restaurant',
  'Harare',
  'Zimbabwe',
  'Meikles Hotel, Jason Moyo Avenue',
  -17.8292,
  31.0522,
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'
),
(
  'Amanzi Restaurant',
  'Sophisticated waterside dining with a menu that celebrates Zimbabwean produce. A destination for those who appreciate exceptional food.',
  'restaurant',
  'Harare',
  'Zimbabwe',
  'Sam Levy''s Village, Borrowdale',
  -17.7698,
  31.0836,
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'
),
(
  'Sabai Thai',
  'Authentic Thai cuisine served in a tranquil garden setting. The finest Southeast Asian dining experience in Harare.',
  'restaurant',
  'Harare',
  'Zimbabwe',
  '22 Orange Grove Drive, Highlands',
  -17.8052,
  31.0780,
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80'
),
(
  'Victoria 22',
  'Contemporary fine dining with a focus on locally sourced ingredients. An intimate, refined atmosphere.',
  'restaurant',
  'Harare',
  'Zimbabwe',
  '22 Victoria Drive, Newlands',
  -17.8015,
  31.0550,
  'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80'
),
(
  'Garwe Restaurant',
  'Celebrating Zimbabwean flavours with a modern twist. Traditional dishes reimagined for the contemporary palate.',
  'restaurant',
  'Harare',
  'Zimbabwe',
  'Arundel Village, Mount Pleasant',
  -17.7902,
  31.0490,
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'
),

-- Bars
(
  'Keg and Maiden',
  'Craft cocktails and an impressive wine list in a moody, sophisticated space. The place to be seen after dark.',
  'bar',
  'Harare',
  'Zimbabwe',
  'Sam Levy''s Village, Borrowdale',
  -17.7700,
  31.0840,
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80'
),
(
  'Tin Roof',
  'Rooftop bar with panoramic city views. Premium spirits and a curated cocktail menu in an open-air setting.',
  'bar',
  'Harare',
  'Zimbabwe',
  'Joina City, Jason Moyo Avenue',
  -17.8305,
  31.0498,
  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80'
),
(
  'Jazz 105',
  'Live jazz, smooth cocktails, and late-night elegance. An intimate venue for music lovers and night owls.',
  'bar',
  'Harare',
  'Zimbabwe',
  '105 Enterprise Road, Highlands',
  -17.8110,
  31.0680,
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80'
),
(
  'The Rabbit Hole',
  'Speakeasy-style cocktail bar hidden behind an unmarked door. Intimate, exclusive, and unforgettable.',
  'bar',
  'Harare',
  'Zimbabwe',
  'Avondale Shopping Centre',
  -17.7958,
  31.0355,
  'https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=800&q=80'
),

-- Cafes
(
  'Vibe Cafe',
  'Specialty coffee and artisanal pastries in a minimalist space. The morning ritual for those with taste.',
  'cafe',
  'Harare',
  'Zimbabwe',
  'Borrowdale Road, Borrowdale',
  -17.7750,
  31.0790,
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'
),
(
  'Pariah State',
  'Third-wave coffee culture meets Harare energy. Single-origin beans, pour-overs, and a carefully curated space.',
  'cafe',
  'Harare',
  'Zimbabwe',
  '14 Cork Road, Avondale',
  -17.7945,
  31.0380,
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80'
),
(
  'The Courtyard Cafe',
  'A quiet escape in the city. Brunch, fresh juices, and exceptional coffee in a sun-dappled courtyard.',
  'cafe',
  'Harare',
  'Zimbabwe',
  'Strathaven Shopping Centre',
  -17.8175,
  31.0625,
  'https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=800&q=80'
),

-- Experiences
(
  'Mukuvisi Woodlands',
  'Guided nature walks through indigenous woodland. Encounter giraffes, zebras, and wildebeest minutes from the city centre.',
  'experience',
  'Harare',
  'Zimbabwe',
  'Hillside Road, Hillside',
  -17.8340,
  31.0760,
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80'
),
(
  'National Gallery of Zimbabwe',
  'World-class collection of Zimbabwean and African contemporary art. Exhibitions that challenge and inspire.',
  'experience',
  'Harare',
  'Zimbabwe',
  '20 Julius Nyerere Way',
  -17.8268,
  31.0475,
  'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&q=80'
),
(
  'Dombotembo Nights',
  'Curated evening experiences celebrating Zimbabwean music, food, and culture. An unforgettable night of connection.',
  'experience',
  'Harare',
  'Zimbabwe',
  'Various locations, Harare',
  -17.8200,
  31.0530,
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80'
);

-- Deals for each venue

-- The Brasserie
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'The Brasserie'), '20% off your bill', 'Valid on food and beverages for the table.', 'Cannot be combined with other offers. Valid for up to 6 guests.'),
((SELECT id FROM venues WHERE name = 'The Brasserie'), 'Complimentary welcome cocktail', 'A signature cocktail on arrival for each HQ member at the table.', 'One per member per visit.');

-- Amanzi Restaurant
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Amanzi Restaurant'), '15% off dinner', 'Valid on all dinner menu items.', 'Dine-in only. Excludes special events.'),
((SELECT id FROM venues WHERE name = 'Amanzi Restaurant'), 'Free dessert with every main', 'Choose any dessert from the menu when ordering a main course.', 'One dessert per main ordered.');

-- Sabai Thai
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Sabai Thai'), '20% off food', 'Valid on all food items.', 'Dine-in only. Up to 4 guests.');

-- Victoria 22
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Victoria 22'), 'Complimentary bottle of wine', 'A bottle of house wine with any dinner booking for 2 or more.', 'Reservation required. Subject to availability.'),
((SELECT id FROM venues WHERE name = 'Victoria 22'), '25% off tasting menu', 'On the chef''s 5-course tasting experience.', 'Must be booked 24 hours in advance.');

-- Garwe Restaurant
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Garwe Restaurant'), '15% off your total bill', 'Valid on food and non-alcoholic beverages.', 'Dine-in only. Not valid on public holidays.');

-- Keg and Maiden
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Keg and Maiden'), '2-for-1 cocktails', 'Buy one cocktail, get one free from the signature menu.', 'Valid Sunday to Thursday. Max 4 cocktails per visit.'),
((SELECT id FROM venues WHERE name = 'Keg and Maiden'), '20% off bar tab', 'On all drinks when spending over $30.', 'Cannot be combined with 2-for-1 offer.');

-- Tin Roof
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Tin Roof'), 'Complimentary welcome drink', 'Any standard cocktail, beer, or glass of wine on arrival.', 'One per member per visit.');

-- Jazz 105
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Jazz 105'), 'Free entry on live music nights', 'Skip the queue and cover charge on all live performance evenings.', 'Must show QR code at the door.'),
((SELECT id FROM venues WHERE name = 'Jazz 105'), '15% off drinks', 'Valid on all beverages throughout the evening.', 'Valid on live music nights only.');

-- The Rabbit Hole
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'The Rabbit Hole'), 'Priority reservation', 'Guaranteed table booking with 24 hours notice, even on busy nights.', 'Subject to capacity. Booking required.'),
((SELECT id FROM venues WHERE name = 'The Rabbit Hole'), '20% off cocktails', 'On the full cocktail menu.', 'Valid any night. Max party of 6.');

-- Vibe Cafe
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Vibe Cafe'), 'Free coffee upgrade', 'Any coffee upgraded to a large at no extra cost.', 'One per visit. Valid on hot drinks only.');

-- Pariah State
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Pariah State'), '20% off any order', 'Valid on all food and coffee.', 'Dine-in and takeaway. One redemption per day.');

-- The Courtyard Cafe
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'The Courtyard Cafe'), 'Complimentary pastry with any coffee', 'Choose any pastry from the counter with your coffee order.', 'One per member per visit. While stocks last.');

-- Mukuvisi Woodlands
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Mukuvisi Woodlands'), 'Free guided walk for 2', 'Complimentary guided nature walk for the member and one guest.', 'Advance booking required. Subject to availability.');

-- National Gallery of Zimbabwe
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'National Gallery of Zimbabwe'), 'Free entry for member + guest', 'Complimentary admission for the member and one companion.', 'Valid during regular opening hours.'),
((SELECT id FROM venues WHERE name = 'National Gallery of Zimbabwe'), '10% off gallery shop', 'Discount on all items in the gallery gift shop.', 'Excludes limited edition prints.');

-- Dombotembo Nights
INSERT INTO deals (venue_id, title, description, terms) VALUES
((SELECT id FROM venues WHERE name = 'Dombotembo Nights'), 'VIP access to all events', 'Priority entry and reserved seating at all Dombotembo events.', 'Must register via the Dombotembo events page.'),
((SELECT id FROM venues WHERE name = 'Dombotembo Nights'), '20% off event tickets', 'Discount on standard ticket prices for all upcoming events.', 'Cannot be combined with early bird pricing.');
