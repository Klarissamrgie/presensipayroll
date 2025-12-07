import { createClient } from '@/lib/supabase/server'
import KelolaKelasClient from './kelola-kelas-client'

export const dynamic = 'force-dynamic'

export default async function KelolaKelasPage() {
  const supabase = await createClient()

  // Fetch Kelas (dengan relasi Grade) dan List Grade
  const [classesRes, gradesRes] = await Promise.all([
    supabase
      .from('tbkelas')
      .select(`
        id_kelas,
        name_kelas,
        id_grade,
        tbgrade (name_grade)
      `)
      .order('name_kelas', { ascending: true }),
    supabase
      .from('tbgrade')
      .select('id_grade, name_grade')
      .order('name_grade', { ascending: true })
  ])

  // Mapping Data Kelas
  const classes = classesRes.data?.map((c: any) => ({
    id: c.id_kelas,
    name: c.name_kelas || '-',
    gradeId: c.id_grade,
    gradeName: c.tbgrade?.name_grade || '-'
  })) || []

  // Mapping Data Grade
  const grades = gradesRes.data?.map((g: any) => ({
    id: g.id_grade,
    name: g.name_grade || 'Unnamed'
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin Panel</p>
        <h1 className="text-3xl font-semibold">Kelola Kelas</h1>
      </div>

      <KelolaKelasClient 
        initialClasses={classes} 
        initialGrades={grades} 
      />
    </div>
  )
}