import axios from "axios";

interface MusicGenerationParams {
  prompt?: string;
  style?: string;
  title?: string;
  instrumental: boolean;
  customMode?: boolean;
  model?: string;
  negativeTags?: string;
}

interface MusicGenerationResponse {
  id: string;
  status: string;
  audio_url?: string;
  error?: string;
}

interface MusicRecordInfoResponse {
  id: string;
  status: string;
  audio_url?: string;
  error?: string;
  potentialUrls?: string[]; // Add potentialUrls property
}

const MUSIC_AI_API_URL = process.env.NEXT_PUBLIC_MUSIC_AI_API_URL || "https://apibox.erweima.ai/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_MUSIC_API_KEY;
const CALLBACK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/music/callback`
  : "https://void-resonance.vercel.app/api/music/callback";

if (!API_KEY) {
  throw new Error("NEXT_PUBLIC_MUSIC_API_KEY is not defined in environment variables");
}

if (!CALLBACK_URL) {
  throw new Error("NEXT_PUBLIC_APP_URL is not defined in environment variables for callback URL");
}

console.log("Using callback URL:", CALLBACK_URL);

const apiClient = axios.create({
  baseURL: MUSIC_AI_API_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Helper function to deeply search for audio URL in an object
// Enhanced helper function to deeply search for audio URL in an object
function findAudioUrl(obj: any, path = ""): { found: boolean; url?: string; path?: string } {
  if (!obj || typeof obj !== 'object') return { found: false };
  
  // Check for common audio URL field names
  const audioFields = [
    'audio_url', 'audioUrl', 'url', 'fileUrl', 'mp3_url', 'audio', 'music_url',
    'result_url', 'output_url', 'download_url', 'file', 'mp3', 'wav', 'result'
  ];
  
  // First pass: check exact field names
  for (const field of audioFields) {
    if (obj[field] && typeof obj[field] === 'string' && 
        (obj[field].includes('http') || obj[field].startsWith('/api/'))) {
      console.log(`Found exact match for audio URL at ${path}.${field}:`, obj[field]);
      return { found: true, url: obj[field], path: `${path}.${field}` };
    }
  }
  
  // Second pass: check for fields containing these keywords
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].includes('http')) {
      // Check if the key name contains any of our audio-related keywords
      const isLikelyAudioField = audioFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase().replace('_', ''))
      );
      
      if (isLikelyAudioField) {
        console.log(`Found likely audio URL at ${path}.${key}:`, obj[key]);
        return { found: true, url: obj[key], path: `${path}.${key}` };
      }
    }
  }
  
  // Look for any URL that ends with audio file extension
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].includes('http')) {
      const url = obj[key].toLowerCase();
      if (url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || 
          url.endsWith('.m4a') || url.endsWith('.aac')) {
        console.log(`Found URL with audio extension at ${path}.${key}:`, obj[key]);
        return { found: true, url: obj[key], path: `${path}.${key}` };
      }
    }
  }
  
  // If nothing is found but there's a payload or data field that's stringified JSON, parse and check
  for (const key of ['payload', 'data', 'result']) {
    if (obj[key] && typeof obj[key] === 'string' && 
        (obj[key].includes('{') || obj[key].includes('['))) {
      try {
        const parsed = JSON.parse(obj[key]);
        const result = findAudioUrl(parsed, `${path}.${key}(parsed)`);
        if (result.found) return result;
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  
  // Recursively check nested objects
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && obj[key] !== null) {
      const result = findAudioUrl(obj[key], `${path}.${key}`);
      if (result.found) return result;
    }
  }
  
  // If still no URL found, look for ANY http URL as a last resort
  for (const key in obj) {
    if (typeof obj[key] === 'string' && obj[key].includes('http')) {
      console.log(`Found fallback URL at ${path}.${key}:`, obj[key]);
      return { found: true, url: obj[key], path: `${path}.${key}` };
    }
  }
  
  return { found: false };
}

export async function generateMusic(params: MusicGenerationParams): Promise<MusicGenerationResponse> {
  const instrumental = params.instrumental ?? false;
  console.log("generateMusic received params:", params);
  console.log("instrumental value after fallback:", instrumental);

  const payload = {
    prompt: params.prompt,
    tags: params.style,
    title: params.title,
    instrumental: instrumental,
    custom_mode: params.customMode ?? true,
    model: params.model || "V3_5",
    negative_tags: params.negativeTags,
    callBackUrl: CALLBACK_URL,
  };

  if (payload.instrumental == null) {
    console.warn("instrumental was null, setting to false");
    payload.instrumental = false;
  }

  try {
    // Input validation
    if (params.customMode) {
      if (params.style && params.style.length > 200) {
        throw new Error("Style must not exceed 200 characters");
      }
      if (params.title && params.title.length > 80) {
        throw new Error("Title must not exceed 80 characters");
      }
      if (!instrumental && params.prompt && params.prompt.length > 3000) {
        throw new Error("Prompt must not exceed 3000 characters");
      }
    } else {
      if (params.prompt && params.prompt.length > 400) {
        throw new Error("Prompt must not exceed 400 characters in Non-custom Mode");
      }
    }

    if (params.customMode) {
      if (!params.style || !params.title) {
        throw new Error("Style and title are required in Custom Mode");
      }
      if (!instrumental && !params.prompt) {
        throw new Error("Prompt is required when instrumental is false in Custom Mode");
      }
    } else {
      if (!params.prompt) {
        throw new Error("Prompt is required in Non-custom Mode");
      }
    }

    const validModels = ["V3_5", "V4"];
    const selectedModel = params.model || "V3_5";
    if (!validModels.includes(selectedModel)) {
      throw new Error("Model must be either V3_5 or V4");
    }
    payload.model = selectedModel;

    console.log("Sending payload to API:", JSON.stringify(payload, null, 2));

    try {
      const response = await apiClient.post("/generate", payload);
      const data = response.data;
      console.log("Raw API response from generateMusic:", JSON.stringify(data, null, 2));

      if (!data) {
        throw new Error("Empty response received from API");
      }

      if (data.code !== 200) {
        throw new Error(data.msg || "Failed to generate music");
      }

      // Log response structure for debugging
      console.log("Generate response structure:", Object.keys(data));
      if (data.data) {
        console.log("data.data structure:", Object.keys(data.data));
      }

      const taskId = data.data?.taskId || data.data?.id;
      if (!taskId) {
        throw new Error("Task ID not found in API response");
      }

      // Search for audio URL in the response
      const audioUrlSearch = findAudioUrl(data);
      const audio_url = audioUrlSearch.found ? audioUrlSearch.url : data.data.audio_url;
      
      if (audioUrlSearch.found) {
        console.log(`Found audio URL at ${audioUrlSearch.path} in generate response`);
      }

      return {
        id: taskId,
        status: data.data.status || "PENDING",
        audio_url,
        error: data.msg !== "success" ? data.msg : undefined,
      };
    } catch (apiError: any) {
      // Handle specific axios errors
      if (apiError.response) {
        // The server responded with a status code outside the 2xx range
        console.error("API Error Response:", apiError.response.data);
        throw new Error(`API Error (${apiError.response.status}): ${
          apiError.response.data?.msg || apiError.response.statusText || "Unknown error"
        }`);
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error("No response received from API");
        throw new Error("No response received from music API. Please check your network connection.");
      } else {
        // Something happened in setting up the request
        throw apiError;
      }
    }
  } catch (error: any) {
    console.error("Error generating music:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw new Error(error.message || "Failed to generate music");
  }
}

export async function getMusicGenerationDetails(taskId: string): Promise<MusicRecordInfoResponse> {
  try {
    if (!taskId) {
      throw new Error("taskId is required");
    }

    console.log(`Fetching details for music generation task: ${taskId}`);

    try {
      const response = await apiClient.get("/generate/record-info", {
        params: { taskId },
      });
      const data = response.data;
      console.log("Raw API response from getMusicGenerationDetails:", JSON.stringify(data, null, 2));

      if (!data) {
        throw new Error("Empty response received from API");
      }

      if (data.code !== 200) {
        throw new Error(data.msg || "Failed to fetch music generation details");
      }

      // Log response structure for debugging
      console.log("Details response structure:", Object.keys(data));
      if (data.data) {
        console.log("data.data structure:", Object.keys(data.data));
      }

      // Search for audio URL in the response
      const audioUrlSearch = findAudioUrl(data);
      
      // Handle different response structures
      const result: MusicRecordInfoResponse = {
        id: data.data?.id || taskId,
        status: data.data?.status || "PENDING",
        audio_url: audioUrlSearch.found ? audioUrlSearch.url : (data.data?.audio_url || data.data?.audioUrl),
        error: data.msg !== "success" ? data.msg : undefined,
      };

      if (audioUrlSearch.found) {
        console.log(`Found audio URL at ${audioUrlSearch.path} in details response`);
      }

      // Special case: if status is SUCCESS but no audio_url, do a deeper inspection
      if ((result.status === "SUCCESS" || result.status === "completed") && !result.audio_url) {
        console.log("⚠️ Status is SUCCESS but no audio_url found. Raw data:", JSON.stringify(data, null, 2));
        
        // Approach 1: Check for any potential URL fields in the response
        const potentialUrls: { path: string; url: string | undefined; }[] = [];
        const findUrls = (obj: any, path = "") => {
          if (!obj || typeof obj !== 'object') return;
          
          for (const key in obj) {
            const fullPath = path ? `${path}.${key}` : key;
            if (typeof obj[key] === 'string' && obj[key].includes('http')) {
              potentialUrls.push({ path: fullPath, url: obj[key] });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              findUrls(obj[key], fullPath);
            }
          }
        };
        
        findUrls(data);
        
        if (potentialUrls.length > 0) {
          console.log("🔍 Found potential URLs in the response:", potentialUrls);
          // Use the first URL found as a fallback
          result.audio_url = potentialUrls[0].url;
          console.log("⚠️ Using fallback URL:", result.audio_url);
        }
        
        // Approach 2: Check if data.data contains a 'payload' field that might have the URL
        if (!result.audio_url && data.data?.payload) {
          console.log("Checking payload field:", data.data.payload);
          try {
            const payload = typeof data.data.payload === 'string' 
              ? JSON.parse(data.data.payload) 
              : data.data.payload;
            
            const payloadUrlSearch = findAudioUrl(payload);
            if (payloadUrlSearch.found) {
              result.audio_url = payloadUrlSearch.url;
              console.log("Found audio URL in payload:", result.audio_url);
            }
          } catch (e) {
            console.warn("Error parsing payload:", e);
          }
        }
        
        // Approach 3: Try an alternative API endpoint if available
        if (!result.audio_url) {
          try {
            console.log("Trying alternative endpoint to fetch audio URL...");
            const alternativeResponse = await apiClient.get("/generate/task-info", {
              params: { taskId },
            });
            
            if (alternativeResponse.data && alternativeResponse.data.code === 200) {
              const altUrlSearch = findAudioUrl(alternativeResponse.data);
              if (altUrlSearch.found) {
                result.audio_url = altUrlSearch.url;
                console.log("Found audio URL in alternative endpoint:", result.audio_url);
              }
            }
          } catch (altError) {
            console.warn("Alternative endpoint failed:", altError);
          }
        }
        
        // Approach 4: Final fallback - check for file download URL patterns
        if (!result.audio_url) {
          // Some APIs might use a predictable URL pattern
          const possibleUrls = [
            `${MUSIC_AI_API_URL}/download/${taskId}`,
            `${MUSIC_AI_API_URL}/files/${taskId}.mp3`,
            `${MUSIC_AI_API_URL}/output/${taskId}`,
            `${MUSIC_AI_API_URL}/stream/${taskId}`
          ];
          
          console.log("No audio URL found, but task completed. Generated possible URLs:", possibleUrls);
          
          // We're not actually checking these URLs (would require HEAD requests)
          // but we'll pass the first one as a hint to the frontend that it might want to try these
          result.audio_url = possibleUrls[0];
          result.potentialUrls = possibleUrls; // Add to response
        }
      }

      // Log the final processed result
      console.log("Processed music generation details:", result);
      return result;
    } catch (apiError: any) {
      // Handle specific axios errors
      if (apiError.response) {
        // The server responded with a status code outside the 2xx range
        console.error("API Error Response:", apiError.response.data);
        throw new Error(`API Error (${apiError.response.status}): ${
          apiError.response.data?.msg || apiError.response.statusText || "Unknown error"
        }`);
      } else if (apiError.request) {
        // The request was made but no response was received
        console.error("No response received from API");
        throw new Error("No response received from music details API. Please check your network connection.");
      } else {
        // Something happened in setting up the request
        throw apiError;
      }
    }
  } catch (error: any) {
    console.error("Error fetching music generation details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      taskId,
    });
    throw new Error(error.message || "Failed to fetch music generation details");
  }
}