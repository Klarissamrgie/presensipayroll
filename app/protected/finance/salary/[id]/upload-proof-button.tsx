'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload } from 'lucide-react'
import { uploadPaymentProof } from '../../finance'
import { toast } from 'sonner' // Gunakan library toast Anda

export default function UploadProofButton({ teacherId, periodStr, amount }: { teacherId: string, periodStr: string, amount: number }) {
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      await uploadPaymentProof(teacherId, periodStr, amount, formData)
      toast.success("Bukti transfer berhasil diupload!")
    } catch (err: any) {
      toast.error("Gagal: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-3">
      <Input type="file" name="proof" accept="image/*" required className="bg-white" />
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4 mr-2"/>}
        {loading ? 'Mengupload...' : 'Simpan & Paid'}
      </Button>
    </form>
  )
}