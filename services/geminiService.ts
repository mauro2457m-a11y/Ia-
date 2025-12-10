import { GoogleGenAI, Type } from "@google/genai";
import { BookPlan, ChapterOutline } from "../types";

// Initialize client securely inside the function to avoid top-level env access issues
const getClient = () => {
  const apiKey = process.env.API_KEY as string;
  return new GoogleGenAI({ apiKey });
}

export const generateBookPlan = async (topic: string): Promise<BookPlan> => {
  const ai = getClient();
  
  // Define schema explicitly without strict Type dependency if possible, or use standard object
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy, best-selling title for the ebook" },
      subtitle: { type: Type.STRING, description: "A compelling subtitle" },
      salesDescription: { type: Type.STRING, description: "A marketing paragraph designed to sell the book" },
      coverVisualPrompt: { type: Type.STRING, description: "A highly detailed visual description for an image generator to create a book cover. Abstract, professional, high quality." },
      chapters: {
        type: Type.ARRAY,
        description: "Exactly 10 chapters",
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            outline: { type: Type.STRING, description: "Brief bullet points of what this chapter covers" }
          },
          required: ["title", "outline"]
        }
      }
    },
    required: ["title", "subtitle", "salesDescription", "coverVisualPrompt", "chapters"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Atue como um editor de livros best-seller. Crie um plano completo para um eBook profissional sobre o tema: "${topic}".
    O eBook deve ter exatamente 10 capítulos. O conteúdo deve ser em Português do Brasil.
    O tom deve ser autoritário, engajador e lucrativo.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.7,
    }
  });

  if (!response.text) {
    throw new Error("Falha ao gerar o plano do livro.");
  }

  return JSON.parse(response.text) as BookPlan;
};

export const generateBookCover = async (visualPrompt: string): Promise<string> => {
  const ai = getClient();
  
  // Using Pro Image Preview for high quality "Ready for Sale" aesthetics
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: `A professional, minimalistic, high-end book cover art. No text. ${visualPrompt}` }]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "1K"
      }
    }
  });

  // Iterate parts to find the image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
};

export const generateChapterContent = async (
  bookTitle: string,
  chapter: ChapterOutline,
  chapterIndex: number
): Promise<string> => {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Flash is sufficient for text generation and faster
    contents: `Você é o autor do livro "${bookTitle}".
    Escreva o conteúdo completo do Capítulo ${chapterIndex + 1}: "${chapter.title}".
    
    Contexto/Outline do capítulo: ${chapter.outline}
    
    Requisitos:
    - Escreva em Português do Brasil.
    - Use formatação Markdown (títulos, subtítulos, listas, negrito).
    - O texto deve ser profundo, educativo e prático.
    - Mínimo de 800 palavras.
    - NÃO inclua o título do capítulo no início (ele será adicionado automaticamente). Comece com uma introdução engajadora.`,
  });

  return response.text || "Erro ao gerar conteúdo.";
};