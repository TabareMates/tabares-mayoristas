'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      router.push('/catalog')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Marca */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2D4535] mb-4">
            <span className="text-2xl">🧉</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#2D4535]">Tabaré Mates</h1>
          <p className="text-sm text-[#2D4535]/60 mt-1">Portal Mayoristas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2D4535] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              className="w-full px-4 py-3 rounded-xl border border-[#2D4535]/20 bg-white
                         text-[#2D4535] placeholder-[#2D4535]/40
                         focus:outline-none focus:ring-2 focus:ring-[#B8935A] focus:border-transparent
                         transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2D4535] mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-[#2D4535]/20 bg-white
                           text-[#2D4535] placeholder-[#2D4535]/40
                           focus:outline-none focus:ring-2 focus:ring-[#B8935A] focus:border-transparent
                           transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D4535]/40 hover:text-[#2D4535] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#2D4535] text-[#F0E8D8] font-medium
                       hover:bg-[#3d5c47] disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}
