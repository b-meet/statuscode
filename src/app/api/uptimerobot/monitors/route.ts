import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { apiKey, ...rest } = body;

        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        // Construct search params from rest
        const params = new URLSearchParams();
        params.append('api_key', apiKey);
        params.append('format', 'json');

        // Add other parameters if they exist
        Object.keys(rest).forEach(key => {
            if (rest[key] !== undefined && rest[key] !== null) {
                params.append(key, String(rest[key]));
            }
        });

        const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cache-Control": "no-cache",
            },
            body: params.toString(),
        });

        const data = await response.json();

        if (data.stat !== "ok") {
            return NextResponse.json({ error: data.error?.message || "Failed to fetch monitors" }, { status: 400 });
        }

        return NextResponse.json({ monitors: data.monitors });
    } catch (error) {
        console.error("UptimeRobot Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
