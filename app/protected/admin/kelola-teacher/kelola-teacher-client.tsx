'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createTeacherAction } from './actions' // Pastikan file actions.ts ada

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// Icons
import { Plus, Pencil, Trash2, Check, ChevronsUpDown, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
type ClassOption = { id: number; name: string }

type ClientTeacher = {
  id: string // UUID
  name: string
  gender: string
  dob: string | null
  email: string
  classIds: number[]
  classNames: string
}

type Props = {
  initialTeachers: ClientTeacher[]
  initialClasses: ClassOption[]
}

export default function KelolaTeacherClient({
  initialTeachers,
  initialClasses,
}: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [teachers, setTeachers] = useState<ClientTeacher[]>(initialTeachers)
  
  useEffect(() => {
    setTeachers(initialTeachers)
  }, [initialTeachers])

  // -- Modal & Loading States --
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // -- Selection State --
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // -- Form State --
  const [formData, setFormData] = useState({
    name: '',
    gender: 'Laki-laki',
    email: '',
    password: '',
    dob: '',
    classIds: [] as number[]
  })

  // --- Handlers ---

  const resetForm = () => {
    setFormData({
      name: '', gender: 'Laki-laki', email: '', password: '', dob: '', classIds: []
    })
    setSelectedId(null)
    setIsEditMode(false)
  }

  const openAddModal = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditModal = (teacher: ClientTeacher) => {
    setIsEditMode(true)
    setSelectedId(teacher.id)
    setFormData({
      name: teacher.name,
      gender: teacher.gender,
      email: teacher.email,
      password: '', // Password kosong saat edit
      dob: teacher.dob || '',
      classIds: teacher.classIds
    })
    setIsDialogOpen(true)
  }

  const openDeleteAlert = (id: string) => {
    setSelectedId(id)
    setIsAlertOpen(true)
  }

  const toggleClass = (classId: number) => {
    setFormData(prev => {
      const exists = prev.classIds.includes(classId)
      return {
        ...prev,
        classIds: exists 
          ? prev.classIds.filter(id => id !== classId)
          : [...prev.classIds, classId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isEditMode && selectedId) {
        // --- UPDATE (Profil Guru) ---
        const payload = {
          nama: formData.name,
          gender: formData.gender,
          email: formData.email,
          tgl_lahir: formData.dob || null
        }

        const { error: updateError } = await supabase
          .from('tbteacher')
          .update(payload)
          .eq('id_teacher', selectedId)

        if (updateError) throw updateError

        // Update Relasi Kelas (Hapus lama -> Insert baru)
        await supabase.from('tb_teacher_classes').delete().eq('id_teacher', selectedId)
        
        if (formData.classIds.length > 0) {
          const classPayload = formData.classIds.map(cId => ({
            id_teacher: selectedId,
            id_kelas: cId
          }))
          const { error: relError } = await supabase.from('tb_teacher_classes').insert(classPayload)
          if (relError) throw relError
        }

        router.refresh()
        setIsDialogOpen(false)

      } else {
        // --- INSERT (Buat User Auth + Profil) ---
        if (!formData.password || formData.password.length < 6) {
          alert("Password wajib diisi minimal 6 karakter.")
          setIsLoading(false)
          return
        }

        // Panggil Server Action untuk membuat user auth
        const result = await createTeacherAction({
          name: formData.name,
          gender: formData.gender,
          email: formData.email,
          password: formData.password,
          dob: formData.dob,
          classIds: formData.classIds
        })

        if (result?.error) {
          alert(result.error)
        } else {
          setIsDialogOpen(false)
          // Tidak perlu refresh manual karena server action melakukan revalidatePath
        }
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

    // Note: Hapus data di tbteacher saja (Auth user tetap ada, atau bisa dihapus via Admin Console)
    const { error } = await supabase.from('tbteacher').delete().eq('id_teacher', selectedId)
    
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
          <h2 className="text-2xl font-bold tracking-tight">Daftar Guru</h2>
          <p className="text-sm text-muted-foreground">
            Kelola data akun guru dan penugasan kelas.
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Tambah Teacher
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Guru</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[30%]">Kelas Ajar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted p-1.5 rounded-full">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {teacher.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.gender === 'Laki-laki' ? 'default' : 'secondary'} className="font-normal">
                      {teacher.gender === 'Laki-laki' ? 'L' : 'P'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                  <TableCell>
                    {teacher.classIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teacher.classIds.slice(0, 3).map(cid => (
                          <Badge key={cid} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            {initialClasses.find(c => c.id === cid)?.name}
                          </Badge>
                        ))}
                        {teacher.classIds.length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">+{teacher.classIds.length - 3}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">Belum ada kelas</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditModal(teacher)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => openDeleteAlert(teacher.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Belum ada data guru.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- DIALOG: Add/Edit Teacher --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Data Guru" : "Buat Akun Guru Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Nama Lengkap" 
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
                <Label>Tanggal Lahir</Label>
                <Input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Email (Login)</Label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                placeholder="email@sekolah.com"
                required 
              />
            </div>

            {/* Field Password hanya muncul saat CREATE */}
            {!isEditMode && (
              <div className="grid gap-2">
                <Label>Password (Login)</Label>
                <Input 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  placeholder="Minimal 6 karakter"
                  required 
                />
              </div>
            )}

            {/* Multi-select Kelas Menggunakan Command & Popover */}
            <div className="grid gap-2">
              <Label>Kelas yang diajar</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between"
                  >
                    {formData.classIds.length > 0
                      ? `${formData.classIds.length} kelas dipilih`
                      : "Pilih kelas..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Cari kelas..." />
                    <CommandList>
                      <CommandEmpty>Kelas tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {initialClasses.map((kelas) => (
                          <CommandItem
                            key={kelas.id}
                            value={kelas.name}
                            onSelect={() => toggleClass(kelas.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.classIds.includes(kelas.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {kelas.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Tampilkan Badge Kelas yang Dipilih */}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.classIds.map(id => {
                  const kelas = initialClasses.find(c => c.id === id)
                  if (!kelas) return null
                  return (
                    <Badge key={id} variant="secondary" className="pr-1">
                      {kelas.name}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => toggleClass(id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Simpan Perubahan' : 'Buat Akun'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- ALERT: Delete Confirmation --- */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Guru?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini hanya menghapus profil guru dari database aplikasi. 
              Akun login (Auth) mungkin perlu dihapus secara manual di dashboard Supabase jika diperlukan.
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