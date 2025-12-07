import { createClient } from '@/lib/supabase/server'
import KelolaStudentClient from './kelola-student-client'

export const dynamic = 'force-dynamic'

// Definisikan tipe Props untuk menangkap searchParams
type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function KelolaStudentPage({ searchParams }: Props) {
  const supabase = await createClient()
  
  // 1. Setup Pagination
  const params = await searchParams
  const currentPage = Number(params?.page) || 1
  const itemsPerPage = 10 // Jumlah item per halaman
  const from = (currentPage - 1) * itemsPerPage
  const to = from + itemsPerPage - 1

  // 2. Fetch Data dengan Pagination
  const [studentsRes, classesRes, gradesRes] = await Promise.all([
    supabase
      .from('tbstudents')
      .select(`
        id_student,
        name_student,
        gender_student,
        datebirth_student,
        joindate_student,
        nationality,
        id_grade,
        tbgrade (name_grade),
        tb_student_classes (
           tbkelas (name_kelas)
        )
      `, { count: 'exact' }) // Request total count
      .order('name_student', { ascending: true })
      .range(from, to), // Terapkan pagination di database level
      
    supabase.from('tbkelas').select('id_kelas, name_kelas, id_grade').order('name_kelas'),
    supabase.from('tbgrade').select('id_grade, name_grade').order('name_grade'),
  ])

  // 3. Hitung Metadata Pagination
  const totalItems = studentsRes.count || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Mapping data Student
  const students = studentsRes.data?.map((s: any) => ({
    id: s.id_student,
    name: s.name_student,
    gender: s.gender_student,
    dob: s.datebirth_student,
    joinDate: s.joindate_student,
    nationality: s.nationality || '-',
    gradeId: s.id_grade,
    gradeName: s.tbgrade?.name_grade || '-',
    classNames: s.tb_student_classes?.map((item: any) => item.tbkelas?.name_kelas).join(', ') || '-'
  })) || []

  // Mapping data Kelas
  const classes = classesRes.data?.map((c: any) => ({
    id: c.id_kelas,
    name: c.name_kelas || 'Unnamed',
    gradeId: c.id_grade
  })) || []

  // Mapping data Grade
  const grades = gradesRes.data?.map((g: any) => ({
    id: g.id_grade,
    name: g.name_grade || 'Unnamed'
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin Panel</p>
        <h1 className="text-3xl font-semibold">Kelola Student</h1>
      </div>

      <KelolaStudentClient
        initialStudents={students}
        initialClasses={classes}
        initialGrades={grades}
        pagination={{
          currentPage,
          totalPages,
          totalItems
        }}
      />
    </div>
  )
}