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
  locationAddress: string,
  within: string,
  q?: string
): Promise<any[]> {
  const params: Record<string, string> = {
    token: EVENTBRITE_TOKEN,
    "location.address": locationAddress,
    "location.within": within,
    expand: "venue,logo",
    "start_date.range_start":
      new Date().toISOString().slice(0, 10) + "T00:00:00",
    page_size: "50",
  };
  if (q) params.q = q;

  const response = await fetch(
    `https://www.eventbriteapi.com/v3/events/search?${new URLSearchParams(params)}`,
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
    // Fetch events from Zimbabwe (all local events) and UK (zimbabwe diaspora events)
    // Run sequentially so a failure in one gives a clearer error message
    let zimbabweEvents: any[] = [];
    let bulawayoEvents: any[] = [];
    let ukEvents: any[] = [];
    // No keyword filter for local Zimbabwe searches — find all events near Harare and Bulawayo
    try { zimbabweEvents = await searchEventbrite("Harare, Zimbabwe", "100km"); }
    catch (e: any) { console.error("Harare search failed:", e.message); }
    try { bulawayoEvents = await searchEventbrite("Bulawayo, Zimbabwe", "80km"); }
    catch (e: any) { console.error("Bulawayo search failed:", e.message); }
    // UK search uses "zimbabwe" keyword to find diaspora events
    try { ukEvents = await searchEventbrite("United Kingdom", "500km", "zimbabwe"); }
    catch (e: any) { console.error("UK search failed:", e.message); }

    // Deduplicate by Eventbrite ID before writing (Harare/Bulawayo may overlap)
    const seen = new Set<string>();
    const allEvents = [...zimbabweEvents, ...bulawayoEvents, ...ukEvents].filter(e => {
      if (!e.id || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

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
