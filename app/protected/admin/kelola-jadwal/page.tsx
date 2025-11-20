import { createClient } from '@/lib/supabase/server'
import KelolaTeacherClient, {
  ActivityOption,
  ClassOption,
  GradeOption,
  StudentOption,
  TeacherOption,
} from './kelola-teacher-client'

const FALLBACK_ERROR_MESSAGE =
  'Tidak dapat memuat data dari Supabase. Pastikan tabel sudah tersedia.'

const KelolaJadwalPage = async () => {
  const supabase = await createClient()

  const [teachersRes, classesRes, studentsRes, gradesRes, activitiesRes] = await Promise.all([
    supabase
      .from('tbTeacher')
      .select('id_teacher, nama')
      .order('nama', { ascending: true }),
    supabase
      .from('tbKelas')
      .select('id_kelas, name_kelas, id_grade')
      .order('name_kelas', { ascending: true }),
    supabase
      .from('tbStudents')
      .select('id_student, name_student, id_kelas')
      .order('name_student', { ascending: true }),
    supabase
      .from('tbgrade')
      .select('id_grade, name_grade')
      .order('name_grade', { ascending: true }),
    supabase
      .from('tbKegiatan')
      .select(
        'id_kegiatan, nama_kegiatan, tgl_kegiatan, jam_kegiatan, id_teacher, id_kelas, id_student',
      )
      .order('tgl_kegiatan', { ascending: false })
      .limit(50),
  ])

  const teachers: TeacherOption[] =
    teachersRes.data?.map((teacher) => ({
      id: teacher.id_teacher,
      nama: teacher.nama ?? 'Tanpa nama',
    })) ?? []

  const classes: ClassOption[] =
    classesRes.data?.map((kelas) => ({
      id: kelas.id_kelas,
      name: kelas.name_kelas ?? `Kelas ${kelas.id_kelas}`,
      gradeId: kelas.id_grade ?? null,
    })) ?? []

  const students: StudentOption[] =
    studentsRes.data?.map((student) => ({
      id: student.id_student,
      name: student.name_student ?? `Student ${student.id_student}`,
      classId: student.id_kelas ?? null,
    })) ?? []

  const grades: GradeOption[] =
    gradesRes.data?.map((grade) => ({
      id: grade.id_grade,
      name: grade.name_grade ?? `Grade ${grade.id_grade}`,
    })) ?? []

  const activities: ActivityOption[] =
    activitiesRes.data?.map((activity) => ({
      id: activity.id_kegiatan,
      namaKegiatan: activity.nama_kegiatan ?? 'Tanpa nama',
      tanggal: activity.tgl_kegiatan ?? null,
      jam: activity.jam_kegiatan ?? null,
      teacherId: activity.id_teacher ?? null,
      classId: activity.id_kelas ?? null,
      studentId: activity.id_student ?? null,
    })) ?? []

  const hasError = [
    teachersRes.error,
    classesRes.error,
    studentsRes.error,
    gradesRes.error,
    activitiesRes.error,
  ].some(Boolean)

  return (
    <KelolaTeacherClient
      teachers={teachers}
      classes={classes}
      grades={grades}
      students={students}
      activities={activities}
      errorMessage={hasError ? FALLBACK_ERROR_MESSAGE : undefined}
    />
  )
}

export default KelolaJadwalPage

