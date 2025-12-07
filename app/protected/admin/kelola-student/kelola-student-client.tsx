'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { id as indonesia } from 'date-fns/locale'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Icons
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, User, Loader2 } from 'lucide-react'

// --- Types ---
type Option = { id: number; name: string }
type ClassOption = Option & { gradeId: number | null }

type ClientStudent = {
  id: number
  name: string
  gender: string | null
  dob: string | null
  joinDate: string | null
  nationality: string | null
  gradeId: number | null
  gradeName?: string
  classNames?: string
}

type PaginationMeta = {
  currentPage: number
  totalPages: number
  totalItems: number
}

type Props = {
  initialStudents: ClientStudent[]
  initialClasses: ClassOption[]
  initialGrades: Option[]
  pagination: PaginationMeta
}

export default function KelolaStudentClient({
  initialStudents,
  initialClasses,
  initialGrades,
  pagination
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [students, setStudents] = useState<ClientStudent[]>(initialStudents)
  
  // Sinkronisasi data saat navigasi
  useEffect(() => {
    setStudents(initialStudents)
  }, [initialStudents])

  // -- Modal & Loading States --
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // -- Selection State --
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // -- Form State --
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Laki-laki',
    gradeId: '',
    dob: '',
    joinDate: new Date().toISOString().split('T')[0],
    nationality: 'Indonesia'
  })

  // --- Handlers ---

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  const resetForm = () => {
    setFormData({
      name: '', gender: 'Laki-laki', gradeId: '', dob: '', 
      joinDate: new Date().toISOString().split('T')[0],
      nationality: 'Indonesia'
    })
    setSelectedId(null)
    setIsEditMode(false)
  }

  const openAddModal = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditModal = (student: ClientStudent) => {
    setIsEditMode(true)
    setSelectedId(student.id)
    setFormData({
      name: student.name,
      gender: student.gender || 'Laki-laki',
      gradeId: student.gradeId ? String(student.gradeId) : '',
      dob: student.dob || '',
      joinDate: student.joinDate || '',
      nationality: student.nationality || ''
    })
    setIsDialogOpen(true)
  }

  const openDeleteAlert = (id: number) => {
    setSelectedId(id)
    setIsAlertOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const selectedGradeId = formData.gradeId ? Number(formData.gradeId) : null

    const payload = {
      name_student: formData.name,
      gender_student: formData.gender,
      id_grade: selectedGradeId,
      datebirth_student: formData.dob || null,
      joindate_student: formData.joinDate || null,
      nationality: formData.nationality || null
    }

    try {
      if (isEditMode && selectedId) {
        // --- UPDATE ---
        const { error: updateError } = await supabase
          .from('tbstudents')
          .update(payload)
          .eq('id_student', selectedId)

        if (updateError) throw updateError

        // Refresh Kelas (Hapus lama -> Insert baru sesuai grade)
        await supabase.from('tb_student_classes').delete().eq('id_student', selectedId)
        
        const classesToAssign = initialClasses.filter(c => c.gradeId === selectedGradeId)
        if (classesToAssign.length > 0) {
          const classPayload = classesToAssign.map(c => ({
            id_student: selectedId,
            id_kelas: c.id
          }))
          const { error: classError } = await supabase.from('tb_student_classes').insert(classPayload)
          if (classError) throw classError
        }

        router.refresh()
        setIsDialogOpen(false)

      } else {
        // --- INSERT ---
        const { data: newStudentData, error: insertError } = await supabase
          .from('tbstudents')
          .insert(payload)
          .select()
          .single()

        if (insertError) throw insertError

        const newStudentId = newStudentData.id_student

        // Auto Assign Kelas
        const classesToAssign = initialClasses.filter(c => c.gradeId === selectedGradeId)
        if (classesToAssign.length > 0) {
          const classPayload = classesToAssign.map(c => ({
            id_student: newStudentId,
            id_kelas: c.id
          }))
          await supabase.from('tb_student_classes').insert(classPayload)
        }

        router.refresh()
        setIsDialogOpen(false)
      }
    } catch (error: any) {
      alert('Terjadi kesalahan: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setIsLoading(true)

    const { error } = await supabase.from('tbstudents').delete().eq('id_student', selectedId)
    
    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      router.refresh()
    }
    setIsLoading(false)
    setIsAlertOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Daftar Siswa</h2>
          <p className="text-sm text-muted-foreground">
            Total {pagination.totalItems} siswa terdaftar dalam sistem.
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Tambah Siswa
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nama Siswa</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Tgl Lahir</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted p-1.5 rounded-full">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {student.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.gender === 'Laki-laki' ? 'default' : 'secondary'} className="font-normal">
                      {student.gender === 'Laki-laki' ? 'L' : 'P'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                      {student.gradeName}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.nationality}</TableCell>
                  <TableCell>
                    {student.dob ? format(new Date(student.dob), 'dd MMM yyyy', { locale: indonesia }) : '-'}
                  </TableCell>
                  <TableCell>
                    {student.joinDate ? format(new Date(student.joinDate), 'dd MMM yyyy', { locale: indonesia }) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(student)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => openDeleteAlert(student.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Belum ada data siswa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-xs text-muted-foreground">
              Menampilkan {students.length} dari {pagination.totalItems} data
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm font-medium mx-2">
                Hal {pagination.currentPage} / {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* --- DIALOG: Add/Edit Student --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Data Siswa" : "Tambah Siswa Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Nama Siswa" 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Jenis Kelamin</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(val) => setFormData({...formData, gender: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Nationality</Label>
                <Input 
                  value={formData.nationality} 
                  onChange={(e) => setFormData({...formData, nationality: e.target.value})} 
                  placeholder="Indonesia" 
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Grade <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.gradeId} 
                onValueChange={(val) => setFormData({...formData, gradeId: val})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Grade" />
                </SelectTrigger>
                <SelectContent>
                  {initialGrades.map(g => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                *Siswa akan otomatis terdaftar di semua kelas pada Grade ini.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tanggal Lahir</Label>
                <Input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Bergabung</Label>
                <Input type="date" value={formData.joinDate} onChange={(e) => setFormData({...formData, joinDate: e.target.value})} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Simpan Perubahan' : 'Simpan Data'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- ALERT: Delete Confirmation --- */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data siswa dan riwayat kelasnya akan dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDelete(); }} 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}