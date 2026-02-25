import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Check if user exists by trying to sign in without creating
        let isNewUser = false;

        const { error: existingError } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false },
        });

        if (existingError) {
            // Probably user not found, so they are new
            isNewUser = true;

            // Now actually send the OTP and create
            const { error: createError } = await supabase.auth.signInWithOtp({
                email,
                options: { shouldCreateUser: true },
            });

            if (createError) {
                return NextResponse.json({ error: createError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, isNewUser });
    } catch (err: any) {
        console.error("Auth OTP Send Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
