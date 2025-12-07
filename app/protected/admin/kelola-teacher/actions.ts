'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function createTeacherAction(data: any) {
  // Validasi Service Key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Server Error: SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.' }
  }

  // Gunakan Admin Client (Bypass RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // 1. Buat Akun Auth (Sign Up)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password, // Password dari input admin
    email_confirm: true,     // Langsung verifikasi email (opsional)
    user_metadata: { full_name: data.name }
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: "Gagal membuat user auth." }

  const newUserId = authData.user.id

  // 2. Insert ke tabel tbteacher
  const { error: profileError } = await supabaseAdmin
    .from('tbteacher')
    .insert({
      id_teacher: newUserId, // Link ke Auth User ID
      nama: data.name,
      gender: data.gender,
      tgl_lahir: data.dob || null,
      email: data.email
    })

  if (profileError) {
    // Rollback: Hapus user auth jika profil gagal dibuat agar tidak ada data sampah
    await supabaseAdmin.auth.admin.deleteUser(newUserId)
    return { error: 'Gagal membuat profil guru: ' + profileError.message }
  }

  // 3. Assign Kelas (tb_teacher_classes)
  if (data.classIds && data.classIds.length > 0) {
    const classPayload = data.classIds.map((cId: number) => ({
      id_teacher: newUserId,
      id_kelas: cId
    }))
    
    const { error: classError } = await supabaseAdmin
      .from('tb_teacher_classes')
      .insert(classPayload)

    if (classError) {
       return { error: 'Guru dibuat tapi gagal assign kelas: ' + classError.message }
    }
  }

  // Refresh halaman admin agar data baru muncul
  revalidatePath('/protected/admin/kelola-teacher')
  return { success: true }
}