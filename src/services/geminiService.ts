import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PromptAnalysis {
  needsMoreInfo: boolean;
  missingFields: {
    date: boolean;
    time: boolean;
    location: boolean;
  };
  extractedData: {
    date: string;
    time: string;
    location: string;
  };
}

export async function analyzePrompt(prompt: string): Promise<PromptAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following event invitation description. We need to know if the user explicitly provided the date, time, and location.
    
    User Input: "${prompt}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          missingFields: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.BOOLEAN, description: "True if the date is NOT specified or unclear." },
              time: { type: Type.BOOLEAN, description: "True if the time is NOT specified or unclear." },
              location: { type: Type.BOOLEAN, description: "True if the location/venue is NOT specified or unclear." }
            },
            required: ["date", "time", "location"]
          },
          extractedData: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "The extracted date, or empty string if missing" },
              time: { type: Type.STRING, description: "The extracted time, or empty string if missing" },
              location: { type: Type.STRING, description: "The extracted location, or empty string if missing" }
            },
            required: ["date", "time", "location"]
          }
        },
        required: ["missingFields", "extractedData"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to analyze prompt.");
  }

  const result = JSON.parse(response.text.trim());
  return {
    needsMoreInfo: result.missingFields.date || result.missingFields.time || result.missingFields.location,
    ...result
  };
}

export interface EventData {
  title: string;
  description: string;
  themeName: string;
  themeColors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  uiStyle: 'elegant' | 'playful' | 'minimal' | 'bold' | 'romantic';
  isRTL: boolean;
  date: string;
  time: string;
  location: string;
  schedule: Array<{
    time: string;
    title: string;
    description: string;
  }>;
  vibe: string;
  welcomeMessage: string;
  images?: {
    hero: string;
    details: string;
    rsvp: string;
    timeline: string[];
  };
}

export async function generateEventDetails(
  prompt: string, 
  date: string, 
  time: string, 
  location: string
): Promise<EventData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert event planner and UI/UX designer for "Gatherly" - an app that creates dynamic, beautiful event pages. 
    
Based on the user's prompt and the confirmed details, generate structured data for their event page. 

CRITICAL INSTRUCTIONS - MUST FOLLOW EXACTLY:
1. LANGUAGE MATCHING: You MUST detect the language used in the "User Concept" and generate ALL outputs (title, description, welcomeMessage, schedule titles, schedule descriptions) in THAT EXACT LANGUAGE. For example, if the concept is in Persian (Farsi), write everything in Farsi.
2. TONE & VIBE: Do NOT use highly formal, stiff, or robotic language. Keep the tone very cool, catchy, warm, friendly, and natural ("vibe bahal"). Less formal, more exciting!
3. THEME-DRIVEN UI: Carefully analyze the requested theme. Choose a 'uiStyle' that perfectly reflects it.
4. RTL SUPPORT: If the user's language is written from right-to-left (like Persian, Arabic, or Hebrew), you MUST set "isRTL" to true.
5. ITINERARY: Create an engaging 3 to 5 step timeline for the event.

Confirmed Details:
Date: ${date}
Time: ${time}
Location: ${location}

User Concept: "${prompt}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The beautiful event title in the exact language of the user." },
          description: { type: Type.STRING, description: "A warm, inviting, catchy description of the event. Casual tone." },
          themeName: { type: Type.STRING, description: "The name of the event theme" },
          themeColors: {
            type: Type.OBJECT,
            properties: {
              primary: { type: Type.STRING, description: "Primary color hex code" },
              secondary: { type: Type.STRING, description: "Secondary color hex code" },
              background: { type: Type.STRING, description: "Background color hex code" },
              text: { type: Type.STRING, description: "Text color hex code (must contrast with background)" }
            },
            required: ["primary", "secondary", "background", "text"]
          },
          uiStyle: { 
            type: Type.STRING, 
            description: "Match the theme structurally. Choose exactly one: 'elegant', 'playful', 'minimal', 'bold', 'romantic'."
          },
          isRTL: {
            type: Type.BOOLEAN,
            description: "True if the generated text is in a right-to-left language like Persian or Arabic."
          },
          schedule: {
            type: Type.ARRAY,
            description: "A timeline of events during the gathering (in the user's language).",
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING, description: "Time of this schedule item" },
                title: { type: Type.STRING, description: "Title (in user's language)" },
                description: { type: Type.STRING, description: "Short description (in user's language, casual tone)" }
              },
              required: ["time", "title", "description"]
            }
          },
          vibe: { type: Type.STRING, description: "1-2 short keywords in English describing the visual aesthetic for image generation" },
          welcomeMessage: { type: Type.STRING, description: "A lovely sentence welcoming guests. Casual tone, user's language." }
        },
        required: ["title", "description", "themeName", "themeColors", "uiStyle", "isRTL", "schedule", "vibe", "welcomeMessage"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate event details.");
  }

  const generated = JSON.parse(response.text.trim());
  return {
    ...generated,
    date,
    time,
    location
  };
}

export async function generateEventImage(prompt: string, aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '16:9'): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A highly professional, beautiful photograph. No text, no words, no letters. ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio,
      }
    }
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No parts in image response");

  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
