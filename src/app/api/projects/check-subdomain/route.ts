import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const subdomain = searchParams.get('subdomain');
        const excludeId = searchParams.get('excludeId');

        if (!subdomain) {
            return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Optional authentication check, though subdomains are technically global public knowledge
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let query = supabase
            .from('sites')
            .select('id')
            .eq('subdomain', subdomain);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ available: !data });
    } catch (err: any) {
        console.error("GET /api/projects/check-subdomain error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
