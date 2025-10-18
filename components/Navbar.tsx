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
  }, [])

  // Logout handler
  const handleLogout = async () => {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) console.error('Logout error:', error.message)
    setUser(null)
    router.push('/')
  }

  const navLinks: { href: string; label: string }[] = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/products', label: 'Products' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="RePlate.id logo" className="h-10 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-orange-600 text-lg">RePlate.id</span>
            <span className="text-xs text-slate-600">No Plates Left Behind</span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition ${
                pathname === link.href
                  ? 'text-green-700 font-semibold'
                  : 'text-slate-700 hover:text-green-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cart"
            className={`hover:text-green-700 transition flex items-center ${
              pathname === '/cart' ? 'text-green-700' : 'text-slate-700'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-700 truncate max-w-[120px]">
                Hi, {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-1 rounded-full border border-green-700 text-green-700 hover:bg-green-700 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-green-700 text-white text-sm font-medium px-4 py-1 rounded-full hover:bg-green-800 transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium px-4 py-1 rounded-full border border-green-700 text-green-700 hover:bg-green-700 hover:text-white transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t bg-white">
        <div className="flex justify-around py-2 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${
                pathname === link.href ? 'text-green-700 font-semibold' : 'text-slate-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/cart">
            <ShoppingCart className="w-5 h-5 text-slate-700" />
          </Link>
        </div>
      </div>
    </header>
  )
}
