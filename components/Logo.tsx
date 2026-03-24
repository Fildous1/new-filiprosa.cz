export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold italic text-lime tracking-[-0.02em] leading-none select-none whitespace-nowrap ${className}`}
      aria-label="Filip Rosa"
    >
      Filip Rosa
    </span>
  )
}
