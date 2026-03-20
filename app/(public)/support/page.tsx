import Link from 'next/link'
import Image from 'next/image'

export default function SupportPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-950 to-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍺</div>
          <h1 className="text-3xl font-bold text-green-400">Buy Me a Drink</h1>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">
            Chore Quest is free and self-hosted. If it's been helpful for your family,
            any support is deeply appreciated!
          </p>
        </div>

        <div className="space-y-5">
          {/* Venmo */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <div className="text-2xl mb-2">💙</div>
            <h2 className="text-lg font-bold text-white mb-1">Venmo</h2>
            <p className="text-green-400 font-mono font-bold text-xl mb-4">@jamey-Rumph</p>
            <div className="flex justify-center">
              <div className="bg-white rounded-xl p-2 inline-block">
                <Image
                  src="/venmo-qr.jpg"
                  alt="Venmo QR code for @jamey-Rumph"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* CashApp */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <div className="text-2xl mb-2">💚</div>
            <h2 className="text-lg font-bold text-white mb-1">Cash App</h2>
            <p className="text-green-400 font-mono font-bold text-xl mb-4">$JameyRumph</p>
            <div className="flex justify-center">
              <div className="bg-white rounded-xl p-2 inline-block">
                <Image
                  src="/cashapp-qr.jpg"
                  alt="Cash App QR code for $JameyRumph"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 space-y-3">
          <p className="text-gray-600 text-xs">
            Questions or feedback?{' '}
            <a
              href="mailto:Jamey.rumph@gmail.com?subject=Chore%20app%20bug%2Ffeedback"
              className="text-green-400 hover:underline"
            >
              Send a message
            </a>
          </p>
          <Link href="/admin" className="block text-sm text-gray-500 hover:text-gray-400 transition-colors">
            ← Back to parent portal
          </Link>
        </div>
      </div>
    </main>
  )
}
