import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import { Calendar, Clock, MapPin, Users, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const supabase = await createClient();

  // 1. Cek User Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Ambil Data Profil Guru
  const { data: teacherProfile } = await supabase
    .from("tbteacher")
    .select("nama, email")
    .eq("id_teacher", user.id)
    .single();

  // Helper Tanggal
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');

  // 3. Ambil Jadwal HARI INI
  // Menggunakan !inner join untuk memfilter kegiatan yang teacher-nya adalah user yang login
  const { data: todaysSchedule, error } = await supabase
    .from("tbkegiatan")
    .select(`
      id_kegiatan,
      nama_kegiatan,
      tgl_kegiatan,
      jam_mulai,
      jam_selesai,
      id_kelas,
      tbkelas (name_kelas),
      tb_activity_teachers!inner (teacher_id)
    `)
    .eq("tb_activity_teachers.teacher_id", user.id)
    .eq("tgl_kegiatan", dateStr)
    .order("jam_mulai", { ascending: true });

  // 4. Ambil Jadwal MENDATANG (Limit 3)
  const { data: upcomingSchedule } = await supabase
    .from("tbkegiatan")
    .select(`
      id_kegiatan,
      nama_kegiatan,
      tgl_kegiatan,
      jam_mulai,
      id_kelas,
      tbkelas (name_kelas),
      tb_activity_teachers!inner (teacher_id)
    `)
    .eq("tb_activity_teachers.teacher_id", user.id)
    .gt("tgl_kegiatan", dateStr) // Tanggal lebih besar dari hari ini
    .order("tgl_kegiatan", { ascending: true })
    .limit(3);

  // --- Statistik Sederhana ---
  const totalClassesToday = todaysSchedule?.length || 0;
  // Hitung durasi kasar (opsional) - disini kita hitung sesi saja

  return (
    <div className="space-y-6">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Halo, {teacherProfile?.nama || "Guru"}! 👋
          </h1>
          <p className="text-muted-foreground">
            {format(today, "EEEE, dd MMMM yyyy", { locale: indonesia })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100">
          <Calendar className="h-4 w-4" />
          <span className="font-medium text-sm">
            {totalClassesToday > 0 
              ? `Ada ${totalClassesToday} jadwal mengajar hari ini.` 
              : "Tidak ada jadwal mengajar hari ini."}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        
        {/* --- LEFT COLUMN (Jadwal Hari Ini) - Span 8 --- */}
        <div className="md:col-span-8 space-y-6">
          <Card className="border-l-4 border-l-blue-600 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Jadwal Mengajar Hari Ini
              </CardTitle>
              <CardDescription>
                Silakan pilih kelas untuk melakukan absensi siswa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysSchedule && todaysSchedule.length > 0 ? (
                  todaysSchedule.map((item: any) => (
                    <div 
                      key={item.id_kegiatan}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-start gap-4 mb-4 sm:mb-0">
                        {/* Waktu */}
                        <div className="flex flex-col items-center justify-center min-w-[80px] bg-muted/50 p-2 rounded-md border">
                          <span className="text-sm font-bold text-foreground">
                            {item.jam_mulai?.slice(0, 5)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">s/d</span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {item.jam_selesai?.slice(0, 5)}
                          </span>
                        </div>

                        {/* Detail Kelas */}
                        <div className="space-y-1">
                          <h3 className="font-semibold text-base flex items-center gap-2">
                            {item.nama_kegiatan}
                            <Badge variant={item.id_kelas ? "default" : "secondary"} className="text-[10px] h-5">
                              {item.id_kelas ? "Kelas" : "Kegiatan"}
                            </Badge>
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {item.tbkelas?.name_kelas && (
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" />
                                <span>{item.tbkelas.name_kelas}</span>
                              </div>
                            )}
                            {/* Jika mau menampilkan lokasi/ruangan, bisa ditambahkan di sini */}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <Button asChild size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                        <Link href={`/protected/teacher/absensi?kegiatan=${item.id_kegiatan}`}>
                          Isi Absensi <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
                    <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
                    <p>Anda tidak memiliki jadwal hari ini.</p>
                    <p className="text-xs">Nikmati hari libur Anda!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN (Profil & Upcoming) - Span 4 --- */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4 border-2 border-primary/10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${teacherProfile?.email}`} />
                  <AvatarFallback className="text-lg font-bold">
                    {teacherProfile?.nama?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold">{teacherProfile?.nama}</h2>
                <p className="text-sm text-muted-foreground">{teacherProfile?.email}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                  <Button variant="outline" className="w-full text-xs" asChild>
                    <Link href="/protected/teacher/account">Edit Profil</Link>
                  </Button>
                  <Button variant="outline" className="w-full text-xs" asChild>
                    <Link href="/protected/teacher/absensi">Riwayat</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Jadwal Berikutnya
              </CardTitle>
            </CardHeader>
            <CardContent className="pr-1">
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-4">
                  {upcomingSchedule && upcomingSchedule.length > 0 ? (
                    upcomingSchedule.map((item: any) => (
                      <div key={item.id_kegiatan} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                        <div className="flex flex-col items-center bg-muted/30 p-2 rounded text-center min-w-[50px]">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {format(new Date(item.tgl_kegiatan), 'MMM', { locale: indonesia })}
                          </span>
                          <span className="text-lg font-bold text-foreground leading-none">
                            {format(new Date(item.tgl_kegiatan), 'dd')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-1">{item.nama_kegiatan}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.jam_mulai?.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Belum ada jadwal mendatang.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}