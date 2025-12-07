import { createClient } from '@/lib/supabase/server'
import KelolaGradeClient from './kelola-grade-client'

export const dynamic = 'force-dynamic'

export default async function KelolaGradePage() {
  const supabase = await createClient()

  // Fetch data grade
  const { data } = await supabase
    .from('tbgrade')
    .select('*')
    .order('name_grade', { ascending: true })

  // Mapping data untuk client
  const grades = data?.map((g: any) => ({
    id: g.id_grade,
    name: g.name_grade,
    price: g.harga_grade
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin Panel</p>
        <h1 className="text-3xl font-semibold">Kelola Grade & Harga</h1>
      </div>

      <KelolaGradeClient initialGrades={grades} />
    </div>
  )
}