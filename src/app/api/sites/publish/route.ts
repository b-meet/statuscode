import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { siteId } = body;

        if (!siteId) {
            return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
        }

        // Fetch current site config
        const { data: site, error: fetchError } = await supabase
            .from('sites')
            .select('*')
            .eq('id', siteId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !site) {
            return NextResponse.json({ error: "Site not found" }, { status: 404 });
        }

        // Construct published config from current columns
        // We snapshot the current state of the editor columns into the published_config JSONB
        // SECURITY: Filter out any demo/mock monitors before publishing
        const filteredMonitors = (site.monitors || []).filter((id: string) => !id.startsWith('demo-'));

        const publishedConfig = {
            brand_name: site.brand_name,
            logo_url: site.logo_url,
            uptimerobot_api_key: site.uptimerobot_api_key,
            monitors: filteredMonitors,
            theme_config: site.theme_config,
            subdomain: site.subdomain,
            published_at: new Date().toISOString()
        };

        // Update the site with the new published config
        const { error: updateError } = await supabase
            .from('sites')
            .update({ published_config: publishedConfig })
            .eq('id', siteId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, publishedAt: publishedConfig.published_at });

    } catch (error) {
        console.error("[Publish API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
