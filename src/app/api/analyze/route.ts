import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json();

  if (!url || !url.startsWith("http")) {
    return NextResponse.json(
      { error: "Valid URL is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${process.env.NEXT_API_ENDPOINT}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Next.js API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to analysis backend" },
      { status: 500 }
    );
  }
}
