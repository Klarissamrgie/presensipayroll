'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadPaymentProof(
  teacherId: string, 
  periodStr: string, 
  amount: number, 
  formData: FormData
) {
  const supabase = await createClient()
  
  const file = formData.get('proof') as File
  if (!file) throw new Error("File tidak ditemukan dalam form data")

  // --- DEBUGGING LOG ---
  console.log("Mulai Upload:", file.name, "Size:", file.size)
  console.log("Target Bucket: finance")

  // 1. Upload File ke Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${teacherId}-${periodStr}-${Date.now()}.${fileExt}`
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('finance')
    .upload(fileName, file, {
      upsert: true // Timpa file jika nama sama
    })

  if (uploadError) {
    // Log error lengkap ke terminal server
    console.error("❌ GAGAL UPLOAD STORAGE:", uploadError)
    throw new Error(`Gagal upload: ${uploadError.message} (Cek Storage Policy)`)
  }

  console.log("✅ Berhasil Upload:", uploadData)

  // 2. Simpan Data Pembayaran ke Database
  const { error: dbError } = await supabase
    .from('tb_payments')
    .upsert({
      teacher_id: teacherId,
      period: periodStr,
      amount: amount,
      status: 'Paid',
      proof_file: fileName,
      paid_at: new Date().toISOString()
    }, {
      onConflict: 'teacher_id, period'
    })

  if (dbError) {
    console.error("❌ GAGAL DB:", dbError)
    throw new Error("Gagal simpan database: " + dbError.message)
  }

  revalidatePath('/protected/finance')
}