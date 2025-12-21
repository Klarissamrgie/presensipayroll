'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- TEACHER ACTIONS ---

// 1. Guru mengajukan edit
export async function requestEdit(id_kegiatan: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tbkegiatan')
    .update({ 
      request_edit_status: 'pending' 
    })
    .eq('id_kegiatan', id_kegiatan)

  if (error) throw new Error(error.message)
  
  // Refresh halaman agar tombol berubah status
  revalidatePath('/teacher/activity') 
}

// 2. Guru menyimpan perubahan (SEKALIGUS MENGUNCI KEMBALI)
export async function saveAndLockActivity(id_kegiatan: number, formData: any) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tbkegiatan')
    .update({
      ...formData,          // Data baru yang diedit (catatan, jam, dll)
      is_editable: false,   // <--- KUNCI KEMBALI
      request_edit_status: 'none' // Reset status request
    })
    .eq('id_kegiatan', id_kegiatan)

  if (error) throw new Error(error.message)

  revalidatePath('/teacher/activity')
  return { success: true }
}


// --- ADMIN ACTIONS ---

// 3. Admin menyetujui (Membuka Gembok)
export async function approveEditRequest(id_kegiatan: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tbkegiatan')
    .update({ 
      request_edit_status: 'approved',
      is_editable: true // <--- BUKA KUNCI
    })
    .eq('id_kegiatan', id_kegiatan)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/edit-requests')
}

// 4. Admin menolak
export async function rejectEditRequest(id_kegiatan: number) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tbkegiatan')
    .update({ 
      request_edit_status: 'rejected',
      is_editable: false
    })
    .eq('id_kegiatan', id_kegiatan)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/edit-requests')
}