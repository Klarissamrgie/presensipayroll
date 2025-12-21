'use client'
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { id as indonesia } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import ActivityActionButton from './activity-action-button' // <--- Import Component Baru

export default function AbsensiListClient({ initialData }: { initialData: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Riwayat Mengajar</h1>
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
          Total: {initialData.length} Kegiatan
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tanggal</TableHead>
                <TableHead>Kegiatan / Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length > 0 ? (
                initialData.map((item) => (
                  <TableRow key={item.id_kegiatan} className="hover:bg-muted/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {format(new Date(item.tgl_kegiatan), 'dd MMM yyyy', { locale: indonesia })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{item.nama_kegiatan}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.className}</div>
                    </TableCell>
                    <TableCell>
                      {item.isDone ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none">
                          Selesai
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                          Belum Absen
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* IMPLEMENTASI TOMBOL CERDAS */}
                      <ActivityActionButton 
                        id={item.id_kegiatan}
                        isDone={item.isDone}
                        requestStatus={item.requestStatus}
                        isEditable={item.isEditable}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                    Belum ada jadwal mengajar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}