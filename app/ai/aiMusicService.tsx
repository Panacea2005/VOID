// aiMusicService.tsx
import { MUSIC_API_KEY, MUSIC_AI_API_URL } from "../config/env";

interface Prompt {
  text: string;
}

interface ComposeTrackPayload {
  prompt: Prompt;
  format?: "mp3" | "aac" | "wav";
  looping?: boolean;
}

interface ComposeTrackResponse {
  status: string;
  task_id: string;
}

interface TaskStatusResponse {
  status: string;
  meta?: {
    project_id: string;
    track_id: string;
    prompt: Prompt;
    version: number;
    track_url: string;
    stems_url: {
      bass: string;
      chords: string;
      melody: string;
      percussion: string;
    };
  };
}

const headers = {
  Authorization: `Bearer ${MUSIC_API_KEY}`,
  "Content-Type": "application/json",
};

export const composeTrack = async (
  prompt: string,
  format: "mp3" | "aac" | "wav" = "mp3",
  looping: boolean = false
): Promise<ComposeTrackResponse> => {
  const payload: ComposeTrackPayload = {
    prompt: { text: prompt },
    format,
    looping,
  };

  try {
    const response = await fetch(`${MUSIC_AI_API_URL}/api/v1/tracks/compose`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error composing track:", error);
    throw error;
  }
};

export const checkTaskStatus = async (taskId: string): Promise<TaskStatusResponse> => {
  try {
    const response = await fetch(`${MUSIC_AI_API_URL}/api/v1/tasks/${taskId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking task status:", error);
    throw error;
  }
};

// Polling function to wait for track composition to complete
export const waitForTrack = async (taskId: string, interval = 3000, maxAttempts = 20): Promise<string> => {
  let attempts = 0;

  const poll = async (): Promise<string> => {
    const result = await checkTaskStatus(taskId);
    if (result.status === "composed" && result.meta?.track_url) {
      return result.meta.track_url;
    }
    if (attempts >= maxAttempts) {
      throw new Error("Max polling attempts reached");
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, interval));
    return poll();
  };

  return poll();
};