'use client'

import { useEffect } from 'react'
import AdminAuth from '@/components/admin/AdminAuth'
import { ToastProvider } from '@/components/admin/Toast'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.title = '[Admin panel] Filip Rosa'
  }, [])

  return (
    <ToastProvider>
      <AdminAuth>
        {/* Subtle red glow border to distinguish admin from public pages */}
        <div className="fixed inset-0 pointer-events-none z-[9998]" style={{
          boxShadow: 'inset 0 0 80px rgba(180,40,40,0.12), inset 0 0 20px rgba(180,40,40,0.06)',
        }} />
        {children}
      </AdminAuth>
    </ToastProvider>
  )
}
