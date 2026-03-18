export default function LoadoutLoading() {
  return (
    <main className="py-8">
      <div className="h-4 w-24 bg-gray-800 rounded mb-4 animate-pulse" />

      <div className="text-center mb-6">
        <div className="h-8 w-32 bg-gray-800 rounded mx-auto mb-2 animate-pulse" />
        <div className="h-4 w-44 bg-gray-800 rounded mx-auto animate-pulse" />
      </div>

      {[1, 2, 3].map((i) => (
        <section key={i} className="mb-6">
          <div className="h-3 w-16 bg-gray-800 rounded mb-2 animate-pulse" />
          <div className="space-y-2">
            {[1, 2].map((j) => (
              <div key={j} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-800 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
