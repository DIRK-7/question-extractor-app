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
      options: z.array(z.string()).describe('The possible answers to the question.'),
      correctAnswer: z.string().describe('The correct answer to the question.'),
      explanation: z.string().describe('The explanation for why the answer is correct.'),
    })
  ).describe('The extracted questions and answers.'),
});
export type ExtractQuestionsOutput = z.infer<typeof ExtractQuestionsOutputSchema>;

export async function extractQuestions(input: ExtractQuestionsInput): Promise<ExtractQuestionsOutput> {
  return extractQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractQuestionsPrompt',
  input: {schema: ExtractQuestionsInputSchema},
  output: {schema: ExtractQuestionsOutputSchema},
  prompt: `You are an expert in creating quizzes from text or documents.

  Given the following content, extract potential questions and answers, along with the correct answer and a brief explanation for each question. The questions should be relevant to the content of the document, and the answers should be accurate and clear.

  Language: {{language}}
  
  {{#if text}}
  Content from text:
  {{{text}}}
  {{/if}}

  {{#if fileDataUri}}
  Content from file:
  {{media url=fileDataUri}}
  {{/if}}

  Format the output as a JSON object with a "questions" array. Each object in the array should have the keys "question", "options", "correctAnswer", and "explanation". The options array should contain strings.
  The value for the correctAnswer key should be one of the strings in the options array.
  Example:
  {
    "questions": [
      {
        "question": "What is the capital of France?",
        "options": ["Berlin", "Paris", "Rome", "Madrid"],
        "correctAnswer": "Paris",
        "explanation": "Paris is the capital and most populous city of France."
      },
      {
        "question": "What is the highest mountain in the world?",
        "options": ["Mount Everest", "K2", "Kangchenjunga", "Lhotse"],
        "correctAnswer": "Mount Everest",
        "explanation": "Mount Everest is Earth's highest mountain above sea level, located in the Mahalangur Himal sub-range of the Himalayas."
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
