import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 

// Initialize only if key is present, otherwise handled gracefully in UI
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const enhanceDescription = async (roughDraft: string): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key missing");
    return roughDraft; 
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are a professional copywriter for a freelancer's invoicing system. 
        Rewrite the following invoice line item description to be more professional, concise, and clear. 
        Keep the meaning exactly the same, just improve the tone.
        Input: "${roughDraft}"
        Output the text only, no quotes.
      `,
    });

    return response.text?.trim() || roughDraft;
  } catch (error) {
    console.error("Error enhancing description:", error);
    return roughDraft;
  }
};

export const suggestInvoiceNumber = async (lastNumber: string): Promise<string> => {
    if (!ai) return `INV-${Date.now()}`;

    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The last invoice number was "${lastNumber}". Suggest the next sequential invoice number. Return ONLY the string.`,
          });
          return response.text?.trim() || lastNumber;
    } catch (e) {
        return lastNumber;
    }
}

export const analyzeBrandColors = async (websiteUrl: string): Promise<{ color?: string, font?: 'sans' | 'serif', logo?: string, sourceUrl?: string }> => {
  if (!ai || !websiteUrl) return {};

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        I need to extract specific branding assets for the website: ${websiteUrl}.
        
        Please perform a deep search to find:
        1. **Logo**: The absolute URL of the company's logo. Look for Open Graph images (og:image), Twitter card images, or a <link rel="icon">.
        2. **Brand Color**: The primary accent color (HEX format). Look for the color of 'Sign Up' buttons, navigation bars, or links. **Ignore white (#FFFFFF) and black (#000000)**. I want the colorful brand accent.
        3. **Typography**: Whether the main headings are 'sans' (like Inter, Arial, Helvetica) or 'serif' (like Times, Georgia).

        Output a clean JSON object ONLY. No markdown formatting.
        {
          "color": "#HEXCODE",
          "logo": "https://example.com/logo.png",
          "font": "sans"
        }
      `,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || '{}';
    let data: any = {};
    
    // Robust parsing: find the first { and last } to ignore any markdown wrapper text
    try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = text.substring(jsonStart, jsonEnd + 1);
            data = JSON.parse(jsonStr);
        } else {
            data = JSON.parse(text);
        }
    } catch (e) {
        console.warn("Failed to parse JSON from Gemini", text);
    }

    const sourceUrl = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri;

    return {
      color: data.color && data.color !== '#000000' && data.color !== '#ffffff' ? data.color : undefined,
      font: (data.font === 'serif' ? 'serif' : 'sans'),
      logo: data.logo || undefined,
      sourceUrl
    };
  } catch (error) {
    console.error("Error analyzing brand:", error);
    return {};
  }
};
