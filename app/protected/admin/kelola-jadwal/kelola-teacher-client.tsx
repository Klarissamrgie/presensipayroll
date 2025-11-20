'use client'

import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'

export type TeacherOption = {
  id: string
  nama: string
}

export type ClassOption = {
  id: number
  name: string
  gradeId: number | null
}

export type GradeOption = {
  id: number
  name: string
}

export type StudentOption = {
  id: number
  name: string
  classId: number | null
}

export type ActivityOption = {
  id: number
  namaKegiatan: string
  tanggal: string | null
  jam: string | null
  teacherId: string | null
  classId: number | null
  studentId: number | null
}

type KelolaTeacherClientProps = {
  teachers: TeacherOption[]
  classes: ClassOption[]
  grades: GradeOption[]
  students: StudentOption[]
  activities: ActivityOption[]
  errorMessage?: string
}

const mapActivityRowToOption = (activity: {
  id_kegiatan: number
  nama_kegiatan: string | null
  tgl_kegiatan: string | null
  jam_kegiatan: string | null
  id_teacher: string | null
  id_kelas: number | null
  id_student: number | null
}): ActivityOption => ({
  id: activity.id_kegiatan,
  namaKegiatan: activity.nama_kegiatan ?? 'Tanpa nama',
  tanggal: activity.tgl_kegiatan,
  jam: activity.jam_kegiatan,
  teacherId: activity.id_teacher,
  classId: activity.id_kelas,
  studentId: activity.id_student,
})

