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
      options: z.array(z.string()).describe('The possible answers to the question. Each string must be a distinct and separate choice.'),
      correctAnswer: z.string().describe('The correct answer to the question. This MUST exactly match one of the strings in the options array.'),
      explanation: z.string().describe('A detailed and academic explanation for why the answer is correct.'),
    })
  ).describe('The extracted questions and answers.'),
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
  prompt: `You are an expert in creating quizzes from text or documents. Your goal is to generate high-quality educational material.

  You must scan the entire document or text provided and extract ALL possible questions from it. Do not stop until you have processed the entire content.

  Given the following content, extract potential questions and answers. For each question, you must provide:
  1.  The question itself.
  2.  A list of multiple-choice options. CRITICAL: Each multiple-choice option must be a distinct, separate, and concise answer. Do NOT merge multiple potential answers into a single option string. Do not include numbering or bullet points within the option strings themselves.
  3.  The single correct answer from the options. The value for the correctAnswer key must be one of the strings in the options array.
  4.  A detailed, academic, and accurate explanation for why the answer is correct. This explanation should be comprehensive, reference the source material where applicable, and clarify any underlying concepts to enhance learning. Avoid brief or superficial explanations.

  Language: {{language}}
  
  {{#if text}}
  Content from text:
  {{{text}}}
  {{/if}}

  {{#if fileDataUri}}
  Content from file:
  {{media url=fileDataUri}}
  {{/if}}

  Format the output as a JSON object with a "questions" array. Each object in the array should have the keys "question", "options", "correctAnswer", and "explanation".
  
  Example of a valid response:
  {
    "questions": [
      {
        "question": "What is the capital of France?",
        "options": ["Berlin", "Paris", "Rome", "Madrid"],
        "correctAnswer": "Paris",
        "explanation": "Paris is officially designated as the capital of France in the French constitution. It is the country's most populous city and serves as the political, economic, and cultural center. The provided text mentions that 'The capital of France is Paris', confirming this fact."
      },
      {
        "question": "What is the highest mountain in the world?",
        "options": ["Mount Everest", "K2", "Kangchenjunga", "Lhotse"],
        "correctAnswer": "Mount Everest",
        "explanation": "Mount Everest, located in the Mahalangur Himal sub-range of the Himalayas, is Earth's highest mountain above sea level, with a peak at 8,848.86 metres (29,031.7 ft). This is a widely established geographical fact supported by numerous surveys and mentioned in the source document."
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
