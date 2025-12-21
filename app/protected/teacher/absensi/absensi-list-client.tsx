'use client'
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { id as indonesia } from 'date-fns/locale'
import { Calendar, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function AbsensiListClient({ initialData }: { initialData: any[] }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Riwayat Mengajar</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kegiatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length > 0 ? (
                initialData.map((item) => (
                  <TableRow key={item.id_kegiatan}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(item.tgl_kegiatan), 'dd MMM yyyy', { locale: indonesia })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{item.nama_kegiatan}</div>
                      <div className="text-xs text-muted-foreground">{item.className}</div>
                    </TableCell>
                    <TableCell>
                      {item.isDone ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Selesai</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 bg-orange-50">Belum</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant={item.isDone ? "outline" : "default"}>
                        <Link href={`/protected/teacher/absensi?kegiatan=${item.id_kegiatan}`}>
                          {item.isDone ? 'Edit' : 'Isi'} <ChevronRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="text-center h-24">Tidak ada data.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}