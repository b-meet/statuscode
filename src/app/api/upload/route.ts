import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const bucket = formData.get("bucket") as string;

        if (!file || !bucket) {
            return NextResponse.json({ error: "File and bucket are required" }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        // Generate a secure unique filename to prevent path traversal
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrl });
    } catch (err: any) {
        console.error("POST /api/upload error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
