import React, { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useToast } from "../components/Toast";

interface HeroContent {
  eyebrow: string;
  headline_line1: string;
  headline_line2: string;
  body: string;
}

interface FeatureContent {
  headline: string;
  p1: string;
  p2: string;
}

interface WebsiteContent {
  hero: HeroContent;
  feature1: FeatureContent;
  feature2: FeatureContent;
  feature3: FeatureContent;
  partners: string[];
  lifestyle_images: string[];
  screenshots: string[];
}

const DEFAULT_CONTENT: WebsiteContent = {
  hero: {
    eyebrow: "A private members' community",
    headline_line1: "Built for the diaspora.",
    headline_line2: "By invitation only.",
    body: "HomeQuarters brings together a curated community of Zimbabweans in the UK. Membership is by invitation from a current member. Applications are rarely considered.",
  },
  feature1: {
    headline: "Discover exclusive deals at top UK venues.",
    p1: "Access members-only pricing at restaurants, bars, and lounges across the UK.",
    p2: "Exceptional offers you won't find anywhere else — from dozens of top-tier venues.",
  },
  feature2: {
    headline: "Membership is by invitation.",
    p1: "Access to HomeQuarters requires a personal invitation from a current member. Invitations are non-transferable and strictly confidential.",
    p2: "On rare occasions, outstanding applications without a code are reviewed. If you believe you're a fit, you're welcome to apply below.",
  },
  feature3: {
    headline: "Access restaurants, clubs, and more with Platinum.",
    p1: "Upgrade to Platinum for £15/mo. For members heading back to Zimbabwe — unlock the best of Harare.",
    p2: "It's optional and you can cancel anytime.",
  },
  partners: [
    "Venue One", "The Grand", "Harare Club", "Meikles", "Borrowdale",
    "The Boma", "Amanzi", "Avondale", "Nomad", "Circa",
    "Veranda", "The Tap", "Zim Lounge", "HQ Bar", "Members Co.",
  ],
  lifestyle_images: [],
  screenshots: [],
};

type Tab = "hero" | "features" | "partners" | "media";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-gray-600 text-xs uppercase tracking-wider block mb-1">{children}</label>;
}

