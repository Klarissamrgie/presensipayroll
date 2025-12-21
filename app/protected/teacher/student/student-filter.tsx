'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X } from 'lucide-react'

export default function StudentFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Helper untuk mendapatkan tanggal awal & akhir bulan ini
  const getThisMonthDates = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Format YYYY-MM-DD (Wajib untuk input type="date")
    // Gunakan en-CA agar formatnya YYYY-MM-DD
    const startStr = start.toLocaleDateString('en-CA')
    const endStr = end.toLocaleDateString('en-CA')
    
    return { startStr, endStr }
  }

  // State awal: Ambil dari URL ATAU Default Bulan Ini
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  // useEffect untuk inisialisasi default value hanya di client
  useEffect(() => {
    const paramStart = searchParams.get('startDate')
    const paramEnd = searchParams.get('endDate')
    const { startStr, endStr } = getThisMonthDates()

    setStartDate(paramStart || startStr)
    setEndDate(paramEnd || endStr)
  }, [searchParams])

  const handleFilter = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    
    router.push(`/protected/teacher/student?${params.toString()}`)
    setLoading(false)
  }

  const handleReset = () => {
    // Reset kembali ke bulan ini
    const { startStr, endStr } = getThisMonthDates()
    setStartDate(startStr)
    setEndDate(endStr)
    
    // Hapus params dari URL (agar page.tsx pakai default logic)
    router.push('/protected/teacher/student')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end bg-white p-4 rounded-lg border shadow-sm mb-6">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="start">Dari Tanggal</Label>
        <Input 
          type="date" 
          id="start" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)} 
        />
      </div>
      
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="end">Sampai Tanggal</Label>
        <Input 
          type="date" 
          id="end" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)} 
        />
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <Button onClick={handleFilter} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <Search className="w-4 h-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" onClick={handleReset} title="Reset ke Bulan Ini">
            <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}