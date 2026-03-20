import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword)
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

  if (typeof newPassword !== "string" || newPassword.length < 8)
    return NextResponse.json({ success: false, error: "password_too_short" }, { status: 400 });

  const email = (session.user?.email ?? "").toLowerCase().trim();
  const user  = await User.findOne({ email });

  if (user) {
    // DB user — verify against stored hash
    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid)
      return NextResponse.json({ success: false, error: "wrong_current_password" }, { status: 400 });

    const passwordHash = await hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, { passwordHash });
  } else {
    // No DB user yet — verify against env var plain-text password
    if (currentPassword !== process.env.ADMIN_PASSWORD)
      return NextResponse.json({ success: false, error: "wrong_current_password" }, { status: 400 });

    // Create DB user with new password
    const passwordHash = await hash(newPassword, 10);
    await User.create({ email, passwordHash });
  }

  return NextResponse.json({ success: true });
}
