import { createClient } from "@/lib/supabase/server";

export async function UserEmail() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user?.email) {
    return null;
  }

  return (
    <div className="mt-auto pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground px-3 py-2 truncate">
        {user.email}
      </p>
    </div>
  );
}

