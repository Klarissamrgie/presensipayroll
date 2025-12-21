import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AbsensiClient from "./absensi-client";
import AbsensiListClient from "./absensi-list-client";

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ kegiatan?: string }>;
}

export default async function AbsensiPage({ searchParams }: Props) {
  const supabase = await createClient();
  const params = await searchParams;
  const kegiatanId = params.kegiatan;

  // 1. Cek Login User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // ============================================================
  // MODE 1: LIST JADWAL MENGAJAR (Jika URL tidak ada ?kegiatan=...)
  // ============================================================
  if (!kegiatanId) {
    const { data: activities, error } = await supabase
      .from("tbkegiatan")
      .select(`
        id_kegiatan, 
        nama_kegiatan, 
        tgl_kegiatan, 
        jam_mulai, 
        id_kelas, 
        status_kegiatan,
        request_edit_status,
        is_editable,
        tbkelas (name_kelas),
        tb_activity_teachers!inner (teacher_id), 
        tb_attendance (id_attendance)
      `)
      .eq("tb_activity_teachers.teacher_id", user.id)
      .order("tgl_kegiatan", { ascending: false });

    if (error) {
      return (
        <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-bold text-lg">Gagal Memuat Jadwal</h3>
          <p className="mt-1">Pesan: {error.message}</p>
        </div>
      );
    }

    // Mapping Data
    const listData = activities?.map((act: any) => ({
      id_kegiatan: act.id_kegiatan,
      nama_kegiatan: act.nama_kegiatan,
      tgl_kegiatan: act.tgl_kegiatan,
      className: act.tbkelas?.name_kelas || 'Kegiatan Umum',
      // Selesai jika: Ada data absensi ATAU status manual 'Selesai'
      isDone: (act.tb_attendance && act.tb_attendance.length > 0) || act.status_kegiatan === 'Selesai',
      // Workflow Status
      requestStatus: act.request_edit_status || 'none',
      isEditable: act.is_editable || false
    })) || [];

    return <AbsensiListClient initialData={listData} />;
  }

  // ============================================================
  // MODE 2: FORM INPUT ABSENSI (Jika ada ?kegiatan=ID)
  // ============================================================
  
  // A. Ambil Detail Kegiatan
  const { data: activity, error: activityError } = await supabase
    .from("tbkegiatan")
    .select(`
      id_kegiatan, 
      nama_kegiatan, 
      tgl_kegiatan, 
      jam_mulai, 
      jam_selesai,
      id_kelas, 
      id_student, 
      bukti_foto, 
      catatan_kegiatan, 
      status_kegiatan,
      is_editable,
      tbkelas (name_kelas)
    `)
    .eq("id_kegiatan", kegiatanId)
    .single();

  if (activityError) {
    return (
      <div className="p-6 m-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="font-bold text-lg">Error Database</h3>
        <p>Pesan: {activityError.message}</p>
      </div>
    );
  }

  if (!activity) {
    return <div className="p-8 text-center text-muted-foreground">Data kegiatan tidak ditemukan.</div>;
  }

  // B. Logika Menentukan Daftar Siswa
  const isGeneralActivity = !activity.id_kelas && !activity.id_student;
  let students: any[] = [];

  if (!isGeneralActivity) {
    // 1. SISWA PRIVAT
    if (activity.id_student) {
      const { data } = await supabase
        .from("tbstudents")
        .select("id_student, name_student, gender_student")
        .eq("id_student", activity.id_student)
        .single();
      
      if (data) students = [data];
    } 
    // 2. SISWA KELAS
    else if (activity.id_kelas) {
      const { data } = await supabase
        .from("tb_student_classes")
        .select(`
          tbstudents (
            id_student, 
            name_student, 
            gender_student
          )
        `)
        .eq("id_kelas", activity.id_kelas)
        .order("id_student"); // Default order by ID, bisa diganti nama
      
      students = data?.map((i: any) => i.tbstudents) || [];
    }
  }

  // C. Ambil Data Absensi Existing
  const { data: existingAttendance } = await supabase
    .from("tb_attendance")
    .select("*")
    .eq("id_kegiatan", kegiatanId);

  return (
    <AbsensiClient 
      activity={activity} 
      students={students} 
      existingAttendance={existingAttendance || []}
      isGeneralActivity={isGeneralActivity}
    />
  );
}