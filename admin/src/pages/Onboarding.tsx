import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";
import { isValidImageUrl } from "../utils/validateImageUrl";

interface OnboardingSlide {
  id: string;
  image_url: string;
  eyebrow: string;
  title: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  image_url: "",
  eyebrow: "",
  title: "",
  order: 0,
};

export default function Onboarding() {
  const { toast } = useToast();
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<OnboardingSlide | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string; onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });
  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));
  const [previewIndex, setPreviewIndex] = useState(0);

  // Welcome back splash config
  const [splashUrl, setSplashUrl] = useState("");
  const [splashInput, setSplashInput] = useState("");
  const [splashSaving, setSplashSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "app_settings", "welcome_splash")).then((snap) => {
      if (snap.exists()) {
        const url = snap.data().image_url as string;
        setSplashUrl(url);
        setSplashInput(url);
      }
    });
  }, []);

  const handleSaveSplash = async () => {
    if (!splashInput.trim() || !isValidImageUrl(splashInput)) return;
    setSplashSaving(true);
    try {
      await setDoc(doc(db, "app_settings", "welcome_splash"), {
        image_url: splashInput.trim(),
        updated_at: new Date().toISOString(),
      });
      setSplashUrl(splashInput.trim());
      toast("Welcome splash updated");
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSplashSaving(false);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "onboarding_slides"),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as OnboardingSlide)
          .sort((a, b) => a.order - b.order);
        setSlides(data);
        setLoading(false);
      },
      (err) => {
        console.error("onboarding_slides snapshot error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const openAdd = () => {
    setEditingSlide(null);
    setForm({ ...EMPTY_FORM, order: slides.length });
    setShowForm(true);
  };

  const openEdit = (slide: OnboardingSlide) => {
    setEditingSlide(slide);
    setForm({
      image_url: slide.image_url,
      eyebrow: slide.eyebrow,
      title: slide.title,
      order: slide.order,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.image_url.trim() || !form.title.trim()) return;
    if (!isValidImageUrl(form.image_url)) return;
    setSaving(true);
    try {
      const data = {
        image_url: form.image_url.trim(),
        eyebrow: form.eyebrow.trim().toUpperCase(),
        title: form.title.trim(),
        order: Number(form.order),
        is_active: true,
      };
      if (editingSlide) {
        await updateDoc(doc(db, "onboarding_slides", editingSlide.id), data);
        toast("Slide updated");
      } else {
        await addDoc(collection(db, "onboarding_slides"), {
          ...data,
          created_at: new Date().toISOString(),
        });
        toast("Slide added");
      }
      setShowForm(false);
      setEditingSlide(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      console.error(e);
      toast("Failed to save slide", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (slide: OnboardingSlide) => {
    try {
      await updateDoc(doc(db, "onboarding_slides", slide.id), {
        is_active: !slide.is_active,
      });
      toast(slide.is_active ? "Slide hidden" : "Slide shown");
    } catch {
      toast("Failed to update slide", "error");
    }
  };

  const handleDelete = (slide: OnboardingSlide) => {
    setConfirmState({
      open: true,
      title: "Delete slide",
      message: `Delete slide "${slide.title}"? This cannot be undone.`,
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteDoc(doc(db, "onboarding_slides", slide.id));
          toast("Slide deleted");
        } catch {
          toast("Failed to delete slide", "error");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel="Delete"
        danger
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <div>

        {/* Welcome Back Splash config */}
        <div className="bg-dark border border-dark-border rounded-2xl p-5 mb-8">
          <div className="mb-4">
            <h2 className="text-white font-bold text-base">Welcome Back Splash</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Full-screen image shown to members immediately after signing in.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Image URL
              </label>
              <input
                value={splashInput}
                onChange={(e) => setSplashInput(e.target.value)}
                placeholder="https://images.unsplash.com/…"
                className={`w-full bg-black border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 ${
                  splashInput && !isValidImageUrl(splashInput)
                    ? "border-red-500/50"
                    : "border-dark-border"
                }`}
              />
              {splashInput && !isValidImageUrl(splashInput) && (
                <p className="text-red-400 text-xs mt-1">Must be a valid https:// image URL</p>
              )}
            </div>
            {splashInput && isValidImageUrl(splashInput) && (
              <img
                src={splashInput}
                alt="splash preview"
                className="w-full h-28 object-cover rounded-xl border border-dark-border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <div className="flex items-center justify-between gap-3">
              {splashUrl ? (
                <p className="text-gray-600 text-xs truncate flex-1">
                  Current: <span className="text-gray-500">{splashUrl}</span>
                </p>
              ) : (
                <p className="text-gray-600 text-xs flex-1">No custom image set — app uses built-in default.</p>
              )}
              <button
                onClick={handleSaveSplash}
                disabled={splashSaving || !splashInput.trim() || !isValidImageUrl(splashInput) || splashInput === splashUrl}
                className="flex-shrink-0 px-5 py-2.5 bg-gold text-black font-bold text-xs rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-40"
              >
                {splashSaving ? "Saving…" : "Save Image"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Onboarding Slides</h1>
            <p className="text-gray-500 text-sm mt-1">
              Splash page images shown to new users · {slides.filter((s) => s.is_active).length} active
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-gold text-black font-bold text-sm rounded-xl hover:bg-gold/90 transition-colors"
          >
            + Add Slide
          </button>
        </div>

        {/* Notice */}
        <div className="bg-dark border border-dark-border rounded-2xl p-4 mb-6 flex gap-3 items-start">
          <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-gray-400 text-xs leading-relaxed">
            Slides are fetched live by the app. Changes take effect immediately — no app update needed.
            Use <span className="text-white font-semibold">Order</span> to control the sequence (lower = first).
            If no slides are active, the app falls back to the built-in defaults.
          </p>
        </div>

        {/* Slide form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-dark border border-dark-border rounded-2xl w-full max-w-md p-6">
              <h2 className="text-white text-lg font-bold mb-4">
                {editingSlide ? "Edit Slide" : "New Slide"}
              </h2>

              <div className="space-y-3">
                {/* Image URL */}
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Image URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/…"
                    className={`w-full bg-black border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 ${
                      form.image_url && !isValidImageUrl(form.image_url)
                        ? "border-red-500/50"
                        : "border-dark-border"
                    }`}
                  />
                  {form.image_url && !isValidImageUrl(form.image_url) && (
                    <p className="text-red-400 text-xs mt-1">Must be a valid https:// image URL</p>
                  )}
                  {/* Preview */}
                  {form.image_url && isValidImageUrl(form.image_url) && (
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="mt-2 w-full h-36 object-cover rounded-xl border border-dark-border"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>

                {/* Eyebrow */}
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Eyebrow text (small label above title)
                  </label>
                  <input
                    value={form.eyebrow}
                    onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
                    placeholder="e.g. WELCOME TO"
                    className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Home\nQuarters (use \n for line breaks)"
                    className="w-full bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                  <p className="text-gray-600 text-xs mt-1">Use \n for a line break in the title</p>
                </div>

                {/* Order */}
                <div>
                  <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                    Order (0 = first)
                  </label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                    className="w-24 bg-black border border-dark-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowForm(false); setEditingSlide(null); }}
                  className="flex-1 px-4 py-3 border border-dark-border text-gray-400 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.image_url.trim() || !form.title.trim() || !isValidImageUrl(form.image_url)}
                  className="flex-1 px-4 py-3 bg-gold text-black rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingSlide ? "Update" : "Add Slide"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slide list + phone preview */}
        {slides.length === 0 ? (
          <div className="bg-dark border border-dark-border rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-sm">No slides yet. Add one to override the app defaults.</p>
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-6 items-start">

            {/* Slide list */}
            <div className="flex-1 space-y-3 min-w-0">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                onClick={() => setPreviewIndex(idx)}
                className={`bg-dark border rounded-2xl overflow-hidden flex flex-col md:flex-row gap-0 cursor-pointer transition-colors ${
                  previewIndex === idx
                    ? "border-gold/40"
                    : slide.is_active
                    ? "border-dark-border hover:border-white/15"
                    : "border-red-500/20 opacity-60"
                }`}
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full md:w-32 h-40 md:h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23111'/%3E%3Ctext x='12' y='16' font-size='8' fill='%23555' text-anchor='middle'%3ENo image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>

                {/* Info + actions */}
                <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gold-light text-gold">
                        #{slide.order}
                      </span>
                      {!slide.is_active && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/15 text-red-400">
                          Hidden
                        </span>
                      )}
                    </div>
                    {slide.eyebrow && (
                      <p className="text-gold text-xs font-semibold uppercase tracking-widest mt-2">
                        {slide.eyebrow}
                      </p>
                    )}
                    <p className="text-white font-bold text-base mt-0.5 whitespace-pre-line">
                      {slide.title}
                    </p>
                    <p className="text-gray-600 text-xs mt-1 truncate">{slide.image_url}</p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => openEdit(slide)}
                      className="px-3 py-2 text-gold text-xs border border-gold/25 rounded-xl hover:bg-gold-light transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(slide)}
                      className="px-3 py-2 text-gray-400 hover:text-white text-xs border border-dark-border rounded-xl transition-colors"
                    >
                      {slide.is_active ? "Hide" : "Show"}
                    </button>
                    <button
                      onClick={() => handleDelete(slide)}
                      className="px-3 py-2 text-red-400 text-xs border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Phone mockup */}
            {(() => {
              const slide = slides[previewIndex] ?? slides[0];
              const isLast = previewIndex === slides.length - 1;
              const title = slide.title.replace(/\\n/g, "\n");
              return (
                <div className="xl:sticky xl:top-6 flex-shrink-0 flex flex-col items-center gap-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    Preview — slide {previewIndex + 1} of {slides.length}
                  </p>

                  {/* Phone shell */}
                  <div
                    className="relative rounded-[40px] overflow-hidden border-[3px] border-white/10"
                    style={{ width: 260, height: 520 }}
                  >
                    {/* Background image */}
                    <img
                      src={slide.image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Dark overlay */}
                    <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />

                    {/* HQ wordmark */}
                    <div className="absolute top-8 left-6">
                      <span className="text-white font-bold text-sm tracking-[6px]">HQ</span>
                    </div>

                    {/* Text block */}
                    <div className="absolute left-6 right-10" style={{ bottom: 148 }}>
                      {slide.eyebrow && (
                        <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3" style={{ color: "#C9A84C" }}>
                          {slide.eyebrow}
                        </p>
                      )}
                      <p className="text-white font-bold leading-tight whitespace-pre-line" style={{ fontSize: 32, lineHeight: "38px" }}>
                        {title}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-7 pt-3 flex flex-col items-stretch gap-2.5">
                      {/* Dot indicators */}
                      <div className="flex justify-center gap-1.5 mb-1">
                        {slides.map((_, i) => (
                          <div
                            key={i}
                            className="rounded-full transition-all"
                            style={{
                              height: 1.5,
                              width: i === previewIndex ? 22 : 10,
                              background: i === previewIndex ? "#fff" : "rgba(255,255,255,0.3)",
                            }}
                          />
                        ))}
                      </div>

                      {/* Primary pill */}
                      <div
                        className="rounded-full flex items-center justify-center py-1.5"
                        style={{ background: "#F2EBE0" }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: "#0A0A0A" }}>
                          {isLast ? "Join HomeQuarters" : "Next"}
                        </span>
                      </div>

                      {/* Sign in pill */}
                      <div
                        className="rounded-full flex items-center justify-center py-1.5"
                        style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                      >
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                          Already a member? Sign in
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prev / Next nav */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                      disabled={previewIndex === 0}
                      className="px-4 py-2 bg-dark border border-dark-border text-gray-400 rounded-xl text-xs font-semibold hover:text-white transition-colors disabled:opacity-30"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setPreviewIndex((i) => Math.min(slides.length - 1, i + 1))}
                      disabled={previewIndex === slides.length - 1}
                      className="px-4 py-2 bg-dark border border-dark-border text-gray-400 rounded-xl text-xs font-semibold hover:text-white transition-colors disabled:opacity-30"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        )}
      </div>
    </>
  );
}
