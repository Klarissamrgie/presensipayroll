'use client'

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCircle, Lock, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AccountPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('tbteacher').select('*').eq('id_teacher', user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if(newPassword.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }
    
    setPassLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) alert("Gagal update: " + error.message);
    else {
      alert("Password berhasil diubah!");
      setNewPassword("");
    }
    setPassLoading(false);
  }

  if (loading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Akun Saya</h1>
        <p className="text-muted-foreground">Kelola informasi akun dan keamanan.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profil Read-Only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" /> Data Diri
            </CardTitle>
            <CardDescription>Informasi terdaftar di sistem (Hubungi admin untuk ubah).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input value={profile?.nama || ''} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={profile?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Tanggal Lahir</Label>
              <Input value={profile?.tgl_lahir || '-'} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Ganti Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Keamanan
            </CardTitle>
            <CardDescription>Ganti password login Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-2">
                <Label>Password Baru</Label>
                <Input 
                  type="password" 
                  placeholder="******" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={passLoading || !newPassword}>
                {passLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}