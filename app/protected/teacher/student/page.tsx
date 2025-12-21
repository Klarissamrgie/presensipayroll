import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, DollarSign } from 'lucide-react'
import { redirect } from 'next/navigation'
// UBAH IMPORT INI: Gunakan helper server yang baru dibuat
import { createClient } from '@/lib/supabase/server' 

// Force dynamic agar tidak di-cache statis
export const dynamic = 'force-dynamic'

interface StudentData {
  name: string
  grade: string
  satuan: number
  frekuensi: number
  jumlah: number
}

async function getStudentData() {
  // 1. BUAT CLIENT KHUSUS SERVER
  // Client ini bisa membaca cookies browser, jadi user tidak akan ter-logout
  const supabase = await createClient()

  console.log("--- START FETCHING DATA (SERVER SIDE) ---")

  // 2. CEK USER LOGIN
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.log("User tidak terdeteksi (Cookie mungkin kosong/expired)")
    return null 
  }

  const currentTeacherId = user.id
  console.log("👮 Logged in Teacher ID:", currentTeacherId)

  // 3. QUERY DATABASE
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
            id_teacher
        )
      )
    `)
    .order('name_student', { ascending: true })
  
  if (error) {
    console.error('❌ SUPABASE ERROR:', error.message)
    return []
  }

  // 4. MAPPING & FILTERING
  const formattedData: StudentData[] = data.map((student: any) => {
    // A. Grade & Harga
    const gradeName = student.tbgrade?.name_grade || 'No Grade'
    const hargaPerSesi = student.tbgrade?.harga_grade ? Number(student.tbgrade.harga_grade) : 0

    // B. Filter Absensi Khusus Guru Ini
    const rawAttendance = student.tb_attendance || []
    
    const listHadirGuruIni = rawAttendance.filter((absen: any) => {
        // Cek Status 'Hadir' (Case insensitive safe)
        const statusValid = absen.status && absen.status.trim().toLowerCase() === 'hadir';
        
        // Cek apakah kegiatan ini milik guru yang login
        const isMyClass = absen.tbkegiatan?.id_teacher === currentTeacherId;

        return statusValid && isMyClass;
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

const Student = async () => {
  const students = await getStudentData()

  // 🔴 JIKA NULL (BELUM LOGIN), REDIRECT
  if (students === null) {
      redirect('/auth/login') // Pastikan URL login Anda benar
  }
  
  // Hitung Summary
  const totalStudents = students.length
  const totalWorkHours = students.reduce((sum, student) => sum + student.frekuensi, 0)
  const totalSalary = students.reduce((sum, student) => sum + student.jumlah, 0)

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
        <h1 className="text-3xl font-bold">My Payroll & Student Data</h1>
        <p className="text-muted-foreground text-sm">
            Menampilkan data siswa & gaji berdasarkan kelas yang <u>Anda</u> ajar.
        </p>
      </div>

      {/* --- CARDS --- */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-500 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Students</CardTitle>
            <Users className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-red-100">Siswa dalam database</p>
          </CardContent>
        </Card>

        <Card className='bg-[#8C84D9] text-white border-none shadow-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">My Sessions</CardTitle>
            <Clock className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkHours}</div>
            <p className="text-xs text-indigo-100">Total sesi yang Anda ajar</p>
          </CardContent>
        </Card>

        <Card className='bg-[#1D94AC] text-white border-none shadow-md'>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">My Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIDR(totalSalary)}</div>
            <p className="text-xs text-cyan-100">Estimasi pendapatan Anda</p>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLE --- */}
      <Card>
        <CardHeader>
          <CardTitle>Rincian Gaji Per Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left p-4 font-semibold text-muted-foreground">Nama Siswa</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Grade</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Rate</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Freq (My Class)</th>
                  <th className="text-right p-4 font-semibold text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
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
                
                {students.length === 0 && (
                   <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Data tidak ditemukan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Student