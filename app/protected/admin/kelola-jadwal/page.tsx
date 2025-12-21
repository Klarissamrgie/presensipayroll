import { createClient } from '@/lib/supabase/server'
import KelolaJadwalClient from './kelola-jadwal-client'

export const dynamic = 'force-dynamic'

export default async function KelolaJadwalPage() {
  const supabase = await createClient()

  // Ambil data secara paralel untuk performa
  const [teachersRes, classesRes, studentsRes, activitiesRes] = await Promise.all([
    // 1. Data Guru
    supabase.from('tbteacher').select('id_teacher, nama').order('nama'),
    
    // 2. Data Kelas
    supabase.from('tbkelas').select('id_kelas, name_kelas').order('name_kelas'),
    
    // 3. Data Siswa beserta Kelas yang diikuti (untuk filter dropdown)
    supabase
      .from('tbstudents')
      .select(`
        id_student, 
        name_student,
        tb_student_classes (
          id_kelas
        )
      `)
      .order('name_student'),
      
    // 4. Data Kegiatan/Jadwal yang sudah ada
    supabase
      .from('tbkegiatan')
      .select(`
        id_kegiatan,
        nama_kegiatan,
        tgl_kegiatan,
        jam_mulai,
        jam_selesai,
        id_kelas,
        id_student,
        tbkelas (name_kelas),
        tb_activity_teachers (
          tbteacher (
            id_teacher,
            nama
          )
        )
      `)
      .order('tgl_kegiatan', { ascending: false }),
  ])

  // --- MAPPING DATA AGAR MUDAH DIBACA CLIENT ---

  const teachers = teachersRes.data?.map((t: any) => ({ 
    id: t.id_teacher, 
    name: t.nama || 'Unnamed' 
  })) || []

  const classes = classesRes.data?.map((c: any) => ({ 
    id: c.id_kelas, 
    name: c.name_kelas || 'Unnamed' 
  })) || []

  // Mapping Siswa: Flatten array kelas agar mudah difilter
  const students = studentsRes.data?.map((s: any) => ({
    id: s.id_student,
    name: s.name_student || 'Unnamed',
    classIds: s.tb_student_classes?.map((sc: any) => sc.id_kelas) || []
  })) || []

  // Mapping Kegiatan: Ambil guru dari tabel relasi
  const activities = activitiesRes.data?.map((a: any) => {
    const assignedTeachers = a.tb_activity_teachers?.map((rel: any) => ({
      id: rel.tbteacher?.id_teacher,
      name: rel.tbteacher?.nama
    })) || []

    return {
      id: a.id_kegiatan,
      title: a.nama_kegiatan,
      date: a.tgl_kegiatan,
      startTime: a.jam_mulai,
      endTime: a.jam_selesai,
      teachers: assignedTeachers, 
      classId: a.id_kelas,
      studentId: a.id_student,
      className: a.tbkelas?.name_kelas,
    }
  }) || []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin Panel</p>
        <h1 className="text-3xl font-semibold">Kelola Jadwal & Kegiatan</h1>
      </div>

      <KelolaJadwalClient 
        initialTeachers={teachers}
        initialClasses={classes}
        initialStudents={students} 
        initialActivities={activities}
      />
    </div>
  )
}