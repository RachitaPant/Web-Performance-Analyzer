import { NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/puppeteer";

export async function POST(req: Request) {
    console.log("Received request:", req.method);
  try {
    const { url } = await req.json();
    console.log("Received URL:", url);
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    const data = await analyzeWebsite(url);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze website" }, { status: 500 });
  }
}