const KelolaTeacherClient = ({
  teachers,
  classes,
  grades,
  students,
  activities,
  errorMessage,
}: KelolaTeacherClientProps) => {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  const [openClassModal, setOpenClassModal] = useState(false)
  const [openActivityModal, setOpenActivityModal] = useState(false)

  const [activityList, setActivityList] = useState<ActivityOption[]>(activities)

  useEffect(() => {
    setActivityList(activities)
  }, [activities])

  const [selectedGradeId, setSelectedGradeId] = useState<number | ''>('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('')
  const [namaKegiatanClass, setNamaKegiatanClass] = useState('')
  const [tanggalKegiatan, setTanggalKegiatan] = useState('')
  const [jamKegiatan, setJamKegiatan] = useState('')

  const [namaAktivitas, setNamaAktivitas] = useState('')
  const [tanggalAktivitas, setTanggalAktivitas] = useState('')
  const [jamAktivitas, setJamAktivitas] = useState('')

  const [isSubmittingClass, setIsSubmittingClass] = useState(false)
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false)

  const [classError, setClassError] = useState<string | null>(null)
  const [activityError, setActivityError] = useState<string | null>(null)

  const filteredClasses = useMemo(() => {
    if (selectedGradeId === '') return classes
    return classes.filter((kelas) => kelas.gradeId === selectedGradeId)
  }, [classes, selectedGradeId])

  const filteredStudents = useMemo(() => {
    if (selectedClassId === '') return []
    return students.filter((student) => student.classId === selectedClassId)
  }, [selectedClassId, students])

  const resetClassForm = () => {
    setSelectedGradeId('')
    setSelectedTeacherId('')
    setSelectedClassId('')
    setSelectedStudentId('')
    setNamaKegiatanClass('')
    setTanggalKegiatan('')
    setJamKegiatan('')
    setClassError(null)
  }

  const resetActivityForm = () => {
    setNamaAktivitas('')
    setTanggalAktivitas('')
    setJamAktivitas('')
    setActivityError(null)
  }

  const handleCreateClass = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmittingClass(true)
    setClassError(null)

    const payload = {
      nama_kegiatan: namaKegiatanClass,
      id_teacher: selectedTeacherId || null,
      id_kelas: selectedClassId === '' ? null : selectedClassId,
      id_student: selectedStudentId === '' ? null : selectedStudentId,
      tgl_kegiatan: tanggalKegiatan || null,
      jam_kegiatan: jamKegiatan || null,
    }

    const { data, error } = await supabase
      .from('tbKegiatan')
      .insert(payload)
      .select('id_kegiatan, nama_kegiatan, tgl_kegiatan, jam_kegiatan, id_teacher, id_kelas, id_student')
      .single()

    if (error || !data) {
      setClassError(error?.message ?? 'Gagal menyimpan kegiatan.')
      setIsSubmittingClass(false)
      return
    }

    setActivityList((prev) => [mapActivityRowToOption(data), ...prev])
    setIsSubmittingClass(false)
    setOpenClassModal(false)
    resetClassForm()
  }

  const handleCreateActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmittingActivity(true)
    setActivityError(null)

    const payload = {
      nama_kegiatan: namaAktivitas,
      tgl_kegiatan: tanggalAktivitas || null,
      jam_kegiatan: jamAktivitas || null,
    }

    const { data, error } = await supabase
      .from('tbKegiatan')
      .insert(payload)
      .select('id_kegiatan, nama_kegiatan, tgl_kegiatan, jam_kegiatan, id_teacher, id_kelas, id_student')
      .single()

    if (error || !data) {
      setActivityError(error?.message ?? 'Gagal membuat aktivitas.')
      setIsSubmittingActivity(false)
      return
    }

    setActivityList((prev) => [mapActivityRowToOption(data), ...prev])
    setIsSubmittingActivity(false)
    setOpenActivityModal(false)
    resetActivityForm()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin Panel</p>
          <h1 className="text-3xl font-semibold">Kelola Kegiatan Teacher</h1>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setOpenClassModal(true)}>Create Kelas</Button>
          <Button variant="secondary" onClick={() => setOpenActivityModal(true)}>
            Create Aktivitas
          </Button>
        </div>
      </header>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kegiatan (tbKegiatan)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full divide-y text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 font-semibold">Nama Kegiatan</th>
                  <th className="p-3 font-semibold">Teacher</th>
                  <th className="p-3 font-semibold">Kelas</th>
                  <th className="p-3 font-semibold">Grade</th>
                  <th className="p-3 font-semibold">Student</th>
                  <th className="p-3 font-semibold">Tanggal</th>
                  <th className="p-3 font-semibold">Jam</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activityList.map((item) => {
                  const teacher = item.teacherId
                    ? teachers.find((t) => t.id === item.teacherId)
                    : undefined
                  const kelas = item.classId ? classes.find((k) => k.id === item.classId) : undefined
                  const grade = kelas?.gradeId
                    ? grades.find((gradeItem) => gradeItem.id === kelas.gradeId)
                    : undefined
                  const student = item.studentId
                    ? students.find((s) => s.id === item.studentId)
                    : undefined
                  return (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{item.namaKegiatan}</td>
                      <td className="p-3">{teacher?.nama ?? '-'}</td>
                      <td className="p-3">{kelas?.name ?? '-'}</td>
                      <td className="p-3">{grade?.name ?? '-'}</td>
                      <td className="p-3">{student?.name ?? '-'}</td>
                      <td className="p-3">{item.tanggal ?? '-'}</td>
                      <td className="p-3">{item.jam ?? '-'}</td>
                    </tr>
                  )
                })}
                {activityList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      Belum ada kegiatan.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        title="Create Kelas"
        open={openClassModal}
        onClose={() => {
          setOpenClassModal(false)
          resetClassForm()
        }}
      >
        <form className="space-y-4" onSubmit={handleCreateClass}>
          <div className="space-y-2">
            <Label htmlFor="namaKegiatanKelas">Nama Kegiatan</Label>
            <Input
              id="namaKegiatanKelas"
              placeholder="Contoh: Kelas Intensif IPA"
              required
              value={namaKegiatanClass}
              onChange={(event) => setNamaKegiatanClass(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">ID Teacher</Label>
            <select
              id="teacher"
              required
              value={selectedTeacherId}
              onChange={(event) => setSelectedTeacherId(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Pilih Teacher
              </option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <select
              id="grade"
              required
              value={selectedGradeId}
              onChange={(event) => {
                const value = Number(event.target.value)
                const parsed = Number.isNaN(value) ? '' : value
                setSelectedGradeId(parsed)
                setSelectedClassId('')
                setSelectedStudentId('')
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Pilih Grade
              </option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kelas">ID Kelas</Label>
            <select
              id="kelas"
              required
              value={selectedClassId}
              onChange={(event) => {
                const value = Number(event.target.value)
                setSelectedClassId(Number.isNaN(value) ? '' : value)
                setSelectedStudentId('')
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Pilih Kelas
              </option>
              {filteredClasses.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student">ID Student</Label>
            <select
              id="student"
              required
              value={selectedStudentId}
              onChange={(event) => {
                const value = Number(event.target.value)
                setSelectedStudentId(Number.isNaN(value) ? '' : value)
              }}
              disabled={selectedClassId === ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" disabled>
                {selectedClassId === '' ? 'Pilih kelas dulu' : 'Pilih Student'}
              </option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Kegiatan</Label>
              <Input
                id="tanggal"
                type="date"
                required
                value={tanggalKegiatan}
                onChange={(event) => setTanggalKegiatan(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jam">Jam Kegiatan</Label>
              <Input
                id="jam"
                type="time"
                required
                value={jamKegiatan}
                onChange={(event) => setJamKegiatan(event.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpenClassModal(false)
                resetClassForm()
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmittingClass}>
              {isSubmittingClass ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
          {classError ? <p className="text-sm text-destructive">{classError}</p> : null}
        </form>
      </Modal>

      <Modal
        title="Create Aktivitas"
        open={openActivityModal}
        onClose={() => {
          setOpenActivityModal(false)
          resetActivityForm()
        }}
      >
        <form className="space-y-4" onSubmit={handleCreateActivity}>
          <div className="space-y-2">
            <Label htmlFor="namaAktivitas">Nama Kegiatan</Label>
            <Input
              id="namaAktivitas"
              placeholder="Contoh: Evaluasi Semester"
              required
              value={namaAktivitas}
              onChange={(event) => setNamaAktivitas(event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tanggalAktivitas">Tanggal</Label>
              <Input
                id="tanggalAktivitas"
                type="date"
                required
                value={tanggalAktivitas}
                onChange={(event) => setTanggalAktivitas(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jamAktivitas">Jam</Label>
              <Input
                id="jamAktivitas"
                type="time"
                required
                value={jamAktivitas}
                onChange={(event) => setJamAktivitas(event.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpenActivityModal(false)
                resetActivityForm()
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmittingActivity}>
              {isSubmittingActivity ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
          {activityError ? <p className="text-sm text-destructive">{activityError}</p> : null}
        </form>
      </Modal>
    </div>
  )
}

type ModalProps = {
  title: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

const Modal = ({ title, open, onClose, children }: ModalProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-lg bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Form</p>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-sm text-muted-foreground transition hover:bg-muted"
          >
            Esc
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default KelolaTeacherClient

