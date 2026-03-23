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
      <AdminAuth>{children}</AdminAuth>
    </ToastProvider>
  )
}
