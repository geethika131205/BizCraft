import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Level, Roadmap, Task } from "../types";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY
});

export async function generateStartupRoadmap(profile: Partial<UserProfile>, idea: string): Promise<Roadmap> {
  const prompt = `You are a startup advisor.

User profile:
* Experience: ${profile.experience}
* Budget: ${profile.budget}
* Time: ${profile.time}
* Industry: ${profile.industry}
* Goal: ${profile.goal}

Startup idea:
${idea}

Generate a step-by-step startup roadmap using these levels:
Idea → Validation → MVP → Launch → Revenue → Scale

For each level:
* Give a short description
* Keep it realistic and tailored to the user's constraints

Return structured JSON.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          levels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.INTEGER },
                name: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["level", "name", "description"]
            }
          }
        },
        required: ["levels"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as Roadmap;
}

export async function generateLevelTasks(level: Level, profile: UserProfile, idea: string): Promise<Task[]> {
  const prompt = `You are a startup execution coach.

User profile:
* Experience: ${profile.experience}
* Budget: ${profile.budget}
* Time: ${profile.time}
* Industry: ${profile.industry}
* Goal: ${profile.goal}

Startup idea:
${idea}

Current level: ${level}

Generate 3–5 highly actionable tasks for this level.

Rules:
* Must be specific and practical
* Must match budget and time constraints
* Must be beginner-friendly if needed
* Avoid generic advice

Return as JSON array of tasks.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    }
  });

  const rawTasks = JSON.parse(response.text || "[]") as { title: string; description: string }[];
  return rawTasks.map((t, index) => ({
    id: `task-${level}-${index}-${Date.now()}`,
    level,
    title: t.title,
    description: t.description,
    isCompleted: false
  }));
}

export async function askStartupQuestion(question: string, profile?: UserProfile, idea?: string, tasks?: Task[]): Promise<string> {
  const tasksContext = tasks && tasks.length > 0
    ? `Current Level Tasks:
      ${tasks.map(t => `- [${t.isCompleted ? 'X' : ' '}] ${t.title}: ${t.description}`).join('\n')}`
    : "";

  const context = profile && idea ? `
    Startup Idea: ${idea}
    Current Level: ${profile.currentLevel} (Level names: 1:Idea, 2:Validation, 3:MVP, 4:Launch, 5:Revenue, 6:Scale)
    User Experience: ${profile.experience}
    Budget: ${profile.budget}
    Time: ${profile.time}
    Industry: ${profile.industry}
    Goal: ${profile.goal}
    ${tasksContext}
  ` : "";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a helpful startup mentor. Answer the user's question clearly and simply with examples if needed. 
    ${context}
    Question: ${question}`,
    config: {
      systemInstruction: "You are a helpful startup mentor. Use the provided startup context and task progress to give specific, relevant advice. If the user asks about their progress, refer to their current level and tasks."
    }
  });
  return response.text || "I'm sorry, I couldn't generate a response.";
}

export async function generateStartupTip(level: number, idea: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a startup mentor. Give a single, punchy, actionable tip for a startup at Level ${level} (Level names: 1:Idea, 2:Validation, 3:MVP, 4:Launch, 5:Revenue, 6:Scale). The startup idea is: ${idea}. Keep it under 20 words.`,
  });
  return response.text || "Keep pushing forward!";
}

export async function evaluatePitch(videoBase64: string, mimeType: string, idea: string): Promise<{ feedback: string; score: number }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          data: videoBase64,
          mimeType: mimeType
        }
      },
      {
        text: `You are a venture capital investor. Evaluate this startup pitch video for the following idea: ${idea}. 
        Provide constructive feedback and a score out of 100. 
        Return the response as a JSON object with 'feedback' (string) and 'score' (number) fields.`
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          feedback: { type: Type.STRING },
          score: { type: Type.NUMBER }
        },
        required: ["feedback", "score"]
      }
    }
  });

  return JSON.parse(response.text || '{"feedback": "Error evaluating pitch", "score": 0}');
}

export async function evaluateFinancials(data: any): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a CFO advisor. Analyze these startup financials and provide a brief, actionable summary: ${JSON.stringify(data)}`,
  });
  return response.text || "Unable to analyze financials.";
}

export async function evaluateMVP(features: string[], idea: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a product manager. Evaluate these MVP features for the startup idea "${idea}": ${features.join(", ")}. 
    Is this a true MVP? What should be added or removed?`,
  });
  return response.text || "Unable to evaluate MVP.";
}
