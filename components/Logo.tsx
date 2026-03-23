export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Filip Rosa"
    >
      <text
        x="0"
        y="38"
        textAnchor="start"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="700"
        fontStyle="italic"
        fontSize="36"
        fill="#b9d026"
        letterSpacing="-0.02em"
      >
        Filip Rosa
      </text>
    </svg>
  )
}
