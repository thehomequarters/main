export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-display text-5xl text-[#1C1C1C] mb-3">404</h1>
        <p className="text-sm text-[#7A7065] mb-8">Member profile not found.</p>
        <a
          href="https://thehomequarters.com"
          className="text-[10px] tracking-[0.25em] uppercase text-[#B0A89A] hover:text-[#7A7065] transition-colors"
        >
          HomeQuarters
        </a>
      </div>
    </main>
  );
}
