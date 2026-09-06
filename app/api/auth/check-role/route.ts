import { NextResponse } from "next/server";
import { getAuthenticatedUser, getUserGlobalRoles } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, isSuperAdmin: false, roles: [] });
    }

    const roles = await getUserGlobalRoles(user.id);
    const isSuperAdmin = roles.includes("super_admin");

    return NextResponse.json({
      authenticated: true,
      isSuperAdmin,
      roles,
    });
  } catch {
    return NextResponse.json({ authenticated: false, isSuperAdmin: false, roles: [] }, { status: 500 });
  }
}
