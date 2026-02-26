import { NextRequest, NextResponse } from "next/server";
import { getMonitors } from "@/lib/monitors";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { apiKey, monitorProvider, ...rest } = body;

        if (!apiKey) {
            return NextResponse.json({ error: "API Key is required" }, { status: 400 });
        }

        const monitors = await getMonitors(monitorProvider, apiKey, rest);

        return NextResponse.json({ monitors });
    } catch (error: any) {
        console.error("Monitor Proxy Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch monitors" }, { status: 500 });
    }
}
