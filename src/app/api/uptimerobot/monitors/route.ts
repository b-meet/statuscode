import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cache-Control": "no-cache",
            },
            body: `api_key=${apiKey}&format=json`,
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
