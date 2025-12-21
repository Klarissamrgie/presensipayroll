'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Lock, Unlock, Clock, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { requestEdit } from './edit-workflow' // Pastikan file ini ada (dari upload sebelumnya)

interface ActivityButtonProps {
  id: number
  isDone: boolean
  requestStatus: string // 'none' | 'pending' | 'approved' | 'rejected'
  isEditable: boolean
}

export default function ActivityActionButton({ id, isDone, requestStatus, isEditable }: ActivityButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleRequest = () => {
    startTransition(async () => {
      try {
        await requestEdit(id)
        toast.success("Pengajuan edit berhasil dikirim ke Admin")
      } catch (error: any) {
        toast.error("Gagal mengajukan edit: " + error.message)
      }
    })
  }

  const handleNavigate = () => {
    router.push(`/protected/teacher/absensi?kegiatan=${id}`)
  }

  // KONDISI 1: Belum Selesai (Tombol Normal)
  if (!isDone) {
    return (
      <Button 
        size="sm" 
        onClick={handleNavigate}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Isi <ChevronRight className="ml-1 h-3 w-3" />
      </Button>
    )
  }

  // KONDISI 2: Selesai & Admin Memberi Izin (Unlocked)
  if (isDone && isEditable) {
    return (
      <Button 
        size="sm" 
        onClick={handleNavigate}
        className="bg-green-600 hover:bg-green-700 animate-pulse text-white shadow-green-200 shadow-lg"
      >
        <Unlock className="w-3 h-3 mr-2" />
        Edit Sekarang
      </Button>
    )
  }

  // KONDISI 3: Selesai & Menunggu Approval Admin
  if (isDone && requestStatus === 'pending') {
    return (
      <Button variant="secondary" size="sm" disabled className="opacity-80 cursor-not-allowed">
        <Clock className="w-3 h-3 mr-2 animate-pulse" />
        Menunggu Approval
      </Button>
    )
  }

  // KONDISI 4: Selesai (Terkunci) - Default
  return (
    <div className="flex flex-col items-end gap-1">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRequest} 
        disabled={isPending}
        className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
        ) : (
          <Lock className="w-3 h-3 mr-2" />
        )}
        {isPending ? 'Mengajukan...' : 'Ajukan Edit'}
      </Button>
      
      {requestStatus === 'rejected' && (
        <span className="text-[10px] text-red-500 flex items-center bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
          <AlertCircle className="w-3 h-3 mr-1" /> Ditolak Admin
        </span>
      )}
    </div>
  )
}