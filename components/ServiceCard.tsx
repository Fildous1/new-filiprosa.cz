'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface ServiceCardProps {
  icon: React.ReactNode
  title: string
  description: string
  wide?: boolean
  delay?: number
}

export default function ServiceCard({ icon, title, description, wide, delay = 0 }: ServiceCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -30px 0px' })
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setGlowPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden cursor-default group ${
        wide ? 'col-span-1 sm:col-span-2 lg:col-span-2' : ''
      }`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      style={{
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(var(--lime-rgb),0.06), 0 16px 48px rgba(0,0,0,0.35)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Cursor-following yellow glow */}
      <div
        className="cursor-glow"
        style={{
          left: glowPos.x,
          top: glowPos.y,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Card content */}
      <div className={`relative z-2 p-8 lg:p-10 ${wide ? 'flex flex-col sm:flex-row sm:items-start gap-6' : ''}`}>
        <div className={`w-11 h-11 mb-7 flex items-center justify-center rounded-[2px] bg-lime/[0.08] ${wide ? 'shrink-0' : ''}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-display font-bold text-offwhite text-[1.2rem] tracking-[-0.02em] mb-3">
            {title}
          </h3>
          <p className="font-body text-muted text-[0.875rem] leading-[1.7] max-w-[32rem]">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