function Field({ label, value, onChange, rows }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const cls = "w-full bg-black border border-dark-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold/50";
  return (
    <div>
      <Label>{label}</Label>
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={`${cls} resize-none`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}

function ImageList({
  label,
  hint,
  images,
  onChange,
}: {
  label: string;
  hint: string;
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const [newUrl, setNewUrl] = useState("");

  const add = () => {
    const url = newUrl.trim();
    if (!url) return;
    onChange([...images, url]);
    setNewUrl("");
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div>
      <Label>{label}</Label>
      <p className="text-gray-600 text-xs mb-3">{hint}</p>
      <div className="space-y-2 mb-3">
        {images.length === 0 && (
          <p className="text-gray-700 text-xs italic py-2">No images yet.</p>
        )}
        {images.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-14 h-10 rounded-lg bg-dark border border-dark-border overflow-hidden flex-shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <p className="flex-1 text-gray-400 text-xs font-mono truncate">{url}</p>
            <button
              onClick={() => remove(i)}
              className="text-red-400 hover:text-red-300 text-xs flex-shrink-0 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="https://… image URL"
          className="flex-1 bg-black border border-dark-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold/50"
        />
        <button
          onClick={add}
          className="px-4 py-2.5 bg-gold-light border border-gold/25 text-gold text-sm font-bold rounded-xl hover:bg-gold/20 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function CMS() {
  const { toast } = useToast();
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("hero");
  const [newPartner, setNewPartner] = useState("");

  useEffect(() => {
    getDoc(doc(db, "website_content", "main")).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<WebsiteContent>;
        setContent({
          hero: { ...DEFAULT_CONTENT.hero, ...data.hero },
          feature1: { ...DEFAULT_CONTENT.feature1, ...data.feature1 },
          feature2: { ...DEFAULT_CONTENT.feature2, ...data.feature2 },
          feature3: { ...DEFAULT_CONTENT.feature3, ...data.feature3 },
          partners: data.partners ?? DEFAULT_CONTENT.partners,
          lifestyle_images: data.lifestyle_images ?? [],
          screenshots: data.screenshots ?? [],
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "website_content", "main"), content, { merge: true });
      toast("Website content saved");
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const setHero = (key: keyof HeroContent, val: string) =>
    setContent((c) => ({ ...c, hero: { ...c.hero, [key]: val } }));

  const setFeature = (f: "feature1" | "feature2" | "feature3", key: keyof FeatureContent, val: string) =>
    setContent((c) => ({ ...c, [f]: { ...c[f], [key]: val } }));

  const addPartner = () => {
    const p = newPartner.trim();
    if (!p) return;
    setContent((c) => ({ ...c, partners: [...c.partners, p] }));
    setNewPartner("");
  };

  const removePartner = (i: number) =>
    setContent((c) => ({ ...c, partners: c.partners.filter((_, idx) => idx !== i) }));

  const TABS: { key: Tab; label: string }[] = [
    { key: "hero", label: "Hero" },
    { key: "features", label: "Features" },
    { key: "partners", label: "Partners" },
    { key: "media", label: "Media" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Website CMS</h1>
          <p className="text-gray-500 text-sm mt-1">
            Edit copy and images on <span className="text-gray-400">thehomequarters.com</span>
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-gold text-black font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-border pb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-gold-light text-gold border border-gold/25"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-dark border border-dark-border rounded-2xl p-6 space-y-5 max-w-2xl">

        {/* HERO TAB */}
        {tab === "hero" && (
          <>
            <Field label="Eyebrow text" value={content.hero.eyebrow} onChange={(v) => setHero("eyebrow", v)} />
            <Field label="Headline — Line 1" value={content.hero.headline_line1} onChange={(v) => setHero("headline_line1", v)} />
            <Field label="Headline — Line 2 (gold italic)" value={content.hero.headline_line2} onChange={(v) => setHero("headline_line2", v)} />
            <Field label="Body copy" value={content.hero.body} onChange={(v) => setHero("body", v)} rows={3} />
          </>
        )}

        {/* FEATURES TAB */}
        {tab === "features" && (
          <>
            {(["feature1", "feature2", "feature3"] as const).map((f, i) => (
              <div key={f} className="border border-dark-border rounded-xl p-4 space-y-3">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Feature {i + 1}</p>
                <Field label="Headline" value={content[f].headline} onChange={(v) => setFeature(f, "headline", v)} />
                <Field label="Paragraph 1" value={content[f].p1} onChange={(v) => setFeature(f, "p1", v)} rows={2} />
                <Field label="Paragraph 2" value={content[f].p2} onChange={(v) => setFeature(f, "p2", v)} rows={2} />
              </div>
            ))}
          </>
        )}

        {/* PARTNERS TAB */}
        {tab === "partners" && (
          <>
            <p className="text-gray-500 text-sm">Partner venue names shown in the grid on the website.</p>
            <div className="space-y-1.5">
              {content.partners.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-black/40 border border-dark-border rounded-lg px-3 py-2">
                  <span className="text-gray-400 text-xs text-right w-5 flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 text-white text-sm">{p}</span>
                  <button
                    onClick={() => removePartner(i)}
                    className="text-red-400 hover:text-red-300 text-xs transition-colors flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newPartner}
                onChange={(e) => setNewPartner(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPartner()}
                placeholder="Add a venue name"
                className="flex-1 bg-black border border-dark-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gold/50"
              />
              <button
                onClick={addPartner}
                className="px-4 py-2.5 bg-gold-light border border-gold/25 text-gold text-sm font-bold rounded-xl hover:bg-gold/20 transition-colors"
              >
                Add
              </button>
            </div>
          </>
        )}

        {/* MEDIA TAB */}
        {tab === "media" && (
          <>
            <ImageList
              label="Lifestyle Images"
              hint="Full-width lifestyle photos shown in the gallery section on the website."
              images={content.lifestyle_images}
              onChange={(imgs) => setContent((c) => ({ ...c, lifestyle_images: imgs }))}
            />
            <div className="border-t border-dark-border pt-5">
              <ImageList
                label="App Screenshots"
                hint="Phone mockup screenshots shown alongside feature descriptions."
                images={content.screenshots}
                onChange={(imgs) => setContent((c) => ({ ...c, screenshots: imgs }))}
              />
            </div>
          </>
        )}

      </div>

      {/* Save reminder */}
      <p className="text-gray-700 text-xs mt-4">
        Changes are saved to Firestore and update the live website within seconds.
      </p>
    </div>
  );
}
