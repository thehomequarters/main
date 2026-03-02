import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_initials: string;
  author_title: string;
  author_city: string;
  content: string;
  topic: string;
  color: string;
  image_url: string | null;
  likes: number;
  comments: number;
  created_at: string;
}

const TOPIC_LABELS: Record<string, string> = {
  collaboration: "Collaboration",
  "flat-swap": "Flat Swap",
  meetup: "Meetup",
  general: "General",
  recommendation: "Recommendation",
};

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snap = await getDocs(collection(db, "posts"));
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Post)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        setPosts(list);
      } catch (e) {
        console.error("Failed to load posts:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleDeletePost = async (post: Post) => {
    if (!confirm(`Delete post by ${post.author_name}? This cannot be undone.`))
      return;

    await deleteDoc(doc(db, "posts", post.id));
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  };

  const filtered = filter
    ? posts.filter((p) => p.topic === filter)
    : posts;

  const topics = [...new Set(posts.map((p) => p.topic))];

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-dark rounded-lg animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-dark border border-dark-border rounded-2xl p-5 animate-pulse h-32"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Posts</h1>
        <p className="text-gray-500 text-sm mt-1">
          {posts.length} community post{posts.length !== 1 ? "s" : ""} ·
          Moderate content
        </p>
      </div>

      {/* Topic filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            filter === null
              ? "bg-gold-light text-gold border border-gold/25"
              : "bg-dark border border-dark-border text-gray-400 hover:text-white"
          }`}
        >
          All
        </button>
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setFilter(topic)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === topic
                ? "bg-gold-light text-gold border border-gold/25"
                : "bg-dark border border-dark-border text-gray-400 hover:text-white"
            }`}
          >
            {TOPIC_LABELS[topic] ?? topic}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {filtered.map((post) => (
          <div
            key={post.id}
            className="bg-dark border border-dark-border rounded-2xl p-4 md:p-5"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gold-light border border-gold/25 flex items-center justify-center flex-shrink-0">
                <span className="text-gold text-xs font-bold">
                  {post.author_initials}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* Author row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">
                    {post.author_name}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${post.color}15`,
                      color: post.color,
                    }}
                  >
                    {TOPIC_LABELS[post.topic] ?? post.topic}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {timeAgo(post.created_at)}
                  </span>
                </div>
                <div className="text-gray-500 text-xs">
                  {post.author_title} · {post.author_city}
                </div>

                {/* Content */}
                <p className="text-white/90 text-sm mt-2 leading-relaxed">
                  {post.content}
                </p>

                {/* Image */}
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post attachment"
                    className="mt-3 rounded-xl max-h-48 object-cover"
                  />
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-gray-500 text-xs">
                  <span>{post.likes} likes</span>
                  <span>{post.comments} comments</span>
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => handleDeletePost(post)}
                className="text-red-400/40 hover:text-red-400 transition-colors flex-shrink-0"
                title="Delete post"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No posts found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
