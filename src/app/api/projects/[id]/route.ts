import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Prevent modification of user_id
        if (body.user_id) {
            delete body.user_id;
        }

        // 2. Update Project (Ensuring user owns it by checking user_id)
        const { data, error } = await supabase
            .from("sites")
            .update(body)
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                // Subdomain collision
                return NextResponse.json({ error: "Subdomain already taken", code: '23505' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ project: data });
    } catch (err: any) {
        console.error(`PATCH /api/projects/[id] error:`, err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Parse optional deletion metadata from URL correctly
        const { searchParams } = new URL(req.url);
        const siteName = searchParams.get('siteName') || 'Unknown';
        const consentText = searchParams.get('consentText') || '';

        // 2. Log deletion
        try {
            await supabase.from('deletion_logs').insert({
                site_id: id,
                user_id: user.id,
                site_name: siteName,
                consent_text: consentText,
                action: 'delete'
            });
        } catch (e) {
            console.warn("Failed to log deletion consent:", e);
        }

        // 3. Delete Project (Ensuring user owns it)
        const { error } = await supabase
            .from("sites")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error(`DELETE /api/projects/[id] error:`, err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
