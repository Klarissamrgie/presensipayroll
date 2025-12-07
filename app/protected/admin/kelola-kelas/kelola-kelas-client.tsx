'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// UI Components
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Pencil, Trash2, School, Loader2 } from 'lucide-react'

// --- Types ---
type Option = { id: number; name: string }

type ClientClass = {
  id: number
  name: string
  gradeId: number | null
  gradeName: string
}

type Props = {
  initialClasses: ClientClass[]
  initialGrades: Option[]
}

export default function KelolaKelasClient({ initialClasses, initialGrades }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [classes, setClasses] = useState<ClientClass[]>(initialClasses)
  const [isLoading, setIsLoading] = useState(false)

  // -- Modal States --
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // -- Selection & Form State --
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    gradeId: ''
  })

  // --- Handlers ---

  const resetForm = () => {
    setFormData({ name: '', gradeId: '' })
    setSelectedId(null)
    setIsEditMode(false)
  }

  const openAddModal = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditModal = (cls: ClientClass) => {
    setIsEditMode(true)
    setSelectedId(cls.id)
    setFormData({
      name: cls.name,
      gradeId: cls.gradeId ? String(cls.gradeId) : ''
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

    const payload = {
      name_kelas: formData.name,
      id_grade: formData.gradeId ? Number(formData.gradeId) : null
    }

    try {
      if (isEditMode && selectedId) {
        // --- UPDATE ---
        const { error } = await supabase
          .from('tbkelas')
          .update(payload)
          .eq('id_kelas', selectedId)

        if (error) throw error

        // Optimistic Update
        const updatedGradeName = initialGrades.find(g => String(g.id) === formData.gradeId)?.name || '-'
        setClasses(prev => prev.map(c => 
          c.id === selectedId 
            ? { ...c, name: payload.name_kelas, gradeId: payload.id_grade, gradeName: updatedGradeName } 
            : c
        ))
      } else {
        // --- CREATE ---
        const { data, error } = await supabase
          .from('tbkelas')
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        // Optimistic Update
        const newData: any = data
        const newGradeName = initialGrades.find(g => g.id === newData.id_grade)?.name || '-'
        
        setClasses(prev => [...prev, {
          id: newData.id_kelas,
          name: newData.name_kelas,
          gradeId: newData.id_grade,
          gradeName: newGradeName
        }])
      }
      
      setIsDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setIsLoading(true)

    const { error } = await supabase.from('tbkelas').delete().eq('id_kelas', selectedId)
    
    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      setClasses(prev => prev.filter(c => c.id !== selectedId))
      router.refresh()
    }
    setIsLoading(false)
    setIsAlertOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex justify-end">
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Tambah Kelas
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Grade (Tingkat)</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted p-1.5 rounded-full">
                        <School className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {cls.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {cls.gradeName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(cls)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => openDeleteAlert(cls.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Belum ada data kelas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- DIALOG: Add/Edit Class --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Nama Kelas</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Contoh: Kelas 1A, Matematika Dasar" 
                required 
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Grade (Tingkat) <span className="text-red-500">*</span></Label>
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
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- ALERT: Delete Confirmation --- */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Menghapus kelas mungkin akan mempengaruhi data jadwal atau siswa yang terdaftar di kelas ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDelete(); }} 
              className="bg-red-600 hover:bg-red-700 text-white"
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