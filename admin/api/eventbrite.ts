import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}

const db = getFirestore();
const EVENTBRITE_TOKEN = process.env.EVENTBRITE_API_KEY ?? "";

async function searchEventbrite(
  q: string,
  locationAddress: string,
  within: string
): Promise<any[]> {
  const params = new URLSearchParams({
    token: EVENTBRITE_TOKEN,
    q,
    "location.address": locationAddress,
    "location.within": within,
    expand: "venue,logo",
    "start_date.range_start":
      new Date().toISOString().slice(0, 10) + "T00:00:00",
    page_size: "50",
  });

  const response = await fetch(
    `https://www.eventbriteapi.com/v3/events/search?${params}`,
    { headers: { Authorization: `Bearer ${EVENTBRITE_TOKEN}` } }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Eventbrite ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.events ?? [];
}

function parseLocalDateTime(local: string): { date: string; time: string } {
  // local is like "2025-06-15T19:00:00"
  if (!local) return { date: "", time: "" };
  return {
    date: local.slice(0, 10),
    time: local.slice(11, 16),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  if (!EVENTBRITE_TOKEN)
    return res
      .status(500)
      .json({ error: "EVENTBRITE_API_KEY is not configured" });

  try {
    // Fetch events from Zimbabwe and UK simultaneously
    // Run sequentially so a failure in one gives a clearer error message
    let zimbabweEvents: any[] = [];
    let ukEvents: any[] = [];
    try { zimbabweEvents = await searchEventbrite("zimbabwe", "Zimbabwe", "1000km"); }
    catch (e: any) { console.error("Zimbabwe search failed:", e.message); }
    try { ukEvents = await searchEventbrite("zimbabwe", "United Kingdom", "500km"); }
    catch (e: any) { console.error("UK search failed:", e.message); }

    const allEvents = [...zimbabweEvents, ...ukEvents];

    // Load existing eventbrite IDs to avoid duplicates
    const existingSnap = await db
      .collection("event_imports")
      .where("source", "==", "eventbrite")
      .get();
    const existingIds = new Set<string>(
      existingSnap.docs.map((d) => d.data().eventbrite_id as string)
    );

    let staged = 0;
    for (const event of allEvents) {
      const eventId = event.id as string;
      if (!eventId || existingIds.has(eventId)) continue;

      const { date, time: startTime } = parseLocalDateTime(
        event.start?.local ?? ""
      );
      const { time: endTime } = parseLocalDateTime(event.end?.local ?? "");

      await db.collection("event_imports").add({
        title: event.name?.text ?? "",
        description: (event.description?.text ?? "").slice(0, 2000),
        venue: event.venue?.name ?? "",
        venue_address:
          event.venue?.address?.localized_address_display ?? "",
        city: event.venue?.address?.city ?? "",
        country: event.venue?.address?.country ?? "",
        date,
        time: startTime,
        end_time: endTime,
        image_url: event.logo?.url ?? event.logo?.original?.url ?? "",
        link_url: event.url ?? "",
        category: "social",
        capacity: typeof event.capacity === "number" ? event.capacity : 50,
        source: "eventbrite",
        eventbrite_id: eventId,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      existingIds.add(eventId);
      staged++;
    }

    return res.status(200).json({
      staged,
      total: allEvents.length,
    });
  } catch (e: any) {
    console.error("Eventbrite pull error:", e);
    return res
      .status(500)
      .json({ error: e.message ?? "Failed to fetch from Eventbrite" });
  }
}
