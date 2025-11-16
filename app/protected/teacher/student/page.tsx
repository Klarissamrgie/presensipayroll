import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, DollarSign } from 'lucide-react'

interface StudentData {
  name: string
  grade: string
  major: string
  satuan: string
  frekuensi: number
  jumlah: number
}

async function getStudentData(): Promise<StudentData[]> {
  try {
    // Read directly from file system in server component
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'public', 'study-dummy.json')
    const fileContents = await fs.readFile(filePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading student data:', error)
    return []
  }
}

const Student = async () => {
  const students = await getStudentData()
  
  const totalStudents = students.length
  const totalWorkHours = students.reduce((sum, student) => sum + student.frekuensi, 0)
  const totalSalary = students.reduce((sum, student) => sum + student.jumlah, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-6">Student Management</h1>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkHours}</div>
            <p className="text-xs text-muted-foreground">Total hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(totalSalary)}
            </div>
            <p className="text-xs text-muted-foreground">Total salary</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Grade</th>
                  <th className="text-left p-4 font-semibold">Major</th>
                  <th className="text-left p-4 font-semibold">Satuan</th>
                  <th className="text-left p-4 font-semibold">Frekuensi</th>
                  <th className="text-left p-4 font-semibold">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-4">{student.name}</td>
                    <td className="p-4">{student.grade}</td>
                    <td className="p-4">{student.major}</td>
                    <td className="p-4">{student.satuan}</td>
                    <td className="p-4">{student.frekuensi}</td>
                    <td className="p-4">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                      }).format(student.jumlah)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Student