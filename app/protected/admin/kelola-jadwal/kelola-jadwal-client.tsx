'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { id as indonesia } from 'date-fns/locale'

// --- UI Components (Shadcn) ---
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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

// --- Icons ---
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Users, 
  Pencil, 
  Trash2, 
  Clock, 
  Check, 
  ChevronsUpDown, 
  X, 
  Loader2,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- Types ---
type Option = { id: string | number; name: string }
type StudentOption = { id: number; name: string; classIds: number[] }
type TeacherOption = { id: string; name: string }

type ClientActivity = {
  id: number
  title: string
  date: string | null
  startTime: string | null
  endTime: string | null
  teachers: TeacherOption[]
  classId: number | null
  studentId: number | null
  className?: string | null
}

type Props = {
  initialTeachers: Option[]
  initialClasses: Option[]
  initialStudents?: StudentOption[]
  initialActivities: ClientActivity[]
}

export default function KelolaJadwalClient({ 
  initialTeachers, 
  initialClasses, 
  initialStudents = [], 
  initialActivities 
}: Props) {
  const supabase = createClient()
  
  // -- Data States --
  const [activities, setActivities] = useState<ClientActivity[]>(initialActivities)
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // -- Modal States --
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  
  // -- Operation States --
  const [isEditMode, setIsEditMode] = useState(false)
  const [formType, setFormType] = useState<'KELAS' | 'KEGIATAN'>('KEGIATAN')
  const [isLoading, setIsLoading] = useState(false)
  
  // -- Selection States --
  const [selectedDateDetails, setSelectedDateDetails] = useState<{ date: string, items: ClientActivity[] } | null>(null)
  const [editingActivity, setEditingActivity] = useState<ClientActivity | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // -- Form State --
  const [formData, setFormData] = useState({
    title: '',
    teacherIds: [] as string[],
    classId: '',
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '09:00'
  })

  // Filter students based on selected class
  const filteredStudents = useMemo(() => {
    if (!formData.classId) return []
    const selectedClassIdNum = Number(formData.classId)
    return initialStudents.filter(s => s.classIds && s.classIds.includes(selectedClassIdNum))
  }, [formData.classId, initialStudents])

  // --- Calendar Logic ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const getActivitiesForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return activities.filter(a => a.date === dateStr)
  }

  // --- Handlers ---

  const resetForm = () => {
    setFormData({
      title: '',
      teacherIds: [],
      classId: '',
      studentId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '09:00'
    })
    setEditingActivity(null)
    setIsEditMode(false)
  }

  const handleOpenAdd = (type: 'KELAS' | 'KEGIATAN', defaultDate?: string) => {
    resetForm()
    setFormType(type)
    if (defaultDate) {
      setFormData(prev => ({ ...prev, date: defaultDate }))
    }
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (act: ClientActivity) => {
    setEditingActivity(act)
    setIsEditMode(true)
    const type = act.classId ? 'KELAS' : 'KEGIATAN'
    setFormType(type)
    setFormData({
      title: act.title,
      teacherIds: act.teachers.map(t => t.id),
      classId: act.classId ? String(act.classId) : '',
      studentId: act.studentId ? String(act.studentId) : '',
      date: act.date || '',
      startTime: act.startTime || '08:00',
      endTime: act.endTime || '09:00'
    })
    setIsDayDetailOpen(false)
    setIsDialogOpen(true)
  }

  // Multi-select toggle for Activity mode
  const toggleTeacherMulti = (teacherId: string) => {
    setFormData(prev => {
      const exists = prev.teacherIds.includes(teacherId)
      return {
        ...prev,
        teacherIds: exists 
          ? prev.teacherIds.filter(id => id !== teacherId)
          : [...prev.teacherIds, teacherId]
      }
    })
  }

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const items = activities.filter(a => a.date === dateStr)
    setSelectedDateDetails({ date: dateStr, items })
    setIsDayDetailOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // --- VALIDATION ---
    if (formData.teacherIds.length === 0) {
      alert("Harap pilih guru.")
      return
    }

    if (formType === 'KELAS') {
      if (!formData.classId) {
        alert("Harap pilih kelas.")
        return
      }
      if (!formData.studentId) {
        alert("Harap pilih siswa.")
        return
      }
      if (formData.teacherIds.length > 1) {
        alert("Untuk Kelas, hanya boleh 1 guru.")
        return
      }
    }

    setIsLoading(true)

    const payload = {
      nama_kegiatan: formType === 'KELAS' ? 
        initialClasses.find(c => String(c.id) === formData.classId)?.name || 'Kelas' : 
        formData.title,
      tgl_kegiatan: formData.date,
      jam_mulai: formData.startTime,
      jam_selesai: formData.endTime,
      id_kelas: formType === 'KELAS' && formData.classId ? Number(formData.classId) : null,
      id_student: formType === 'KELAS' && formData.studentId ? Number(formData.studentId) : null,
    }

    try {
      if (isEditMode && editingActivity) {
        // --- UPDATE ---
        const { error } = await supabase.from('tbkegiatan').update(payload).eq('id_kegiatan', editingActivity.id)
        if (error) throw error

        // Sync Teachers
        await supabase.from('tb_activity_teachers').delete().eq('activity_id', editingActivity.id)
        const teacherPayload = formData.teacherIds.map(tId => ({
          activity_id: editingActivity.id,
          teacher_id: tId
        }))
        await supabase.from('tb_activity_teachers').insert(teacherPayload)

        // Optimistic Update
        const updatedTeachers = initialTeachers
          .filter(t => formData.teacherIds.includes(String(t.id)))
          .map(t => ({ id: String(t.id), name: t.name }))

        const updatedActivity = {
          ...editingActivity,
          title: payload.nama_kegiatan,
          date: payload.tgl_kegiatan,
          startTime: payload.jam_mulai,
          endTime: payload.jam_selesai,
          classId: payload.id_kelas,
          studentId: payload.id_student,
          className: payload.id_kelas ? initialClasses.find(c => String(c.id) === String(payload.id_kelas))?.name : null,
          teachers: updatedTeachers as TeacherOption[]
        }
        

        setActivities(prev => prev.map(a => a.id === editingActivity.id ? updatedActivity : a))
        
        // Refresh detail view if open
        if (selectedDateDetails) {
           const newItems = selectedDateDetails.items.map(i => i.id === updatedActivity.id ? updatedActivity : i)
           if (updatedActivity.date !== selectedDateDetails.date) {
             setSelectedDateDetails({ ...selectedDateDetails, items: selectedDateDetails.items.filter(i => i.id !== updatedActivity.id) })
           } else {
             setSelectedDateDetails({ ...selectedDateDetails, items: newItems })
           }
        }

      } else {
        // --- CREATE ---
        const { data, error } = await supabase.from('tbkegiatan').insert(payload).select().single()
        if (error) throw error

        const teacherPayload = formData.teacherIds.map(tId => ({
          activity_id: data.id_kegiatan,
          teacher_id: tId
        }))
        await supabase.from('tb_activity_teachers').insert(teacherPayload)

        const newTeachers = initialTeachers
          .filter(t => formData.teacherIds.includes(String(t.id)))
          .map(t => ({ id: String(t.id), name: t.name }))

        const newActivity: ClientActivity = {
          id: data.id_kegiatan,
          title: data.nama_kegiatan,
          date: data.tgl_kegiatan,
          startTime: data.jam_mulai,
          endTime: data.jam_selesai,
          classId: data.id_kelas,
          studentId: data.id_student,
          teachers: newTeachers as TeacherOption[],
          className: formType === 'KELAS' ? initialClasses.find(c => String(c.id) === formData.classId)?.name : null
        }

        setActivities(prev => [...prev, newActivity])
        
        if (selectedDateDetails && selectedDateDetails.date === newActivity.date) {
           setSelectedDateDetails(prev => prev ? ({ ...prev, items: [...prev.items, newActivity] }) : null)
        }
      }
      
      setIsDialogOpen(false)
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setIsLoading(true)
    const { error } = await supabase.from('tbkegiatan').delete().eq('id_kegiatan', deletingId)
    
    if (error) {
      alert('Gagal menghapus: ' + error.message)
    } else {
      setActivities(prev => prev.filter(a => a.id !== deletingId))
      if (selectedDateDetails) {
        setSelectedDateDetails(prev => prev ? ({ ...prev, items: prev.items.filter(i => i.id !== deletingId) }) : null)
      }
    }
    setIsLoading(false)
    setIsAlertOpen(false)
  }

  return (
    <div className="space-y-8">
      {/* --- Top Buttons --- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => handleOpenAdd('KELAS')} 
          className="flex-1 h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-md"
        >
          <Users className="mr-2 h-5 w-5" /> Jadwal Kelas (Privat)
        </Button>
        <Button 
          onClick={() => handleOpenAdd('KEGIATAN')} 
          className="flex-1 h-12 text-lg shadow-sm" 
          variant="outline"
        >
          <Plus className="mr-2 h-5 w-5" /> Tambah Kegiatan
        </Button>
      </div>

      {/* --- Calendar Grid --- */}
      <Card className="overflow-hidden shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 p-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-xl capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: indonesia })}
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b text-center text-sm font-medium text-muted-foreground bg-muted/20">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
              <div key={day} className="py-2 border-r last:border-r-0">{day}</div>
            ))}
          </div>
          
          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] text-sm">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r bg-muted/5 p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayActivities = getActivitiesForDate(day)
              const isToday = 
                new Date().getDate() === day && 
                new Date().getMonth() === currentDate.getMonth() && 
                new Date().getFullYear() === currentDate.getFullYear()

              return (
                <div 
                  key={day} 
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "group border-b border-r p-2 transition-colors cursor-pointer hover:bg-blue-50/80 min-h-[100px]", 
                    isToday && "bg-blue-50/30"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-full font-medium text-xs", isToday ? "bg-blue-600 text-white" : "text-muted-foreground group-hover:text-blue-600")}>
                      {day}
                    </span>
                    {dayActivities.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                        {dayActivities.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayActivities.slice(0, 3).map(act => (
                      <div 
                        key={act.id} 
                        className={cn(
                          "truncate rounded px-1.5 py-0.5 text-[10px] font-medium border shadow-sm",
                          act.classId ? "bg-green-100 text-green-700 border-green-200" : "bg-orange-100 text-orange-700 border-orange-200"
                        )}
                      >
                        {act.title}
                      </div>
                    ))}
                    {dayActivities.length > 3 && (
                      <div className="text-[10px] text-muted-foreground pl-1">+ {dayActivities.length - 3} lainnya</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* --- DIALOG: Day Details --- */}
      <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Jadwal: {selectedDateDetails?.date}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {selectedDateDetails?.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Tidak ada kegiatan di tanggal ini.
                </div>
              ) : (
                selectedDateDetails?.items.map((act) => (
                  <div key={act.id} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors">
                    <div className="space-y-1 w-full">
                      <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{act.title}</h4>
                          <Badge variant={act.classId ? "default" : "outline"} className="text-[10px] px-1.5 h-5">
                              {act.classId ? "Kelas" : "Kegiatan"}
                          </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1 mt-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" /> 
                          <span>{act.startTime?.slice(0,5)} - {act.endTime?.slice(0,5)}</span>
                        </div>
                        {act.teachers.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Users className="h-3 w-3 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                                {act.teachers.map(t => (
                                    <Badge key={t.id} variant="secondary" className="text-[10px] px-1 py-0 h-auto font-normal">
                                      {t.name}
                                    </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                        {act.studentId && (
                           <div className="flex items-center gap-2 text-blue-600">
                             <User className="h-3 w-3" />
                             <span className="font-medium">
                               {initialStudents.find(s => s.id === act.studentId)?.name || `Student ID: ${act.studentId}`}
                             </span>
                           </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(act)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => { setDeletingId(act.id); setIsAlertOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              className="w-full sm:w-1/2" 
              variant="outline"
              onClick={() => { 
                setIsDayDetailOpen(false); 
                handleOpenAdd('KEGIATAN', selectedDateDetails?.date); 
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Kegiatan
            </Button>
            <Button 
              className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700" 
              onClick={() => { 
                setIsDayDetailOpen(false); 
                handleOpenAdd('KELAS', selectedDateDetails?.date); 
              }}
            >
              <Users className="mr-2 h-4 w-4" /> Kelas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG: Add/Edit Form --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Jadwal' : (formType === 'KELAS' ? 'Jadwalkan Kelas Privat' : 'Tambah Kegiatan')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            
            {/* Conditional Fields: KELAS vs KEGIATAN */}
            {formType === 'KELAS' ? (
              <>
                <div className="grid gap-2">
                  <Label>Pilih Kelas</Label>
                  <Select value={formData.classId} onValueChange={(val) => setFormData({...formData, classId: val})}>
                    <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                    <SelectContent>
                      {initialClasses.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Siswa (Wajib 1 Orang)</Label>
                  <Select value={formData.studentId} onValueChange={(val) => setFormData({...formData, studentId: val})} disabled={!formData.classId}>
                    <SelectTrigger><SelectValue placeholder={!formData.classId ? "Pilih kelas dulu" : "Pilih Siswa"} /></SelectTrigger>
                    <SelectContent>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)
                      ) : (
                        <div className="p-2 text-xs text-muted-foreground text-center">Tidak ada siswa di kelas ini</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Single Teacher Selection for CLASS */}
                <div className="grid gap-2">
                  <Label>Guru Pengajar (Wajib 1 Orang)</Label>
                  <Select 
                    value={formData.teacherIds[0] || ''} 
                    onValueChange={(val) => setFormData({...formData, teacherIds: [val]})} // Replace array with single ID
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih Guru" /></SelectTrigger>
                    <SelectContent>
                      {initialTeachers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              // FORM KEGIATAN
              <>
                <div className="grid gap-2">
                  <Label>Nama Kegiatan</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    placeholder="Contoh: Rapat Guru" 
                    required 
                  />
                </div>

                {/* Multi-Select Teachers for ACTIVITY */}
                <div className="grid gap-2">
                  <Label>Partisipan Guru (Bisa lebih dari 1)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="justify-between">
                        {formData.teacherIds.length > 0 ? `${formData.teacherIds.length} guru dipilih` : "Pilih guru..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Cari guru..." />
                        <CommandList>
                          <CommandEmpty>Tidak ada guru.</CommandEmpty>
                          <CommandGroup>
                            {initialTeachers.map((t) => (
                              <CommandItem key={t.id} value={t.name} onSelect={() => toggleTeacherMulti(String(t.id))}>
                                <Check className={cn("mr-2 h-4 w-4", formData.teacherIds.includes(String(t.id)) ? "opacity-100" : "opacity-0")} />
                                {t.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.teacherIds.map(id => {
                      const t = initialTeachers.find(te => String(te.id) === id)
                      return t ? (
                        <Badge key={id} variant="secondary" className="pr-1">
                          {t.name}
                          <X className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => toggleTeacherMulti(id)} />
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tanggal</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <div className="flex-1"><Label>Mulai</Label><Input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} required /></div>
                  <div className="flex-1"><Label>Selesai</Label><Input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} required /></div>
                </div>
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

      {/* --- ALERT: Delete --- */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}