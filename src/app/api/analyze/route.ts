import { NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/puppeteer";
import { runLighthouse } from "@/lib/lighthouse"; 

export async function POST(req: Request) {
  console.log("Received request:", req.method);
  try {
    const { url } = await req.json();
    console.log("Received URL:", url);

    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "Valid URL is required" }, { status: 400 });
    }

    const [puppeteerData, lighthouseData] = await Promise.all([
      analyzeWebsite(url),
      runLighthouse(url),
    ]);
    if ('error' in lighthouseData) {
      return NextResponse.json({ error: lighthouseData.error }, { status: 500 });
    }
    return NextResponse.json({ puppeteerData, lighthouseData: lighthouseData.report });
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze website" }, { status: 500 });
  }
}
