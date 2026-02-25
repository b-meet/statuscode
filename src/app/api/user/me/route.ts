import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({ user });
    } catch (err: any) {
        console.error("GET /api/user/me error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // 2. Update User Metadata
        // user_metadata is updated via auth.updateUser
        const { data, error } = await supabase.auth.updateUser({
            data: body
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ user: data.user });
    } catch (err: any) {
        console.error("PUT /api/user/me error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
