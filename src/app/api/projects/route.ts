import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch User Projects
        const { data, error } = await supabase
            .from("sites")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ projects: data });
    } catch (err: any) {
        console.error("GET /api/projects error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Ensure user_id matches the authenticated user to prevent spoofing
        const sitePayload = {
            ...body,
            user_id: user.id
        };

        // 2. Create Project
        const { data, error } = await supabase
            .from("sites")
            .insert(sitePayload)
            .select()
            .single();

        if (error) {
            // Check for Subdomain collision (Postgres Code 23505)
            if (error.code === '23505') {
                // The frontend logic historically handles subdomains by retrying.
                // So we return a 409 Conflict indicating they need to try a different subdomain.
                return NextResponse.json({ error: "Subdomain already taken", code: '23505' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ project: data });
    } catch (err: any) {
        console.error("POST /api/projects error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
