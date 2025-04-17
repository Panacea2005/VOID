import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Received music generation callback:", JSON.stringify(data, null, 2));

    const taskId = data.taskId || data.id;
    if (!taskId) {
      throw new Error("Task ID is required in callback data");
    }

    const status = data.status;
    if (!status) {
      throw new Error("Status is required in callback data");
    }

    const callbackData = {
      status: status,
      audio_url: data.audio_url || data.audioUrl || data.url,
      error: data.error || (data.msg !== "success" ? data.msg : undefined),
    };

    // Store the callback data in Vercel KV
    await kv.set(`music:${taskId}`, JSON.stringify(callbackData), { ex: 3600 }); // Expire after 1 hour
    console.log(`Stored callback data for taskId ${taskId} in Vercel KV`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json(
      { error: "Failed to process callback", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const data = await kv.get(`music:${taskId}`);
    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(data as string), { status: 200 });
  } catch (error) {
    console.error("Error fetching music generation status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}