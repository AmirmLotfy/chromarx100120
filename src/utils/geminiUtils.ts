import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const summarizeContent = async (content: string, language: string = 'en') => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Summarize the following content in ${language}:\n${content}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

export const suggestBookmarkCategory = async (
  title: string,
  url: string,
  language: string = 'en'
) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Suggest a single category for this bookmark in ${language}:\nTitle: ${title}\nURL: ${url}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};