import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Sidebar } from "@/components/sidebar";
import { hasEnvVars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userEmail = data?.claims?.email;

  return (
    <main className="min-h-screen flex">
      <Sidebar userEmail={userEmail} />
      <div className="flex-1 flex flex-col">
        <nav className="w-full flex justify-between items-center border-b border-b-foreground/10 h-16 px-6">
          <div className="flex gap-5 items-center font-semibold">
            <Link href={"/"}>Home</Link>
          </div>
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
        </nav>
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
