import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = 'edge';

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
        // We snapshot the current state of the columns into the published_config JSONB
        // SECURITY: Filter out any demo/mock monitors before publishing
        const filteredMonitors = (site.monitors || []).filter((id: string) => !id.startsWith('demo-'));

        // Handle Annotations: Compare with previous published config to set dates for new updates
        const currentAnnotations = site.theme_config?.annotations || {};
        const previousPublishedAnnotations = site.published_config?.annotations || {};
        const now = new Date().toISOString();
        let hasAnnotationUpdates = false;

        // Deep copy annotations to avoid mutation issues if any
        const updatedAnnotations = JSON.parse(JSON.stringify(currentAnnotations));

        Object.keys(updatedAnnotations).forEach(monitorId => {
            const monitorUpdates = updatedAnnotations[monitorId];
            const previousMonitorUpdates = previousPublishedAnnotations[monitorId] || [];

            monitorUpdates.forEach((update: any) => {
                // Check if this update ID existed in previous published config
                const exists = previousMonitorUpdates.some((u: any) => u.id === update.id);

                // If it's a new update (not in previous published), update its createdAt to now
                // We use the ID to track uniqueness. 
                if (!exists) {
                    update.createdAt = now;
                    hasAnnotationUpdates = true;
                }
            });
        });

        // If we updated timestamps, we need to update theme_config as well so the editor reflects the new times
        if (hasAnnotationUpdates) {
            const { error: themeUpdateError } = await supabase
                .from('sites')
                .update({
                    theme_config: { ...site.theme_config, annotations: updatedAnnotations }
                })
                .eq('id', siteId);

            if (themeUpdateError) {
                console.error("Failed to update theme_config timestamps", themeUpdateError);
                // We continue anyway, as publishing is the priority, but warn.
            }
        }

        const publishedConfig = {
            brand_name: site.brand_name,
            logo_url: site.logo_url,
            api_key: site.api_key,
            monitor_provider: site.monitor_provider || 'uptimerobot',
            monitors: filteredMonitors,
            annotations: updatedAnnotations, // Use the updated annotations
            theme_config: { ...site.theme_config, annotations: updatedAnnotations },
            subdomain: site.subdomain,
            published_at: now
        };

        // Update the site with the new published config
        const { error: updateError } = await supabase
            .from('sites')
            .update({ published_config: publishedConfig })
            .eq('id', siteId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, publishedAt: publishedConfig.published_at, publishedConfig });

    } catch (error) {
        console.error("[Publish API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
