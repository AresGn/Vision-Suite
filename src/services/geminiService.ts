import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_PROMPTS } from '../utils/geminiPrompts';
import type { StructuredDocument } from "../types/ocr.types";

// Use Vite's environment variable syntax for client-side access
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        documentType: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
        extractedFields: {
            type: Type.OBJECT,
            properties: {
                fullName: { type: Type.STRING, nullable: true },
                firstName: { type: Type.STRING, nullable: true },
                lastName: { type: Type.STRING, nullable: true },
                birthDate: { type: Type.STRING, nullable: true },
                birthPlace: { type: Type.STRING, nullable: true },
                nationality: { type: Type.STRING, nullable: true },
                documentNumber: { type: Type.STRING, nullable: true },
                issueDate: { type: Type.STRING, nullable: true },
                expiryDate: { type: Type.STRING, nullable: true },
                issuingAuthority: { type: Type.STRING, nullable: true },
            },
        },
        additionalInfo: {
            type: Type.OBJECT,
            properties: {
                address: { type: Type.STRING, nullable: true },
                profession: { type: Type.STRING, nullable: true },
                parentNames: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
            },
        },
        dataQuality: {
            type: Type.OBJECT,
            properties: {
                overallConfidence: { type: Type.NUMBER },
                // fieldConfidences is removed from the schema because the API does not support free-form OBJECTs.
                // The model will still generate it based on the prompt's example.
                possibleErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        correctedText: { type: Type.STRING },
    },
};


export const analyzeOcrText = async (rawText: string): Promise<StructuredDocument> => {
    try {
        const prompt = GEMINI_PROMPTS.DOCUMENT_ANALYSIS
            .replace('{rawText}', rawText)
            .replace('{documentType}', 'AUTO_DETECT');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1,
            },
        });

        const jsonText = response.text.trim();
        const parsedData: StructuredDocument = JSON.parse(jsonText);
        return parsedData;

    } catch (error) {
        console.error("Gemini API error:", error);
        if (error instanceof Error && error.message.includes('JSON')) {
             throw new Error("AI failed to generate a valid structured response. The OCR text might be too noisy.");
        }
        throw new Error("Failed to analyze text with Gemini AI.");
    }
};