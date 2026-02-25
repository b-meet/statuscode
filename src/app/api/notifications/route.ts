import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('app_notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notifications: data });
    } catch (err: any) {
        console.error("GET /api/notifications error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const { data, error } = await supabase
            .from('app_notifications')
            .insert({
                ...body,
                user_id: user.id,
                is_read: false
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ notification: data });
    } catch (err: any) {
        console.error("POST /api/notifications error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        if (body.all) {
            // Mark all read
            const { error } = await supabase
                .from('app_notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true });
        } else if (body.id) {
            // Mark single read
            const { error } = await supabase
                .from('app_notifications')
                .update({ is_read: true })
                .eq('id', body.id)
                .eq('user_id', user.id); // Ensure ownership

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });

    } catch (err: any) {
        console.error("PATCH /api/notifications error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
