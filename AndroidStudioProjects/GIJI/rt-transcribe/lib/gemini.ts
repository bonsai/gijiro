import { GoogleGenerativeAI } from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export function chooseSttModel() {
  return "gemini-pro";
}

export function chooseTextModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-pro";
}
