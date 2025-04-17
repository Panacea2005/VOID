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
}

const MUSIC_AI_API_URL = process.env.NEXT_PUBLIC_MUSIC_AI_API_URL || "https://apibox.erweima.ai/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_MUSIC_API_KEY;
const CALLBACK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/music/callback`
  : "https://void-resonance.vercel.app/ai";

if (!API_KEY) {
  throw new Error("NEXT_PUBLIC_MUSIC_API_KEY is not defined in environment variables");
}

if (!CALLBACK_URL) {
  throw new Error("NEXT_PUBLIC_APP_URL is not defined in environment variables for callback URL");
}

const apiClient = axios.create({
  baseURL: MUSIC_AI_API_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

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

    console.log("Sending payload to API:", payload);

    try {
      const response = await apiClient.post("/generate", payload);
      const data = response.data;
      console.log("Raw API response from generateMusic:", data);

      if (!data) {
        throw new Error("Empty response received from API");
      }

      if (data.code !== 200) {
        throw new Error(data.msg || "Failed to generate music");
      }

      const taskId = data.data?.taskId || data.data?.id;
      if (!taskId) {
        throw new Error("Task ID not found in API response");
      }

      return {
        id: taskId,
        status: data.data.status || "PENDING",
        audio_url: data.data.audio_url,
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
      console.log("Raw API response from getMusicGenerationDetails:", data);

      if (!data) {
        throw new Error("Empty response received from API");
      }

      if (data.code !== 200) {
        throw new Error(data.msg || "Failed to fetch music generation details");
      }

      // Handle different response structures
      const result: MusicRecordInfoResponse = {
        id: data.data.id || taskId,
        status: data.data.status || "PENDING",
        audio_url: data.data.audio_url || data.data.audioUrl,
        error: data.msg !== "success" ? data.msg : undefined,
      };

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