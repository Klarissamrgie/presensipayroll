'use client'

import { useState, use } from 'react' // Import 'use'
import { useRouter } from 'next/navigation'
import { saveAndLockActivity } from '@/app/protected/teacher/absensi/edit-workflow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

// Update Props Type to Promise
export default function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // Unwrap the params Promise
  const { id } = use(params)
  
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    catatan_kegiatan: '',
    jam_selesai: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Use the unwrapped 'id' here
      await saveAndLockActivity(Number(id), {
        catatan_kegiatan: formData.catatan_kegiatan,
        jam_selesai: formData.jam_selesai,
      })

      toast.success("Data berhasil disimpan & dikunci kembali.")
      router.push('/protected/teacher/pengajuan-edit') 
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