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
          boxShadow: 'inset 0 0 4px 1px rgba(200,40,40,0.5), inset 0 0 15px rgba(200,40,40,0.25), inset 0 0 40px rgba(180,40,40,0.1)',
        }} />
        {children}
      </AdminAuth>
    </ToastProvider>
  )
}
