'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  totalPages: number
  currentPage: number
  totalData: number
}

// UBAH DISINI: Pakai 'export function' (bukan default) agar import-nya spesifik
export function StudentPagination({ totalPages, currentPage, totalData }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `/protected/teacher/student?${params.toString()}`
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    router.push(createPageURL(page))
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t pt-4 mt-4">
      <div className="text-sm text-muted-foreground">
        Total: <b>{totalData}</b> siswa
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        
        <div className="text-sm font-medium mx-2">
          Halaman {currentPage} dari {totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}