import { NextResponse } from "next/server";
import { put, get, list, del } from "@vercel/blob";

// In-memory fallback for local development without Blob token
const localCache = new Map();

// Helper function to work with either Blob or local cache
async function storeData(key: string, data: any) {
  try {
    // Try to use Vercel Blob first
    const blob = await put(`music-callbacks/${key}.json`, JSON.stringify(data), {
      contentType: "application/json",
    });
    return blob.url;
  } catch (error) {
    console.warn("Failed to use Vercel Blob, falling back to local cache:", error);
    // Fall back to in-memory cache if Blob storage fails
    localCache.set(key, data);
    return null;
  }
}

async function getData(key: string) {
  try {
    // Try to get from Vercel Blob first
    const response = await get(`music-callbacks/${key}.json`);
    if (response) {
      const text = await response.text();
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.warn("Failed to use Vercel Blob, falling back to local cache:", error);
    // Fall back to in-memory cache if Blob storage fails
    return localCache.get(key) || null;
  }
}

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
      id: taskId,
      status: status,
      audio_url: data.audio_url || data.audioUrl || data.url,
      error: data.error || (data.msg !== "success" ? data.msg : undefined),
      timestamp: new Date().toISOString(),
    };

    // Store in Blob or fall back to local cache
    await storeData(taskId, callbackData);
    console.log(`Stored callback data for taskId ${taskId}`);

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

    // Try to get data from Blob or local cache
    const data = await getData(taskId);
    
    if (!data) {
      return NextResponse.json({ 
        id: taskId,
        status: "PENDING", 
        message: "No data found for this task yet. It may still be processing."
      }, { 
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    return NextResponse.json(data, { 
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error fetching music generation status:", error);
    return NextResponse.json(
      { 
        id: new URLSearchParams(request.url.split('?')[1]).get("taskId") || "unknown",
        status: "ERROR",
        error: "Failed to fetch status", 
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}