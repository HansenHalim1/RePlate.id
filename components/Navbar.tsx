'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { ShoppingCart } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  // Fetch logged-in user once on mount
  useEffect(() => {
    const fetchUser = async () => {
      const res = await supabaseBrowser.auth.getUser()
      setUser(res.data?.user ?? null)
    }
    fetchUser()

    const { data: authListener } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // Logout handler
  const handleLogout = async () => {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) console.error('Logout error:', error.message)
    setUser(null)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-[#e5e5e5] border-b border-[#d4d4d4]">
      <div className="rp-shell h-[70px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="RePlate.id logo" className="h-12 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[#f7931d] text-base">RePlate.id</span>
            <span className="text-[11px] text-slate-600">No Plates Left Behind</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm text-slate-800">
          {[
            { href: '/', label: 'Home' },
            { href: '/#about', label: 'About Us' },
            { href: '/products', label: 'Products' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[color:var(--rp-green)]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            className={`transition flex items-center ${
              pathname === '/cart' ? 'text-[color:var(--rp-green)]' : 'text-slate-700'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-700 truncate max-w-[140px]">Hi, {user.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-full bg-[color:var(--rp-green)] text-[#2e2e2e] text-sm font-semibold px-5 py-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-[color:var(--rp-green)] text-[#2e2e2e] text-sm font-semibold px-4 py-2"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-[#7d8d2a] text-slate-800 text-sm font-semibold px-4 py-2 bg-white"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-[#d4d4d4] bg-[#f1f1f1]">
        <div className="rp-shell py-2 flex items-center justify-between text-sm font-medium text-slate-800">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[color:var(--rp-green)]">Home</Link>
            <Link href="/products" className="hover:text-[color:var(--rp-green)]">Products</Link>
            <Link href="/#about" className="hover:text-[color:var(--rp-green)]">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="text-slate-800 hover:text-[color:var(--rp-green)]">
              <ShoppingCart className="w-5 h-5" />
            </Link>
            {user ? (
              <button onClick={handleLogout} className="text-[color:var(--rp-green)] font-semibold">
                Logout
              </button>
            ) : (
              <Link href="/login" className="text-[color:var(--rp-green)] font-semibold">
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
