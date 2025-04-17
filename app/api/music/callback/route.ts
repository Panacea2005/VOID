import { NextResponse } from "next/server";
import * as vercelBlob from "@vercel/blob";

// In-memory fallback for local development without Blob token
const localCache = new Map();

// Helper function to deeply search for audio URL in an object
function findAudioUrl(obj: any): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  
  // Check for common audio URL field names
  const audioFields = [
    'audio_url', 'audioUrl', 'url', 'fileUrl', 'mp3_url', 
    'audio', 'music_url', 'result_url', 'output_url'
  ];
  
  // First check direct fields
  for (const field of audioFields) {
    if (obj[field] && typeof obj[field] === 'string' && obj[field].includes('http')) {
      console.log(`Found audio URL in field: ${field}`, obj[field]);
      return obj[field];
    }
  }
  
  // Check nested objects
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      const nestedUrl = findAudioUrl(obj[key]);
      if (nestedUrl) return nestedUrl;
    }
  }
  
  // Last resort: find any URL
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].includes('http')) {
      return obj[key];
    }
  }
  
  return undefined;
}

// Helper function to work with either Blob or local cache
async function storeData(key: string, data: any) {
  try {
    // Ensure we always have audio_url extracted and at the top level
    if (!data.audio_url) {
      const url = findAudioUrl(data);
      if (url) {
        data.audio_url = url;
        console.log(`Extracted and added audio_url: ${url}`);
      }
    }
    
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

    const taskId = data.taskId || data.id || data.task_id;
    if (!taskId) {
      throw new Error("Task ID is required in callback data");
    }

    const status = data.status || data.state || "PENDING";
    
    // Extract audio URL with an enhanced approach
    let audioUrl = data.audio_url || data.audioUrl || data.url;
    
    // If no direct audio URL, search deeper
    if (!audioUrl) {
      audioUrl = findAudioUrl(data);
    }

    const callbackData = {
      id: taskId,
      status: status,
      audio_url: audioUrl,
      error: data.error || (data.msg && data.msg !== "success" ? data.msg : undefined),
      timestamp: new Date().toISOString(),
      // Store the entire raw data for debugging
      raw_data: data
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
    const fullResponse = searchParams.get("full") === "true";

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

    // If full response is requested, return the entire raw data
    if (fullResponse && data.raw_data) {
      console.log("Returning full raw data response");
      return NextResponse.json(data.raw_data, {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Recheck for audio URL in case it wasn't extracted properly before
    if (!data.audio_url && data.raw_data) {
      const extractedUrl = findAudioUrl(data.raw_data);
      if (extractedUrl) {
        console.log("Re-extracted audio URL from raw data:", extractedUrl);
        data.audio_url = extractedUrl;
      }
    }

    // Log fields in data to diagnose audio_url issue
    console.log(`Data fields for taskId ${taskId}:`, Object.keys(data));
    if (data.audio_url) {
      console.log("Audio URL found:", data.audio_url);
    } else {
      console.log("No audio_url in data. Checking raw_data fields...");
      if (data.raw_data) {
        console.log("Raw data fields:", Object.keys(data.raw_data));
      } else {
        console.log("No raw_data available");
      }
    }

    // Return the response without the raw_data field to keep it clean
    const responseData = { ...data };
    delete responseData.raw_data;
    
    return NextResponse.json(responseData, { 
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