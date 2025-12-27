import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  // 1. Get Authenticated User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. If not logged in, force redirect to login
  if (!user) {
    return redirect("/auth/login");
  }

  // 3. Check Role in Database (tbteacher)
  const { data: profile } = await supabase
    .from("tbteacher")
    .select("role")
    .eq("id_teacher", user.id)
    .single();

  const role = profile?.role?.toLowerCase().trim();

  // 4. Redirect based on Role
  if (role === "finance") {
    return redirect("/protected/finance");
  } 
  
  if (role === "teacher") {
    return redirect("/protected/teacher");
  }

  // 5. Fallback: If role is 'admin' OR if no profile exists (Admin fallback)
  // We send them to the Admin Dashboard
  return redirect("/protected/admin");
}