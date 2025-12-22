
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponseNode } from "../types";

export const generateMindMapData = async (topic: string): Promise<AIResponseNode[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a professional brainstorming assistant. Create a detailed hierarchical mind map for the topic: "${topic}". 
    The output must be a JSON array of objects, where each object has a 'label' and an optional 'children' array. 
    Be creative and thorough. Return only the JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING } } } }
                },
                required: ["label"]
              }
            }
          },
          required: ["label"]
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return [];
  }
};
