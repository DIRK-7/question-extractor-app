'use server';

import {
  extractQuestions as extractQuestionsFlow,
  ExtractQuestionsInput,
  ExtractQuestionsOutput,
} from '@/ai/flows/extract-questions-from-text';
import type { Question } from '@/lib/file-tree-utils';

/**
 * Cleans and validates the questions returned by the AI.
 * - Ensures options are clean strings.
 * - Verifies that the correctAnswer exists in the options array.
 */
function validateAndCleanQuestions(questions: Question[]): Question[] {
  if (!questions) return [];

  return questions
    .map((q) => {
      if (!q.options || !Array.isArray(q.options) || !q.question) {
        // Filter out malformed questions
        return null;
      }

      // Clean up options: trim whitespace and remove any empty options
      const cleanedOptions = q.options
        .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
        .filter(Boolean);

      // If there are no valid options, discard the question
      if (cleanedOptions.length === 0) {
        return null;
      }

      let finalCorrectAnswer = q.correctAnswer;

      // Check if the correct answer is one of the options.
      // If not, try to find a close match or default to the first option.
      const isCorrectAnswerValid = cleanedOptions.includes(finalCorrectAnswer);

      if (!isCorrectAnswerValid) {
        // Attempt to find a substring match as a fallback
        const match = cleanedOptions.find((opt) =>
          finalCorrectAnswer?.includes(opt)
        );
        finalCorrectAnswer = match || cleanedOptions[0] || '';
      }

      return {
        question: q.question.trim(),
        options: cleanedOptions,
        correctAnswer: finalCorrectAnswer,
        explanation: (q.explanation || '').trim(),
      };
    })
    .filter((q): q is Question => q !== null);
}

export async function extractQuestionsAction(
  input: ExtractQuestionsInput
): Promise<ExtractQuestionsOutput> {
  try {
    const result = await extractQuestionsFlow(input);
    if (!result || !result.questions) {
      // Handle cases where the AI returns an empty or invalid response
      return { questions: [] };
    }

    const processedQuestions = validateAndCleanQuestions(result.questions);

    return { questions: processedQuestions };

  } catch (error) {
    console.error('Error in extractQuestionsAction:', error);
    // Re-throw a more user-friendly error message
    if (error instanceof Error) {
      throw new Error(
        `An error occurred during question extraction: ${error.message}`
      );
    }
    throw new Error('An unknown error occurred during question extraction.');
  }
}
