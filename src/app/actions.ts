'use server';

import { extractQuestions as extractQuestionsFlow, ExtractQuestionsInput, ExtractQuestionsOutput } from '@/ai/flows/extract-questions-from-text';

export async function extractQuestionsAction(input: ExtractQuestionsInput): Promise<ExtractQuestionsOutput> {
  try {
    const result = await extractQuestionsFlow(input);
    if (!result || !result.questions) {
      throw new Error('Invalid response from AI');
    }
    // Post-processing to ensure options are clean and split correctly
    result.questions = result.questions.map(q => {
      const cleanedOptions = q.options
        .flatMap(opt => opt.split(/[\n;]|\s*\d+\.\s*/)) // Split merged options
        .map(opt => opt.trim()) // Trim whitespace
        .filter(opt => opt.length > 0); // Remove empty options

      // Ensure the correct answer is still valid after cleaning
      const newCorrectAnswer = cleanedOptions.find(opt => q.correctAnswer.includes(opt)) || cleanedOptions[0] || '';

      return {
        ...q,
        options: cleanedOptions,
        correctAnswer: newCorrectAnswer,
        explanation: q.explanation || '',
      };
    });

    return result;
  } catch (error) {
    console.error("Error in extractQuestionsAction:", error);
    // Re-throwing the error to be handled by the client
    if (error instanceof Error) {
        throw new Error(`An error occurred during question extraction: ${error.message}`);
    }
    throw new Error('An unknown error occurred during question extraction.');
  }
}
