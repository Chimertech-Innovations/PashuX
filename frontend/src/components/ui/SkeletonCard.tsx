export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-6 space-y-4 animate-fade-in">
      <div className="skeleton h-5 w-2/3 rounded-lg" style={{ animationDelay: '0ms' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3 rounded-full" style={{
          width: `${100 - i * 15}%`,
          animationDelay: `${i * 100}ms`
        }} />
      ))}
      <div className="skeleton h-8 w-1/3 rounded-xl mt-6" />
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="glass-card p-5 space-y-4 animate-fade-in">
      <div className="skeleton w-full aspect-square rounded-xl" />
      <div className="skeleton h-3 w-1/3 rounded-full" />
      <div className="skeleton h-5 w-3/4 rounded-lg" />
      <div className="skeleton h-3 rounded-full" />
      <div className="skeleton h-3 w-4/5 rounded-full" />
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/[0.05]">
        <div className="skeleton h-6 w-16 rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-14 rounded-xl" />
          <div className="skeleton h-8 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
