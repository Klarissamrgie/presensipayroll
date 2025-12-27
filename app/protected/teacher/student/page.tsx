import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Clock, DollarSign, CalendarRange, CheckCircle2, AlertCircle, Eye, Download } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server' 
import StudentFilter from './student-filter' 
import { StudentPagination } from './student-paggination' 
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

interface StudentData {
  name: string
  grade: string
  satuan: number
  frekuensi: number
  jumlah: number
}

// Function to fetch student attendance & calculate payroll
async function getStudentData(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null 
  const currentTeacherId = user.id

  const { data, error } = await supabase
    .from('tbstudents')
    .select(`
      id_student,
      name_student,
      tbgrade (
        name_grade,
        harga_grade
      ),
      tb_attendance (
        status,
        tbkegiatan (
            id_kegiatan,
            tgl_kegiatan,
            tb_activity_teachers (
                teacher_id
            )
        )
      )
    `)
    .order('name_student', { ascending: true })
  
  if (error) {
    console.error('❌ SUPABASE ERROR:', error.message)
    return []
  }

  // Logic: Calculate Fee based on Grade Rate * Frequency of Presence
  const formattedData: StudentData[] = data.map((student: any) => {
    const gradeName = student.tbgrade?.name_grade || 'No Grade'
    const hargaPerSesi = student.tbgrade?.harga_grade ? Number(student.tbgrade.harga_grade) : 0
    const rawAttendance = student.tb_attendance || []
    
    // Filter Attendance
    const listHadirGuruIni = rawAttendance.filter((absen: any) => {
        // 1. Check Status 'Hadir' (Present)
        const statusValid = absen.status && absen.status.trim().toLowerCase() === 'hadir';
        
        // 2. Check Teacher (Must be the current logged-in teacher)
        const teachersInClass = absen.tbkegiatan?.tb_activity_teachers || [];
        const isMyClass = teachersInClass.some((t: any) => t.teacher_id === currentTeacherId);

        // 3. Check Date Filter
        let dateValid = true
        const activityDate = absen.tbkegiatan?.tgl_kegiatan

        if (activityDate) {
            if (activityDate < startDate) dateValid = false;
            if (activityDate > endDate) dateValid = false;
        } else {
            dateValid = false;
        }

        return statusValid && isMyClass && dateValid;
    })

    const frekuensiHadir = listHadirGuruIni.length;
    const totalPendapatan = frekuensiHadir * hargaPerSesi

    return {
      name: student.name_student,
      grade: gradeName,
      satuan: hargaPerSesi,
      frekuensi: frekuensiHadir,
      jumlah: totalPendapatan
    }
  })

  return formattedData
}

type Props = {
    searchParams: Promise<{ startDate?: string, endDate?: string, page?: string }>
}

const Student = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const supabase = await createClient()

  // 0. Get Current User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  // 1. Handle Date Filter (Default to Current Month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');

  const startDate = params.startDate || startOfMonth;
  const endDate = params.endDate || endOfMonth;

  // 2. Fetch All Student Data
  const allStudents = await getStudentData(startDate, endDate)
  if (allStudents === null) redirect('/auth/login')

  // 3. Fetch Payment Status from Finance (tb_payments)
  // We check if a payment record exists for this teacher in this period (startDate)
  const { data: payment } = await supabase
    .from('tb_payments')
    .select('*')
    .eq('teacher_id', user.id)
    .eq('period', startDate) // Matches the 'period' string saved by Finance module
    .single()

  const isPaid = payment?.status === 'Paid'
  const proofUrl = payment?.proof_file 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/finance/${payment.proof_file}`
    : null
  
  // 4. Calculate Summaries
  const activeStudents = allStudents.filter(s => s.frekuensi > 0).length
  const totalWorkHours = allStudents.reduce((sum, student) => sum + student.frekuensi, 0)
  const totalSalary = allStudents.reduce((sum, student) => sum + student.jumlah, 0)

  // 5. Pagination Logic
  const currentPage = Number(params.page) || 1
  const ITEMS_PER_PAGE = 10 
  const totalData = allStudents.length
  const totalPages = Math.ceil(totalData / ITEMS_PER_PAGE)

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedStudents = allStudents.slice(startIndex, endIndex)

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">My Student Payroll</h1>
        <p className="text-muted-foreground text-sm">
            View your class attendance and calculated payroll.
        </p>
      </div>

      {/* --- PAYMENT STATUS ALERT --- */}
      {isPaid ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-green-800">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-bold text-lg">Payment Received / Lunas</h3>
              <p className="text-sm opacity-90">
                Finance has transferred your salary for this period on {new Date(payment.paid_at).toLocaleDateString()}.
              </p>
            </div>
          </div>
          {proofUrl && (
             <Button variant="outline" className="bg-white hover:bg-green-100 border-green-300 text-green-700" asChild>
                <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="w-4 h-4 mr-2" />
                  View Proof of Transfer
                </a>
             </Button>
          )}
        </div>
      ) : (
         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3 text-yellow-800 shadow-sm">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
               <h3 className="font-semibold text-sm">Pending Payment</h3>
               <p className="text-xs opacity-90">
                 Finance has not yet uploaded proof of transfer for this period.
               </p>
            </div>
         </div>
      )}

      {/* --- FILTER COMPONENT --- */}
      <StudentFilter />

      {/* --- INFO FILTER AKTIF --- */}
      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
          <CalendarRange className="w-4 h-4" />
          <span>
              Period: <b>{startDate}</b> to <b>{endDate}</b>
          </span>
      </div>

      {/* --- CARDS SUMMARY --- */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-500 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Active Students</CardTitle>
            <Users className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
            <p className="text-xs text-red-100">Students present this month</p>
          </CardContent>
        </Card>

        <Card className='bg-[#8C84D9] text-white border-none shadow-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Sessions</CardTitle>
            <Clock className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkHours}</div>
            <p className="text-xs text-indigo-100">Total sessions taught</p>
          </CardContent>
        </Card>

        <Card className='bg-[#1D94AC] text-white border-none shadow-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Estimated Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIDR(totalSalary)}</div>
            <p className="text-xs text-cyan-100">Calculated based on grade rates</p>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLE DETAILS --- */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payroll Detail per Student</CardTitle>
              <CardDescription>Breakdown of fees based on attendance frequency.</CardDescription>
            </div>
            {isPaid && (
              <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-4 font-semibold text-muted-foreground">Student Name</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Grade</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Rate (IDR)</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Frequency</th>
                  <th className="text-right p-4 font-semibold text-muted-foreground">Total (IDR)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{student.name}</td>
                    <td className="p-4">{student.grade}</td>
                    <td className="p-4 text-muted-foreground">{formatIDR(student.satuan)}</td>
                    <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${student.frekuensi > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                          {student.frekuensi}
                        </span>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">
                      {formatIDR(student.jumlah)}
                    </td>
                  </tr>
                ))}
                
                {paginatedStudents.length === 0 && (
                   <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No students found for this period</td></tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <StudentPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalData={totalData}
            />

          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Student