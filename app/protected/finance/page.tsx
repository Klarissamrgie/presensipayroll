import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, CheckCircle2, Eye, XCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ month?: string }>
}

export default async function FinanceDashboard({ searchParams }: Props) {
  const supabase = await createClient()
  const params = await searchParams
  
  // Cek Hak Akses (Opsional, pastikan user adalah finance)
  const { data: { user } } = await supabase.auth.getUser()
  if(!user) redirect('/auth/login')

  // Default: Bulan Ini (YYYY-MM)
  const today = new Date()
  const defaultMonth = params.month || today.toISOString().slice(0, 7) // Contoh: "2024-05"
  
  // Hitung Range Tanggal (Tgl 1 s/d Akhir Bulan)
  const startDate = `${defaultMonth}-01`
  const lastDay = new Date(Number(defaultMonth.split('-')[0]), Number(defaultMonth.split('-')[1]), 0).getDate()
  const endDate = `${defaultMonth}-${lastDay}`

  // 1. Ambil Daftar Guru
  const { data: teachers } = await supabase
    .from('tbteacher')
    .select('id_teacher, nama')
    .eq('role', 'teacher') // Ambil yg role teacher saja
    .order('nama')

  // 2. Ambil Data Pembayaran Bulan Ini
  const { data: payments } = await supabase
    .from('tb_payments')
    .select('*')
    .eq('period', startDate)

  // 3. Ambil Data Absensi (Hadir) Bulan Ini untuk Hitung Gaji
  const { data: attendanceData } = await supabase
    .from('tb_attendance')
    .select(`
      status,
      tbkegiatan!inner (
        tgl_kegiatan,
        tb_activity_teachers!inner (teacher_id)
      ),
      tbstudents (
        tbgrade (harga_grade)
      )
    `)
    .gte('tbkegiatan.tgl_kegiatan', startDate)
    .lte('tbkegiatan.tgl_kegiatan', endDate)
    .eq('status', 'Hadir')

  // 4. Kalkulasi Data per Guru
  const payrollList = teachers?.map(teacher => {
    // Filter absensi milik guru ini
    const myAttendance = attendanceData?.filter((a: any) => 
      a.tbkegiatan.tb_activity_teachers.some((t: any) => t.teacher_id === teacher.id_teacher)
    ) || []

    // Hitung Total Gaji (Jumlah Hadir * Harga Grade)
    const totalSalary = myAttendance.reduce((sum: number, item: any) => {
      const price = Number(item.tbstudents?.tbgrade?.harga_grade) || 0
      return sum + price
    }, 0)

    // Cek Status Bayar
    const payment = payments?.find(p => p.teacher_id === teacher.id_teacher)
    
    return {
      id: teacher.id_teacher,
      name: teacher.nama,
      sessionCount: myAttendance.length,
      totalSalary,
      status: payment?.status || 'Unpaid',
      paymentId: payment?.id
    }
  }) || []

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Finance Dashboard</h1>
          <p className="text-muted-foreground">Periode: {defaultMonth}</p>
        </div>
        
        {/* Filter Bulan */}
        <form className="flex gap-2 items-center">
            <Input 
                type="month" 
                name="month" 
                defaultValue={defaultMonth}
                className="w-40"
            />
            <Button type="submit" size="icon"><Search className="w-4 h-4"/></Button>
        </form>
      </div>

      <Card>
        <CardHeader><CardTitle>Daftar Gaji Guru</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Guru</TableHead>
                <TableHead className="text-center">Total Sesi</TableHead>
                <TableHead className="text-right">Total Gaji</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-center">{item.sessionCount}</TableCell>
                  <TableCell className="text-right font-bold text-slate-700">
                    {formatIDR(item.totalSalary)}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.status === 'Paid' ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                        Paid <CheckCircle2 className="w-3 h-3 ml-1"/>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                        Unpaid
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/protected/finance/salary/${item.id}?month=${defaultMonth}`}>
                        <Eye className="w-4 h-4 mr-2"/> Detail
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}