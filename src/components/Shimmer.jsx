// Shimmer/Skeleton loading components - Facebook style

export function ShimmerCard({ className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-slate-200 dark:bg-slate-700 rounded-xl h-40 mb-3"></div>
      <div className="space-y-2">
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-3/4"></div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-1/2"></div>
      </div>
    </div>
  );
}

export function ShimmerListItem({ className = '' }) {
  return (
    <div className={`animate-pulse flex items-center gap-3 p-3 ${className}`}>
      <div className="bg-slate-200 dark:bg-slate-700 rounded-full size-12 shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-3/4"></div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-1/2"></div>
      </div>
    </div>
  );
}

export function ShimmerProfile({ className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Cover */}
      <div className="bg-slate-200 dark:bg-slate-700 h-32 rounded-t-xl"></div>
      {/* Avatar */}
      <div className="flex justify-center -mt-12">
        <div className="bg-slate-300 dark:bg-slate-600 size-24 rounded-full border-4 border-white dark:border-slate-900"></div>
      </div>
      {/* Info */}
      <div className="p-4 space-y-3 text-center">
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-6 w-1/2 mx-auto"></div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-1/3 mx-auto"></div>
      </div>
    </div>
  );
}

export function ShimmerStats({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-${count} gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-slate-800 p-4 rounded-xl">
          <div className="bg-slate-200 dark:bg-slate-700 rounded h-8 w-16 mb-2"></div>
          <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-12"></div>
        </div>
      ))}
    </div>
  );
}

export function ShimmerChat({ count = 5, className = '' }) {
  return (
    <div className={`space-y-3 p-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`animate-pulse flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
          <div className="bg-slate-200 dark:bg-slate-700 rounded-full size-8 shrink-0"></div>
          <div className={`space-y-1 ${i % 2 === 0 ? '' : 'text-right'}`}>
            <div className={`bg-slate-200 dark:bg-slate-700 rounded-2xl h-10 ${
              i % 3 === 0 ? 'w-48' : i % 3 === 1 ? 'w-32' : 'w-56'
            }`}></div>
            <div className="bg-slate-200 dark:bg-slate-700 rounded h-2 w-12"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShimmerTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-slate-200 dark:border-slate-700">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded h-4 flex-1"></div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 p-3 border-b border-slate-100 dark:border-slate-800">
          {Array.from({ length: cols }).map((_, col) => (
            <div key={col} className="bg-slate-200 dark:bg-slate-700 rounded h-4 flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ShimmerFeed({ count = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-xl p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-slate-200 dark:bg-slate-700 rounded-full size-10"></div>
            <div className="flex-1 space-y-2">
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-32"></div>
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-20"></div>
            </div>
          </div>
          {/* Content */}
          <div className="space-y-2 mb-4">
            <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-full"></div>
            <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-5/6"></div>
          </div>
          {/* Image */}
          <div className="bg-slate-200 dark:bg-slate-700 rounded-xl h-48"></div>
        </div>
      ))}
    </div>
  );
}

export function ShimmerWing({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white dark:bg-slate-800 rounded-xl p-4 ${className}`}>
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-slate-200 dark:bg-slate-700 rounded-lg size-12"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-slate-200 dark:bg-slate-700 rounded h-5 w-32"></div>
          <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-24"></div>
        </div>
      </div>
      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-full"></div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-4/5"></div>
      </div>
      {/* Stats */}
      <div className="flex gap-4">
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-16"></div>
        <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-16"></div>
      </div>
    </div>
  );
}

export function ShimmerPage({ type = 'feed', className = '' }) {
  switch (type) {
    case 'profile':
      return <ShimmerProfile className={className} />;
    case 'chat':
      return <ShimmerChat className={className} />;
    case 'table':
      return <ShimmerTable className={className} />;
    case 'cards':
      return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      );
    case 'list':
      return (
        <div className={className}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerListItem key={i} />
          ))}
        </div>
      );
    default:
      return <ShimmerFeed className={className} />;
  }
}

export default ShimmerPage;
