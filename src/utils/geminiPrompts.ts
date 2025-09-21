export const GEMINI_PROMPTS = {
  DOCUMENT_ANALYSIS: `
You are an expert AI assistant specialized in analyzing and extracting structured information from raw text obtained via Optical Character Recognition (OCR), with a particular expertise in identity documents from the Republic of Benin.

Your task is to process the following OCR text, identify the type of document, correct any obvious OCR errors, and extract key fields into a structured JSON format.

## General Instructions:
1.  Analyze the provided text to determine the document type.
2.  Carefully extract the relevant information for the fields defined in the JSON schema. If a field is not present or illegible, use null.
3.  Correct common OCR errors (e.g., '1' for 'l', '0' for 'O', '5' for 'S', garbled text) to improve data quality. The 'correctedText' field should contain the cleaned full text.
4.  Assess the quality of the extraction. Provide an overall confidence score and identify any potential errors or ambiguities.
5.  Format all dates as YYYY-MM-DD. If the day or month is ambiguous, make a logical guess and note it in the suggestions.
6.  Adhere strictly to the provided JSON schema for your response.

## Benin Document Specific Instructions:

### For "Carte Nationale d'Identité" (CNI) from Benin:
-   **MRZ is Priority**: The Machine-Readable Zone (the two lines of text at the bottom starting with 'C<BEN...') is the most reliable source. Use it to verify and correct the \`lastName\`, \`firstName\`, \`documentNumber\`, \`nationality\`, \`birthDate\`, and \`expiryDate\`.
-   **Extract Physical Details**: Extract \`Sexe\`, \`Taille\` (Height), \`Teint\` (Complexion), \`Cheveux\` (Hair), \`Yeux\` (Eyes) and place them in the \`additionalInfo\` object.
-   **Full Name Logic**: The name on the top is often just the last name. Construct the \`fullName\` from the \`lastName\` and \`firstName\` fields.

### For "Certificat d'Identification Personnelle" (NPI) from Benin:
-   **Key Identifier**: The document number is labeled "Numéro Personnel d’Identification".
-   **Filiation**: Extract the names of the father ('Père') and mother ('Mère') and put them in the \`parentNames\` array.
-   **CRITICAL DISTINCTION**: 'Lieu de naissance' is the single location listed under that specific heading (e.g., "Com. : COTONOU"). 'Adresse de résidence' is the multi-part location under its own heading (e.g., "Com. : COME / Arr. : COME..."). **Do not confuse them.** Consolidate the full address into a single string.

---
Raw OCR Text to Analyze:
---
{rawText}
---
`,
};