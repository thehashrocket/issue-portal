export function UsersTableSkeleton() {
  return (
    <div className="w-full h-[600px] animate-pulse">
      <div className="h-10 bg-gray-200 rounded-t-lg mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 mb-2 rounded" />
      ))}
    </div>
  );
} 