'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { id as indonesia } from 'date-fns/locale'

// UI Components
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input' // <-- SUDAH DI-FIX
import { Textarea } from '@/components/ui/textarea' // <-- SUDAH DI-FIX
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Save, ArrowLeft, CheckCircle2, Clock, MapPin, User, Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  activity: any
  students: any[]
  existingAttendance: any[]
  isGeneralActivity: boolean
}

export default function AbsensiClient({ activity, students, existingAttendance, isGeneralActivity }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // State Kegiatan Umum
  const [generalNote, setGeneralNote] = useState(activity.catatan_kegiatan || '')
  const [generalImage, setGeneralImage] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(
    activity.bukti_foto 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/presensi/${activity.bukti_foto}` 
      : null
  )

  // State Absensi Siswa
  const [attendanceData, setAttendanceData] = useState<Record<number, any>>(() => {
    if (isGeneralActivity) return {}
    const initial: Record<number, any> = {}
    students.forEach(s => {
      const exist = existingAttendance.find(a => a.id_student === s.id_student)
      initial[s.id_student] = {
        id_student: s.id_student,
        status: exist ? exist.status : 'Hadir',
        catatan: exist ? exist.catatan || '' : ''
      }
    })
    return initial
  })

  // Handlers Umum
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setGeneralImage(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSubmitGeneral = async () => {
    setIsLoading(true)
    try {
      let imagePath = activity.bukti_foto

      if (generalImage) {
        const fileExt = generalImage.name.split('.').pop()
        const fileName = `${activity.id_kegiatan}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('presensi').upload(fileName, generalImage)
        if (uploadError) throw uploadError
        imagePath = fileName
      }

      const { error } = await supabase.from('tbkegiatan').update({
        catatan_kegiatan: generalNote,
        bukti_foto: imagePath,
        status_kegiatan: 'Selesai'
      }).eq('id_kegiatan', activity.id_kegiatan)

      if (error) throw error
      alert("Laporan tersimpan!")
      router.push('/protected/teacher/dashboard')
      router.refresh()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handlers Siswa
  const handleStatusChange = (id: number, val: string) => {
    setAttendanceData(prev => ({ ...prev, [id]: { ...prev[id], status: val } }))
  }
  const handleNoteChange = (id: number, val: string) => {
    setAttendanceData(prev => ({ ...prev, [id]: { ...prev[id], catatan: val } }))
  }
  const markAll = () => {
    const updated = { ...attendanceData }
    Object.keys(updated).forEach(k => updated[Number(k)].status = 'Hadir')
    setAttendanceData(updated)
  }

  const handleSubmitAttendance = async () => {
    setIsLoading(true)
    const payload = Object.values(attendanceData).map((r: any) => ({
      id_kegiatan: activity.id_kegiatan,
      id_student: r.id_student,
      status: r.status,
      catatan: r.catatan
    }))

    const { error } = await supabase.from('tb_attendance').upsert(payload, { onConflict: 'id_kegiatan, id_student' })
    
    if (error) {
      alert("Gagal: " + error.message)
      setIsLoading(false)
    } else {
      await supabase.from('tbkegiatan').update({ status_kegiatan: 'Selesai' }).eq('id_kegiatan', activity.id_kegiatan)
      alert("Absensi tersimpan!")
      router.push('/protected/teacher/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/protected/teacher/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isGeneralActivity ? "Laporan Kegiatan" : "Input Absensi"}</h1>
          <p className="text-muted-foreground text-sm">
            {isGeneralActivity ? "Upload bukti kehadiran." : "Isi kehadiran siswa."}
          </p>
        </div>
      </div>

      <Card className="bg-blue-50/50 border-blue-100">
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold text-blue-900">{activity.nama_kegiatan}</h2>
          <div className="text-sm text-blue-700 mt-1 flex gap-2">
             <Clock className="h-4 w-4" /> {activity.jam_mulai?.slice(0,5)} - {activity.jam_selesai?.slice(0,5)}
             <span>|</span>
             <MapPin className="h-4 w-4" /> {activity.tbkelas?.name_kelas || "Kegiatan Umum"}
          </div>
        </CardContent>
      </Card>

      {isGeneralActivity ? (
        <Card>
          <CardContent className="pt-6 space-y-6">
             <div className="space-y-2">
                <Label>Bukti Foto</Label>
                <div className="border-2 border-dashed p-6 text-center rounded-lg">
                  {previewImage ? (
                    <img src={previewImage} className="max-h-64 mx-auto rounded" />
                  ) : (
                    <div className="text-muted-foreground">Belum ada foto</div>
                  )}
                  <Input type="file" accept="image/*" className="mt-4" onChange={handleImageChange} />
                </div>
             </div>
             <div className="space-y-2">
               <Label>Catatan</Label>
               <Textarea value={generalNote} onChange={e => setGeneralNote(e.target.value)} placeholder="Tulis laporan..." />
             </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center mt-4">
            <h3 className="font-semibold">Daftar Siswa ({students.length})</h3>
            <Button size="sm" variant="outline" onClick={markAll}>Semua Hadir</Button>
          </div>
          <div className="space-y-3 mt-2">
            {students.map(s => {
              const d = attendanceData[s.id_student] || {}
              return (
                <Card key={s.id_student}>
                  <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Avatar><AvatarFallback>{s.name_student.substring(0,2)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{s.name_student}</p>
                        <p className="text-xs text-muted-foreground">{s.gender_student}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                       <RadioGroup value={d.status} onValueChange={v => handleStatusChange(s.id_student, v)} className="flex gap-2">
                         {['Hadir', 'Sakit', 'Izin', 'Alpha'].map(st => (
                           <div key={st}>
                             <RadioGroupItem value={st} id={`${st}-${s.id_student}`} className="sr-only peer" />
                             <Label htmlFor={`${st}-${s.id_student}`} className="px-3 py-1 border rounded cursor-pointer peer-data-[state=checked]:bg-blue-600 peer-data-[state=checked]:text-white hover:bg-muted text-xs">
                               {st}
                             </Label>
                           </div>
                         ))}
                       </RadioGroup>
                       <Input placeholder="Ket..." className="h-8 w-32" value={d.catatan} onChange={e => handleNoteChange(s.id_student, e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10 flex justify-center md:pl-64">
         <Button className="w-full max-w-md bg-blue-600" onClick={isGeneralActivity ? handleSubmitGeneral : handleSubmitAttendance} disabled={isLoading}>
           {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Simpan
         </Button>
      </div>
    </div>
  )
}