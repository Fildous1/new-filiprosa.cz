import Logo from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-dark text-offwhite font-body px-6">
      <Logo className="h-10 w-auto mb-10 opacity-40" />
      <h1
        className="font-display font-bold text-offwhite tracking-[-0.03em] leading-none mb-4"
        style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}
      >
        404
      </h1>
      <p className="text-muted text-[1rem] mb-8">
        Stránka nenalezena
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 text-[0.85rem] font-semibold tracking-[0.03em] bg-lime text-dark rounded-[2px] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(185,208,38,0.2),0_2px_8px_rgba(185,208,38,0.15)] active:translate-y-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Zpět na hlavní stránku
      </a>
    </div>
  )
}
