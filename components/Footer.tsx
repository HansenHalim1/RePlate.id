export default function Footer() {
  return (
    <footer className="mt-16 bg-[#dcdcdc] border-t border-[#d0d0d0]">
      <div className="rp-shell py-8 flex flex-col items-center text-center gap-3 text-sm text-slate-700">
        <img src="/logo.png" alt="RePlate.id logo" className="h-12 w-auto" />
        <div className="text-[15px] font-semibold text-slate-800">Contact Us</div>
        <div className="flex items-center gap-3 text-[15px]">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-[color:var(--rp-green)]">
            <span className="sr-only">Facebook</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H8.08v-2.9h2.36V9.41c0-2.33 1.39-3.62 3.52-3.62.7 0 1.45.12 2.15.22v2.36h-1.21c-1.19 0-1.56.74-1.56 1.5v1.8h2.65l-.42 2.9h-2.23V22c4.78-.8 8.44-4.94 8.44-9.93Z"/></svg>
          </a>
          <a href="https://instagram.com/replateid" target="_blank" rel="noreferrer" className="text-[color:var(--rp-green)]">
            <span className="sr-only">Instagram</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm11.25 1.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>
          </a>
          <a href="https://wa.me/6280000000000" target="_blank" rel="noreferrer" className="text-[color:var(--rp-green)]">
            <span className="sr-only">WhatsApp</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.01 2a9.92 9.92 0 0 0-8.7 14.8L2 22l5.35-1.37A9.94 9.94 0 1 0 12 2h.01ZM4.96 17.4l.34-.55a8 8 0 1 1 2.49 2.35l-.56.33-.99.25.22-.98ZM8 7.61c-.17-.38-.36-.39-.53-.39h-.45c-.16 0-.42.06-.65.29-.22.22-.86.85-.86 2.07 0 1.22.88 2.4 1 .26 0 .92.19 1.25.29.17.06.38.1.5.1.12 0 .26-.04.4-.32.17-.29.51-.58.64-.7.13-.13.25-.15.42-.09.19.09 1.2.57 1.41.67.21.1.35.15.4.24.05.1.05.58-.14 1.14-.19.57-.98 1.06-1.36 1.13-.34.08-.78.11-1.27-.08-.5-.19-1.58-.68-2.4-1.95-.88-1.26-.88-2.34-.77-2.53.12-.19.26-.3.34-.33.08-.06.17-.06.26-.06.09 0 .22 0 .33.01Z"/></svg>
          </a>
          <a href="mailto:replate.id@gmail.com" className="text-[color:var(--rp-green)]">
            <span className="sr-only">Email</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v.51l8 4.99 8-4.99V7H4Zm0 9h16v-7l-7.48 4.67a1 1 0 0 1-1.04 0L4 9v7Z"/></svg>
          </a>
        </div>
        <div className="text-[13px] text-slate-600">
          Terms and Conditions | Privacy | Legal Notice
        </div>
        <div className="text-xs text-slate-600">
          Copyright © {new Date().getFullYear()} RePlate.id. All rights reserved
        </div>
      </div>
    </footer>
  )
}
