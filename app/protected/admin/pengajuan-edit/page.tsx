import { createClient } from '@/lib/supabase/server'
import { approveEditRequest, rejectEditRequest } from '@/app/protected/teacher/absensi/edit-workflow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

// Agar data selalu fresh
export const dynamic = 'force-dynamic'

export default async function AdminRequestPage() {
  const supabase = await createClient()

  // FIX: Ambil data guru melalui junction table 'tb_activity_teachers'
  // karena relasi langsung 'tbteacher' di tbkegiatan mungkin kosong/tidak dipakai.
  const { data: requests, error } = await supabase
    .from('tbkegiatan')
    .select(`
      id_kegiatan,
      nama_kegiatan,
      tgl_kegiatan,
      jam_mulai,
      jam_selesai,
      tb_activity_teachers (
        tbteacher ( nama )
      )
    `)
    .eq('request_edit_status', 'pending')
    .order('tgl_kegiatan', { ascending: false })

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pengajuan Edit Absensi</h1>
        <p className="text-slate-500">Setujui permintaan guru untuk mengedit absensi yang sudah selesai.</p>
      </div>

      {(!requests || requests.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Check className="w-12 h-12 mb-4 text-green-200" />
            <p>Tidak ada pengajuan baru.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map((req: any) => {
            // Helper untuk mengambil nama guru dari array junction table
            // Ambil guru pertama jika ada, atau fallback '-'
            const teacherName = req.tb_activity_teachers?.[0]?.tbteacher?.nama || '-'

            return (
              <Card key={req.id_kegiatan} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Request Pending
                    </Badge>
                    <span className="text-xs text-slate-400">{req.tgl_kegiatan}</span>
                  </div>
                  <CardTitle className="text-lg mt-2">{req.nama_kegiatan}</CardTitle>
                  <p className="text-sm font-medium text-slate-600">Guru: {teacherName}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-500 mb-6">
                    Jam: {req.jam_mulai} - {req.jam_selesai}
                  </div>
                  
                  <div className="flex gap-3 w-full">
                    {/* Form Action untuk Reject */}
                    <form action={rejectEditRequest.bind(null, req.id_kegiatan)} className="flex-1">
                      <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        <X className="w-4 h-4 mr-2" /> Tolak
                      </Button>
                    </form>

                    {/* Form Action untuk Approve */}
                    <form action={approveEditRequest.bind(null, req.id_kegiatan)} className="flex-1">
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Check className="w-4 h-4 mr-2" /> Izinkan
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}