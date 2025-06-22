'use server';
/**
 * @fileOverview An AI agent that extracts questions and answers from a block of text or a file.
 *
 * - extractQuestions - A function that handles the question extraction process.
 * - ExtractQuestionsInput - The input type for the extractQuestions function.
 * - ExtractQuestionsOutput - The return type for the extractQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractQuestionsInputSchema = z.object({
  text: z.string().optional().describe('The block of text to extract questions from.'),
  fileDataUri: z.string().optional().describe("A file (image or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  language: z.enum(['ar', 'en']).describe('The language of the text (ar for Arabic, en for English).'),
});
export type ExtractQuestionsInput = z.infer<typeof ExtractQuestionsInputSchema>;

const ExtractQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The extracted question.'),
      options: z.array(z.string()).describe('A list of 4 to 5 possible answers to the question. Each string in the array must be a distinct and separate choice. Do NOT merge multiple potential answers into a single option string (e.g., "A. Paris\nB. London" is invalid).'),
      correctAnswer: z.string().describe('The single correct answer to the question. This MUST be an exact, case-sensitive match to one of the strings in the options array.'),
      explanation: z.string().describe('A detailed and academic explanation for why the answer is correct, referencing the source material.'),
    })
  ).describe('An array of all extracted questions and answers.'),
});
export type ExtractQuestionsOutput = z.infer<typeof ExtractQuestionsOutputSchema>;

export async function extractQuestions(input: ExtractQuestionsInput): Promise<ExtractQuestionsOutput> {
  return extractQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractQuestionsPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: ExtractQuestionsInputSchema},
  output: {schema: ExtractQuestionsOutputSchema},
  prompt: `You are an expert in creating high-quality, educational quizzes from text or documents. Your task is to generate questions based on the provided content.

  **CRITICAL INSTRUCTIONS:**
  1.  **Scan Thoroughly:** Scan the ENTIRE document or text provided and extract ALL possible questions.
  2.  **Strict Formatting:** For each question, you MUST adhere to the following structure:
      *   **question**: The question itself.
      *   **options**: An array of 4 to 5 distinct, separate, and concise multiple-choice options.
          *   **INVALID-Option:** "Paris and Berlin"
          *   **VALID-Option:** "Paris"
          *   **INVALID-Option:** "1. Mount Everest"
          *   **VALID-Option:** "Mount Everest"
      *   **correctAnswer**: The single correct answer. This string MUST be an EXACT, case-sensitive match to ONE of the strings in the 'options' array.
      *   **explanation**: A detailed, academic explanation for why the answer is correct.

  Language for questions: {{language}}
  
  {{#if text}}
  Content from text:
  {{{text}}}
  {{/if}}

  {{#if fileDataUri}}
  Content from file:
  {{media url=fileDataUri}}
  {{/if}}

  Format the final output as a single JSON object containing a "questions" array.
  
  **VALID RESPONSE EXAMPLE:**
  {
    "questions": [
      {
        "question": "What is the capital of France?",
        "options": ["Berlin", "Paris", "Rome", "Madrid"],
        "correctAnswer": "Paris",
        "explanation": "Paris is officially designated as the capital of France. The provided text mentions that 'The capital of France is Paris', confirming this fact."
      }
    ]
  }
  `,
});

const extractQuestionsFlow = ai.defineFlow(
  {
    name: 'extractQuestionsFlow',
    inputSchema: ExtractQuestionsInputSchema,
    outputSchema: ExtractQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
