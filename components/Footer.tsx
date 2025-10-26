export default function Footer() {
  return (
    <footer className="border-t bg-[#d9e4c3] mt-10">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center md:text-left grid gap-6 md:grid-cols-3 text-sm text-slate-700">
        {/* Logo / mission */}
        <div className="flex flex-col items-center md:items-start">
          <img src="/logo.png" alt="RePlate.id logo" className="h-10 w-auto mb-2" />
          <p className="text-sm text-slate-600 max-w-xs">
            Connecting hotels and communities to reduce food waste. Every plate saved makes a
            difference.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-medium text-slate-800">Quick Links</span>
          <a href="/" className="hover:text-green-700">Home</a>
          <a href="/about" className="hover:text-green-700">About Us</a>
          <a href="/products" className="hover:text-green-700">Products</a>
          <a href="/cart" className="hover:text-green-700">Cart</a>
        </div>

        {/* Contact */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-medium text-slate-800">Contact</span>
          <p>Email: <a href="mailto:replate.id@gmail.com" className="hover:text-green-700">replate.id@gmail.com</a></p>
          <p>Instagram: <a href="https://instagram.com/replateid" target="_blank" className="hover:text-green-700">@replateid</a></p>
        </div>
      </div>

      <div className="border-t text-center py-4 text-xs text-slate-500 bg-[#cddbb2]">
        © {new Date().getFullYear()} RePlate.id — All rights reserved
      </div>
    </footer>
  )
}
