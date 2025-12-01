import { GoogleGenAI } from "@google/genai";
import { LogEntry } from "../types";

const getGeminiClient = () => {
    // In a real app, ensure process.env.API_KEY is defined.
    // Assuming environment variable injection is handled by the build system/platform
    if (!process.env.API_KEY) {
      console.warn("Gemini API Key missing");
      return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeSecurityLogs = async (logs: LogEntry[]): Promise<string> => {
  const ai = getGeminiClient();
  if (!ai) return "AI Analysis unavailable: Missing API Key.";

  // Take the last 20 logs to avoid token limits in this demo
  const recentLogs = logs.slice(0, 20);
  const logsText = JSON.stringify(recentLogs, null, 2);

  const prompt = `
    You are a Cyber Security Expert Auditor. Analyze the following system logs for suspicious activity.
    The system implements MAC, DAC, RBAC, RuBAC, and ABAC.
    
    Look for:
    1. Repeated failed access attempts (Brute force/Unauthorized access).
    2. Access denied due to "Time Restriction" (RuBAC violations).
    3. Mismatches in Department access (ABAC violations).
    4. Top Secret clearance violations (MAC).

    Logs:
    ${logsText}

    Provide a concise summary of threats found (if any) and one recommendation.
    Format as Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep thought for this status check
      }
    });
    return response.text || "No analysis returned.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error performing AI analysis. Please check system configuration.";
  }
};
