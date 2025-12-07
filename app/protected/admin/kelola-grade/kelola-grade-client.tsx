'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Plus, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react'

// --- Types ---
type Grade = {
  id: number
  name: string
  price: number
}

export default function KelolaGradeClient({ initialGrades }: { initialGrades: Grade[] }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [grades, setGrades] = useState<Grade[]>(initialGrades)
  const [isLoading, setIsLoading] = useState(false)

  // -- Modal States --
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // -- Selection State --
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // -- Form State --
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  })

  // Helper Format Currency
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // --- Handlers ---

  const resetForm = () => {
    setFormData({ name: '', price: '' })
    setSelectedId(null)
    setIsEditMode(false)
  }

  const handleOpenAdd = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (grade: Grade) => {
    setIsEditMode(true)
    setSelectedId(grade.id)
    setFormData({
      name: grade.name,
      price: String(grade.price)
    })
    setIsDialogOpen(true)
  }

  const handleOpenDelete = (id: number) => {
    setSelectedId(id)
    setIsAlertOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      name_grade: formData.name,
      harga_grade: Number(formData.price) || 0
    }

    try {
      if (isEditMode && selectedId) {
        // UPDATE
        const { error } = await supabase
          .from('tbgrade')
          .update(payload)
          .eq('id_grade', selectedId)

        if (error) throw error

        setGrades(prev => prev.map(g => g.id === selectedId ? { ...g, name: payload.name_grade, price: payload.harga_grade } : g))
      } else {
        // CREATE
        const { data, error } = await supabase
          .from('tbgrade')
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        const newGrade: Grade = {
          id: data.id_grade,
          name: data.name_grade,
          price: data.harga_grade
        }
        setGrades([...grades, newGrade])
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

    const { error } = await supabase.from('tbgrade').delete().eq('id_grade', selectedId)
    
    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      setGrades(prev => prev.filter(g => g.id !== selectedId))
      router.refresh()
    }
    
    setIsLoading(false)
    setIsAlertOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header Action */}
      <div className="flex justify-end">
        <Button onClick={handleOpenAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Tambah Grade
        </Button>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {grades.map((grade) => (
          <Card key={grade.id} className="relative group overflow-hidden border transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{grade.name}</CardTitle>
              <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                <GraduationCap className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rate / Harga</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formatIDR(grade.price)}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleOpenEdit(grade)}>
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8 hover:bg-red-50 hover:border-red-200" onClick={() => handleOpenDelete(grade.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {grades.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/5 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Belum ada data grade</p>
            <p className="text-sm">Tambahkan grade baru untuk mulai mengelola harga.</p>
          </div>
        )}
      </div>

      {/* --- DIALOG: Add/Edit Grade --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Grade' : 'Tambah Grade Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Grade</Label>
              <Input 
                id="name"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Contoh: Grade 1 (SD)" 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Harga / Rate (IDR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">Rp</span>
                <Input 
                  id="price"
                  type="number"
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})} 
                  className="pl-9"
                  placeholder="0" 
                  required 
                />
              </div>
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
            <AlertDialogTitle>Hapus Grade?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Menghapus grade mungkin akan mempengaruhi data siswa atau kelas yang terhubung.
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