'use client'

import React, { FormEvent, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export type TeacherOption = {
  id: string
  nama: string
}

export type ClassOption = {
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
  students: StudentOption[]
  activities: ActivityOption[]
  errorMessage?: string
}

const KelolaTeacherClient = ({
  teachers,
  classes,
  students,
  activities,
  errorMessage,
}: KelolaTeacherClientProps) => {
  const [openClassModal, setOpenClassModal] = useState(false)
  const [openActivityModal, setOpenActivityModal] = useState(false)

  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('')
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('')
  const [tanggalKegiatan, setTanggalKegiatan] = useState('')
  const [jamKegiatan, setJamKegiatan] = useState('')

  const [namaAktivitas, setNamaAktivitas] = useState('')
  const [tanggalAktivitas, setTanggalAktivitas] = useState('')
  const [jamAktivitas, setJamAktivitas] = useState('')

  const filteredStudents = useMemo(() => {
    if (selectedClassId === '') return []
    return students.filter((student) => student.classId === selectedClassId)
  }, [selectedClassId, students])

  const resetClassForm = () => {
    setSelectedTeacherId('')
    setSelectedClassId('')
    setSelectedStudentId('')
    setTanggalKegiatan('')
    setJamKegiatan('')
  }

  const resetActivityForm = () => {
    setNamaAktivitas('')
    setTanggalAktivitas('')
    setJamAktivitas('')
  }

  const handleCreateClass = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.table({
      teacher: selectedTeacherId,
      kelas: selectedClassId,
      student: selectedStudentId,
      tanggal: tanggalKegiatan,
      jam: jamKegiatan,
    })
    resetClassForm()
    setOpenClassModal(false)
  }

  const handleCreateActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.table({
      nama_kegiatan: namaAktivitas,
      tanggal: tanggalAktivitas,
      jam: jamAktivitas,
    })
    resetActivityForm()
    setOpenActivityModal(false)
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
                  <th className="p-3 font-semibold">Student</th>
                  <th className="p-3 font-semibold">Tanggal</th>
                  <th className="p-3 font-semibold">Jam</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activities.map((item) => {
                  const teacher = item.teacherId
                    ? teachers.find((t) => t.id === item.teacherId)
                    : undefined
                  const kelas = item.classId ? classes.find((k) => k.id === item.classId) : undefined
                  const student = item.studentId
                    ? students.find((s) => s.id === item.studentId)
                    : undefined
                  return (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{item.namaKegiatan}</td>
                      <td className="p-3">{teacher?.nama ?? '-'}</td>
                      <td className="p-3">{kelas?.name ?? '-'}</td>
                      <td className="p-3">{student?.name ?? '-'}</td>
                      <td className="p-3">{item.tanggal ?? '-'}</td>
                      <td className="p-3">{item.jam ?? '-'}</td>
                    </tr>
                  )
                })}
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
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
              {classes.map((kelas) => (
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
            <Button type="submit">Simpan</Button>
          </div>
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
            <Button type="submit">Simpan</Button>
          </div>
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

