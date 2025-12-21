'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveAndLockActivity } from '@/app/protected/teacher/absensi/edit-workflow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function EditActivityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // State untuk form (Contoh sederhana, sesuaikan dengan form Anda)
  const [formData, setFormData] = useState({
    catatan_kegiatan: '',
    jam_selesai: ''
  })

  // (Disini harusnya ada useEffect untuk fetch data lama activity berdasarkan params.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // PANGGIL SERVER ACTION "SAVE & LOCK"
      await saveAndLockActivity(Number(params.id), {
        catatan_kegiatan: formData.catatan_kegiatan,
        jam_selesai: formData.jam_selesai,
        // field lain...
      })

      toast.success("Data berhasil disimpan & dikunci kembali.")
      router.push('/protected/teacher/pengajuan-edit') // Redirect kembali ke list
    } catch (error) {
      toast.error("Gagal menyimpan data.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Kegiatan (One-Time)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Input Contoh */}
        <div className="space-y-2">
          <label>Catatan Kegiatan</label>
          <Input 
            value={formData.catatan_kegiatan}
            onChange={(e) => setFormData({...formData, catatan_kegiatan: e.target.value})} 
          />
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Menyimpan & Mengunci...' : 'Simpan Perubahan & Selesai'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Setelah disimpan, data akan otomatis terkunci kembali.
          </p>
        </div>
      </form>
    </div>
  )
}