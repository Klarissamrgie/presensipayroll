import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 1. Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Redirect to Login if not authenticated
  if (!user && request.nextUrl.pathname.startsWith("/protected")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 3. If authenticated, check Role-Based Access
  if (user && request.nextUrl.pathname.startsWith("/protected")) {
    // Fetch the user's role from the database
    // Note: We use the supabase client created above which has the user's session
    const { data: profile } = await supabase
        .from('tbteacher')
        .select('role')
        .eq('id_teacher', user.id)
        .single();
    
    const role = profile?.role?.toLowerCase().trim();
    const path = request.nextUrl.pathname;

    // --- ACCESS RULES ---
    
    // A. ADMIN Rules
    if (path.startsWith("/protected/admin")) {
        if (role !== "admin") {
            // Kick them back to their own dashboard or root
            return redirectBasedOnRole(role, request);
        }
    }

    // B. FINANCE Rules
    if (path.startsWith("/protected/finance")) {
        if (role !== "finance") {
             return redirectBasedOnRole(role, request);
        }
    }

    // C. TEACHER Rules
    if (path.startsWith("/protected/teacher")) {
        // Optional: Maybe Admin/Finance can also view Teacher pages? 
        // If stricty only Teacher:
        if (role !== "teacher") {
             return redirectBasedOnRole(role, request);
        }
    }
  }

  return response;
}

// Helper function to send users to their safe zone
function redirectBasedOnRole(role: string | undefined, request: NextRequest) {
    const url = request.nextUrl.clone();
    
    if (role === 'admin') {
        url.pathname = '/protected/admin';
    } else if (role === 'finance') {
        url.pathname = '/protected/finance';
    } else if (role === 'teacher') {
        url.pathname = '/protected/teacher';
    } else {
        // No role found? Send to generic protected or home
        url.pathname = '/protected'; 
    }
    
    return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};