export default function AppearanceLoading() {
  return (
    <main className="py-8">
      <div className="h-4 w-24 bg-gray-800 rounded mb-4 animate-pulse" />

      <div className="text-center mb-6">
        <div className="h-8 w-40 bg-gray-800 rounded mx-auto mb-2 animate-pulse" />
        <div className="h-4 w-52 bg-gray-800 rounded mx-auto animate-pulse" />
      </div>

      {/* Avatar preview skeleton */}
      <div className="flex flex-col items-center gap-3 py-2 mb-6">
        <div className="w-20 h-20 bg-gray-800 rounded-full animate-pulse" />
      </div>

      {/* Picker section skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <section key={i} className="mb-6">
          <div className="h-3 w-20 bg-gray-800 rounded mb-2 animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="w-9 h-9 bg-gray-800 rounded-full animate-pulse" />
            ))}
          </div>
        </section>
      ))}

      <div className="h-12 w-full bg-gray-800 rounded-xl animate-pulse" />
    </main>
  )
}
