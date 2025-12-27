import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Download } from 'lucide-react'
import Link from 'next/link'
import UploadProofButton from './upload-proof-button' // Import Client Component

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string }>
}

export default async function TeacherSalaryDetail({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { id: teacherId } = await params
  const { month } = await searchParams

  const today = new Date()
  const selectedMonth = month || today.toISOString().slice(0, 7)
  const startDate = `${selectedMonth}-01`
  const lastDay = new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate()
  const endDate = `${selectedMonth}-${lastDay}`

  // 1. Ambil Info Guru
  const { data: teacher } = await supabase.from('tbteacher').select('nama').eq('id_teacher', teacherId).single()

  // 2. Ambil Status Pembayaran
  const { data: payment } = await supabase
    .from('tb_payments')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('period', startDate)
    .single()

  // 3. Ambil Detail Kehadiran (Logic yang sama dengan menu student guru)
  const { data: students } = await supabase
    .from('tbstudents')
    .select(`
      name_student,
      tbgrade (name_grade, harga_grade),
      tb_attendance (
        status,
        tbkegiatan!inner (
            tgl_kegiatan,
            tb_activity_teachers!inner (teacher_id)
        )
      )
    `)
    .eq('tb_attendance.tbkegiatan.tb_activity_teachers.teacher_id', teacherId)
    .gte('tb_attendance.tbkegiatan.tgl_kegiatan', startDate)
    .lte('tb_attendance.tbkegiatan.tgl_kegiatan', endDate)

  // Hitung Detail
  let grandTotal = 0
  const detailPayroll = students?.map((s: any) => {
    // Filter hanya kehadiran yang diajar oleh guru ini
    const validAttendance = s.tb_attendance.filter((a: any) => 
        a.status === 'Hadir' && 
        a.tbkegiatan.tb_activity_teachers.some((t: any) => t.teacher_id === teacherId)
    )
    
    const count = validAttendance.length
    if (count === 0) return null

    const price = s.tbgrade?.harga_grade || 0
    const total = count * price
    grandTotal += total

    return {
      name: s.name_student,
      grade: s.tbgrade?.name_grade,
      count,
      price,
      total
    }
  }).filter(Boolean) || []

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href={`/protected/finance?month=${selectedMonth}`}><ArrowLeft className="w-5 h-5"/></Link>
        </Button>
        <div>
            <h1 className="text-2xl font-bold">Rincian Gaji: {teacher?.nama}</h1>
            <p className="text-muted-foreground">Periode: {selectedMonth}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Kiri: Tabel Rincian */}
        <div className="md:col-span-2">
            <Card>
                <CardHeader><CardTitle>Detail Per Siswa</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Siswa</TableHead>
                                <TableHead className="text-center">Hadir</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detailPayroll.map((item: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.grade}</div>
                                    </TableCell>
                                    <TableCell className="text-center">{item.count}</TableCell>
                                    <TableCell className="text-right">{formatIDR(item.price)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatIDR(item.total)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Kanan: Panel Pembayaran & Upload */}
        <div>
            <Card className="sticky top-6 border-l-4 border-l-blue-600">
                <CardHeader>
                    <CardTitle>Total Transfer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <span className="text-3xl font-bold text-slate-800">{formatIDR(grandTotal)}</span>
                    </div>

                    {/* LOGIC STATUS BAYAR */}
                    {payment?.status === 'Paid' ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3 text-center">
                            <div className="flex flex-col items-center text-green-700">
                                <CheckCircle2 className="w-12 h-12 mb-2"/>
                                <span className="font-bold text-lg">LUNAS / PAID</span>
                                <span className="text-xs opacity-80">Dibayar: {new Date(payment.paid_at).toLocaleDateString()}</span>
                            </div>
                            
                            {payment.proof_file && (
                                <div className="pt-2 border-t border-green-200">
                                    <p className="text-xs font-medium text-green-800 mb-2">Bukti Transfer:</p>
                                    <div className="relative aspect-video bg-white rounded border overflow-hidden mb-2">
                                        <img 
                                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/finance/${payment.proof_file}`} 
                                            alt="Bukti" 
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full bg-white hover:bg-green-100" asChild>
                                        <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/finance/${payment.proof_file}`} target="_blank" download>
                                            <Download className="w-4 h-4 mr-2"/> Download
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
                            <div className="text-center text-orange-700 font-medium">Belum Dibayar</div>
                            
                            {grandTotal > 0 && (
                                <>
                                    <div className="text-xs text-muted-foreground text-center">
                                        Upload bukti transfer untuk mengubah status menjadi <b>Paid</b>.
                                    </div>
                                    {/* Client Component Button */}
                                    <UploadProofButton 
                                        teacherId={teacherId} 
                                        periodStr={startDate} 
                                        amount={grandTotal} 
                                    />
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}