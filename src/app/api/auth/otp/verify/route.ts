import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const { email, token } = await req.json();

        if (!email || !token) {
            return NextResponse.json({ error: "Email and token are required" }, { status: 400 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "email",
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        // Return user session data to the client if needed
        return NextResponse.json({ success: true, user: data.user });
    } catch (err: any) {
        console.error("Auth OTP Verify Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
