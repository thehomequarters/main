import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteObject,
  getDownloadURL,
  getMetadata,
  listAll,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../firebase";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

type Folder = "all" | "venues" | "splashes" | "events" | "general";
const FOLDERS: { key: Folder; label: string }[] = [
  { key: "all", label: "All" },
  { key: "venues", label: "Venues" },
  { key: "splashes", label: "Splashes" },
  { key: "events", label: "Events" },
  { key: "general", label: "General" },
];

interface MediaItem {
  name: string;
  fullPath: string;
  url: string;
  size: number;
  updated: Date;
  folder: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Media() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<Folder>("all");
  const [uploadFolder, setUploadFolder] = useState<Exclude<Folder, "all">>("general");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const rootRef = ref(storage, "media/");
      const rootList = await listAll(rootRef);
      const results: MediaItem[] = [];

      // load files at root + in each folder prefix
      const allRefs = [
        ...rootList.items,
        ...(await Promise.all(rootList.prefixes.map((p) => listAll(p)))).flatMap(
          (l) => l.items
        ),
      ];

      await Promise.all(
        allRefs.map(async (itemRef) => {
          try {
            const [url, meta] = await Promise.all([
              getDownloadURL(itemRef),
              getMetadata(itemRef),
            ]);
            const parts = itemRef.fullPath.split("/"); // media/folder/filename
            const folder = parts.length >= 3 ? parts[1] : "general";
            results.push({
              name: itemRef.name,
              fullPath: itemRef.fullPath,
              url,
              size: meta.size,
              updated: new Date(meta.updated),
              folder,
            });
          } catch {
            // skip files that can't be fetched
          }
        })
      );

      results.sort((a, b) => b.updated.getTime() - a.updated.getTime());
      setItems(results);
    } catch (e) {
      console.warn("loadItems:", e);
      toast("Failed to load media", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArr.length === 0) {
        toast("Only image files are supported", "error");
        return;
      }
      setUploading(true);
      setProgress(0);

      let completed = 0;
      let totalProgress = 0;
      const progressMap: Record<string, number> = {};

      fileArr.forEach((file) => {
        const path = `media/${uploadFolder}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const storageRef = ref(storage, path);
        const task = uploadBytesResumable(storageRef, file);

        task.on(
          "state_changed",
          (snap) => {
            progressMap[file.name] = (snap.bytesTransferred / snap.totalBytes) * 100;
            totalProgress =
              Object.values(progressMap).reduce((a, b) => a + b, 0) / fileArr.length;
            setProgress(Math.round(totalProgress));
          },
          () => {
            toast(`Failed to upload ${file.name}`, "error");
            completed++;
            if (completed === fileArr.length) {
              setUploading(false);
              loadItems();
            }
          },
          () => {
            completed++;
            if (completed === fileArr.length) {
              setUploading(false);
              setProgress(0);
              toast(
                fileArr.length === 1
                  ? "Image uploaded"
                  : `${fileArr.length} images uploaded`
              );
              loadItems();
            }
          }
        );
      });
    },
    [uploadFolder, loadItems, toast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 1500);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteObject(ref(storage, deleteTarget.fullPath));
      setItems((prev) => prev.filter((i) => i.fullPath !== deleteTarget.fullPath));
      toast("Deleted");
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const displayed =
    activeFolder === "all" ? items : items.filter((i) => i.folder === activeFolder);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Media Library</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload images once, copy the URL to use anywhere in the admin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value as Exclude<Folder, "all">)}
            className="bg-dark border border-dark-border text-gray-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-gold/50"
          >
            <option value="venues">Venues</option>
            <option value="splashes">Splashes</option>
            <option value="events">Events</option>
            <option value="general">General</option>
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-black text-sm font-bold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Images
          </button>
        </div>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">Uploading…</span>
            <span className="text-gold font-medium">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Folder tabs */}
      <div className="flex gap-1 mb-5 border-b border-dark-border pb-4">
        {FOLDERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFolder(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeFolder === key
                ? "bg-gold-light text-gold"
                : "text-gray-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {label}
            {key !== "all" && (
              <span className="ml-1.5 text-xs opacity-60">
                {items.filter((i) => i.folder === key).length}
              </span>
            )}
            {key === "all" && (
              <span className="ml-1.5 text-xs opacity-60">{items.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Drag-drop zone — always visible at top */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 mb-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-gold bg-gold/5"
            : "border-dark-border hover:border-gray-600"
        }`}
      >
        <svg
          className={`w-8 h-8 mx-auto mb-2 ${dragOver ? "text-gold" : "text-gray-600"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className={`text-sm ${dragOver ? "text-gold" : "text-gray-500"}`}>
          Drop images here, or <span className="underline">click to browse</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Uploads to: <span className="text-gray-400 font-medium">{uploadFolder}</span> · Max 20 MB per image
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square bg-dark border border-dark-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm">No images yet. Upload some above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayed.map((item) => (
            <div key={item.fullPath} className="group relative">
              {/* Image card */}
              <div
                className="aspect-square bg-dark border border-dark-border rounded-xl overflow-hidden cursor-pointer relative"
                onClick={() => copyUrl(item.url)}
              >
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {copiedUrl === item.url ? (
                    <span className="text-green-400 text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg">
                      ✓ Copied!
                    </span>
                  ) : (
                    <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg">
                      Copy URL
                    </span>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

                {/* Folder badge */}
                {activeFolder === "all" && (
                  <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wide bg-black/60 text-gray-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.folder}
                  </span>
                )}
              </div>

              {/* File info */}
              <div className="mt-1.5 px-0.5">
                <p className="text-gray-400 text-xs truncate leading-tight" title={item.name}>
                  {item.name}
                </p>
                <p className="text-gray-600 text-xs">{formatBytes(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Delete confirm modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete image"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone. Any existing URLs referencing this image will break.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
