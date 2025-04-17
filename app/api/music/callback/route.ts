import { NextResponse } from "next/server";
import * as vercelBlob from "@vercel/blob";

// In-memory fallback for local development without Blob token
const localCache = new Map();

// Helper function to work with either Blob or local cache
async function storeData(key: string, data: any) {
  try {
    // Try to use Vercel Blob first
    const response = await vercelBlob.put(`music-callbacks/${key}.json`, JSON.stringify(data), {
      contentType: "application/json",
      access: "public"
    });
    console.log(`Successfully stored data in Blob storage at: ${response.url}`);
    return response.url;
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
    try {
      const response = await vercelBlob.list({ prefix: `music-callbacks/${key}.json` });
      if (response.blobs && response.blobs.length > 0) {
        const blobUrl = response.blobs[0].url;
        const fetchResponse = await fetch(blobUrl);
        if (!fetchResponse.ok) {
          throw new Error(`Failed to fetch blob data: ${fetchResponse.status} ${fetchResponse.statusText}`);
        }
        const text = await fetchResponse.text();
        return JSON.parse(text);
      }
    } catch (blobError) {
      console.warn("Blob retrieval error:", blobError);
      // Fall back to in-memory cache if Blob storage fails
    }
    
    // Return data from local cache if blob storage failed
    const cachedData = localCache.get(key);
    console.log(`Retrieved data from ${cachedData ? 'local cache' : 'nowhere'} for key: ${key}`);
    return cachedData || null;
  } catch (error) {
    console.error("Failed to retrieve data:", error);
    return null;
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

    // Log all fields in data to check where audio URL might be
    console.log("All fields in received data:", Object.keys(data));
    console.log("Saving callback data:", callbackData);

    // Store in Blob or fall back to local cache
    const storageUrl = await storeData(taskId, callbackData);
    console.log(`Stored callback data for taskId ${taskId}${storageUrl ? ` at ${storageUrl}` : ' in local cache'}`);

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
    
    console.log(`GET request for taskId ${taskId}:`, data ? "Data found" : "No data found");
    
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

    // Log fields in data to diagnose audio_url issue
    console.log(`Data fields for taskId ${taskId}:`, Object.keys(data));
    if (data.audio_url) {
      console.log("Audio URL found:", data.audio_url);
    } else {
      console.log("No audio_url in data. Full data:", JSON.stringify(data, null, 2));
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