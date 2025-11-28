'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { Menu, ShoppingCart, X } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [cartCount, setCartCount] = useState<number>(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#about', label: 'About Us' },
    { href: '/products', label: 'Products' },
    { href: '/transactions', label: 'Transactions' },
  ]

  const fetchCartCount = async (userId: string) => {
    const { count } = await supabaseBrowser
      .from('cart_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    setCartCount(count ?? 0)
  }

  // Fetch logged-in user once on mount
  useEffect(() => {
    const fetchUser = async () => {
      const res = await supabaseBrowser.auth.getUser()
      setUser(res.data?.user ?? null)
      if (res.data?.user) {
        fetchCartCount(res.data.user.id)
      }
    }
    fetchUser()

    const { data: authListener } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchCartCount(session.user.id)
        } else {
          setCartCount(0)
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // Poll + refetch on focus to keep cart count fresh without realtime
  useEffect(() => {
    if (!user?.id) {
      setCartCount(0)
      return
    }

    let cancelled = false
    const refresh = async () => {
      if (cancelled) return
      await fetchCartCount(user.id)
    }

    refresh()

    const onFocus = () => refresh()
    const onCartEvent = () => refresh()
    window.addEventListener('focus', onFocus)
    window.addEventListener('cart-updated', onCartEvent as EventListener)

    const interval = setInterval(refresh, 20_000) // light polling

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('cart-updated', onCartEvent as EventListener)
      clearInterval(interval)
    }
  }, [user?.id])

  // Close the drawer when navigating
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Logout handler
  const handleLogout = async () => {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) console.error('Logout error:', error.message)
    setUser(null)
    router.push('/')
  }

  const handleNavigate = (href: string) => {
    setMobileOpen(false)
    router.push(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-[#e5e5e5] border-b border-[#d4d4d4]">
      <div className="rp-shell h-[70px] flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="RePlate.id logo" className="h-12 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[#f7931d] text-base">RePlate.id</span>
            <span className="text-[11px] text-slate-600">No Plates Left Behind</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-800">
          {navLinks.map((link) => (
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
            className={`relative transition flex items-center ${
              pathname === '/cart' ? 'text-[color:var(--rp-green)]' : 'text-slate-700'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -right-3 -top-2 h-4 min-w-[16px] rounded-full bg-[color:var(--rp-green)] text-white text-[10px] font-semibold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
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

        {/* Compact top-row for mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/cart"
            className="relative text-slate-800 hover:text-[color:var(--rp-green)]"
            aria-label="Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -right-3 -top-2 h-4 min-w-[16px] rounded-full bg-[color:var(--rp-green)] text-white text-[10px] font-semibold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-full border border-[#c8c8c8] bg-white p-2 text-slate-800 hover:text-[color:var(--rp-green)]"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden relative z-50 border-t border-[#d4d4d4] bg-[#f7f7f7] transition-[max-height,opacity] duration-300 ${
          mobileOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="rp-shell py-4 flex flex-col gap-4 text-sm font-medium text-slate-800">
          <div className="grid grid-cols-2 gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavigate(link.href)
                }}
                className="flex items-center justify-between rounded-xl border border-[#dcdcdc] bg-white px-3 py-2 hover:border-[color:var(--rp-green)] transition"
              >
                <span>{link.label}</span>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">Go</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#dcdcdc] bg-white px-3 py-2">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">Cart</span>
              <span className="text-sm font-semibold text-slate-800">
                {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''}` : 'Empty'}
              </span>
            </div>
            <Link
              href="/cart"
              className="relative rounded-full border border-[#7d8d2a] text-[color:var(--rp-green)] px-3 py-1 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-xs font-semibold">View</span>
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 h-4 min-w-[16px] rounded-full bg-[color:var(--rp-green)] text-white text-[10px] font-semibold flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <span className="text-xs text-slate-600 truncate">
                  Signed in as {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-[color:var(--rp-green)] text-white font-semibold px-5 py-2 w-full"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full bg-[color:var(--rp-green)] text-white text-center font-semibold px-5 py-2 w-full"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full border border-[color:var(--rp-green)] text-[color:var(--rp-green)] text-center font-semibold px-5 py-2 w-full bg-white"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="md:hidden fixed inset-0 z-30 bg-black/10"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </header>
  )
}
