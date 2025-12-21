'use client'

import { useState, useTransition } from 'react'
import { requestEdit } from '@/app/protected/teacher/absensi/edit-workflow'
import { Button } from '@/components/ui/button'
import { Lock, Unlock, Clock, AlertCircle, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner' // Pastikan sudah install sonner/toast

interface ActivityButtonProps {
  activity: {
    id_kegiatan: number
    status_kegiatan: string // 'Selesai' atau 'Pending'
    is_editable: boolean
    request_edit_status: string // 'none' | 'pending' | 'approved' | 'rejected'
  }
}

export default function ActivityActionButton({ activity }: ActivityButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleRequest = () => {
    startTransition(async () => {
      try {
        await requestEdit(activity.id_kegiatan)
        toast.success("Permintaan edit berhasil diajukan ke Admin")
      } catch (error) {
        toast.error("Gagal mengajukan edit")
      }
    })
  }

  const handleEditClick = () => {
    // Redirect ke halaman edit
    router.push(`/teacher/activity/edit/${activity.id_kegiatan}`)
  }

  // LOGIC 1: Jika Kelas Belum Selesai -> Tombol Edit Biasa
  if (activity.status_kegiatan !== 'Selesai') {
    return (
      <Button variant="outline" size="sm" onClick={handleEditClick}>
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </Button>
    )
  }

  // LOGIC 2: Kelas Selesai & Admin sudah Approve (UNLOCKED)
  if (activity.is_editable) {
    return (
      <Button 
        variant="default" 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white animate-pulse"
        onClick={handleEditClick}
      >
        <Unlock className="w-4 h-4 mr-2" />
        Edit Sekarang
      </Button>
    )
  }

  // LOGIC 3: Kelas Selesai & Sedang Menunggu Admin
  if (activity.request_edit_status === 'pending') {
    return (
      <Button variant="secondary" size="sm" disabled className="opacity-80 cursor-not-allowed">
        <Clock className="w-4 h-4 mr-2" />
        Menunggu Approval
      </Button>
    )
  }

  // LOGIC 4: Default (Terkunci) - Tampilkan Tombol Request
  return (
    <div className="flex flex-col gap-1 items-start">
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleRequest} 
        disabled={isPending}
        className="bg-amber-600 hover:bg-amber-700 text-white"
      >
        {isPending ? (
          <Clock className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Lock className="w-4 h-4 mr-2" />
        )}
        {isPending ? 'Mengajukan...' : 'Ajukan Edit'}
      </Button>
      
      {activity.request_edit_status === 'rejected' && (
        <span className="text-[10px] text-red-500 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" /> Ditolak Admin
        </span>
      )}
    </div>
  )
}