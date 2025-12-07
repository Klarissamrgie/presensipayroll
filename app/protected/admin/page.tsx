import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, GraduationCap, School, Calendar, Clock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // 1. Fetch Statistik (Count) secara paralel
    const [
        { count: teacherCount },
        { count: studentCount },
        { count: classCount },
        { count: activityCount }
    ] = await Promise.all([
        supabase.from("tbteacher").select("*", { count: "exact", head: true }),
        supabase.from("tbstudents").select("*", { count: "exact", head: true }),
        supabase.from("tbkelas").select("*", { count: "exact", head: true }),
        supabase.from("tbkegiatan").select("*", { count: "exact", head: true })
    ]);

    // 2. Fetch Kegiatan Terbaru (5 Terakhir)
    const { data: recentActivities } = await supabase
        .from("tbkegiatan")
        .select(`
      id_kegiatan,
      nama_kegiatan,
      tgl_kegiatan,
      jam_mulai,
      jam_selesai,
      id_kelas,
      tbkelas (name_kelas)
    `)
        .order("tgl_kegiatan", { ascending: false }) // Urutkan dari yang terbaru
        .limit(5);

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">
                    Selamat datang di panel admin. Berikut adalah ringkasan data sistem saat ini.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teacherCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Pengajar aktif</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{studentCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Siswa terdaftar</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
                        <School className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Kelas tersedia</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Kegiatan</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activityCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Jadwal tercatat</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Recent Activities Panel */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Jadwal Kegiatan Terbaru</CardTitle>
                        <CardDescription>
                            5 kegiatan atau kelas terakhir yang dijadwalkan di sistem.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivities && recentActivities.length > 0 ? (
                                recentActivities.map((act: any) => (
                                    <div
                                        key={act.id_kegiatan}
                                        className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${act.id_kelas ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {act.id_kelas ? <School className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {act.nama_kegiatan}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                        {act.tgl_kegiatan
                                                            ? format(new Date(act.tgl_kegiatan), 'dd MMMM yyyy', { locale: indonesia })
                                                            : '-'}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {act.jam_mulai?.slice(0, 5)} - {act.jam_selesai?.slice(0, 5)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={act.id_kelas ? "default" : "secondary"}>
                                            {act.id_kelas ? "Kelas" : "Kegiatan"}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Belum ada kegiatan yang dijadwalkan.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Panel */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Aksi Cepat</CardTitle>
                        <CardDescription>Jalan pintas ke menu pengelolaan utama.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button asChild variant="outline" className="h-auto py-4 justify-start">
                            <Link href="/protected/admin/kelola-jadwal" className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full text-primary">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">Kelola Jadwal</div>
                                    <div className="text-xs text-muted-foreground">Buat kelas atau kegiatan baru</div>
                                </div>
                                <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="h-auto py-4 justify-start">
                            <Link href="/protected/admin/kelola-teacher" className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full text-primary">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">Kelola Guru</div>
                                    <div className="text-xs text-muted-foreground">Tambah atau edit data pengajar</div>
                                </div>
                                <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="h-auto py-4 justify-start">
                            <Link href="/protected/admin/kelola-student" className="flex items-center gap-4">
                                <div className="bg-primary/10 p-2 rounded-full text-primary">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-semibold">Kelola Siswa</div>
                                    <div className="text-xs text-muted-foreground">Daftarkan siswa baru</div>
                                </div>
                                <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}