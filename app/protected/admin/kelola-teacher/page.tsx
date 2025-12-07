import { createClient } from '@/lib/supabase/server'
import KelolaTeacherClient from './kelola-teacher-client'

export const dynamic = 'force-dynamic'

export default async function KelolaTeacherPage() {
  const supabase = await createClient()

  // Fetch data Guru dan Kelas
  const [teachersRes, classesRes] = await Promise.all([
    supabase
      .from('tbteacher')
      .select(`
        id_teacher,
        nama,
        gender,
        tgl_lahir,
        email,
        tb_teacher_classes (
          tbkelas (id_kelas, name_kelas)
        )
      `)
      .order('nama', { ascending: true }),
      
    supabase.from('tbkelas').select('id_kelas, name_kelas').order('name_kelas'),
  ])

  // Mapping Data Teacher
  const teachers = teachersRes.data?.map((t: any) => ({
    id: t.id_teacher,
    name: t.nama || '-',
    gender: t.gender || '-',
    dob: t.tgl_lahir || null,
    email: t.email || '-',
    // Ambil ID dan Nama Kelas dari relasi
    classIds: t.tb_teacher_classes?.map((tc: any) => tc.tbkelas?.id_kelas) || [],
    classNames: t.tb_teacher_classes?.map((tc: any) => tc.tbkelas?.name_kelas).join(', ') || '-'
  })) || []

  // Mapping Data Kelas untuk Dropdown/Select
  const classes = classesRes.data?.map((c: any) => ({
    id: c.id_kelas,
    name: c.name_kelas || 'Unnamed'
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin Panel</p>
        <h1 className="text-3xl font-semibold">Kelola User (Teacher)</h1>
      </div>

      <KelolaTeacherClient
        initialTeachers={teachers}
        initialClasses={classes}
      />
    </div>
  )
}