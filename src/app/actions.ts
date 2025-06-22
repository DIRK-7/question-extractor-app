'use server';

import {
  extractQuestions as extractQuestionsFlow,
  ExtractQuestionsInput,
  ExtractQuestionsOutput,
} from '@/ai/flows/extract-questions-from-text';
import { correctMergedOptions } from '@/ai/flows/correct-merged-options';

export async function extractQuestionsAction(
  input: ExtractQuestionsInput
): Promise<ExtractQuestionsOutput> {
  try {
    const result = await extractQuestionsFlow(input);
    if (!result || !result.questions) {
      throw new Error('Invalid response from AI');
    }

    // Post-processing to fix potentially merged options and clean up data.
    const processedQuestions = await Promise.all(
      result.questions.map(async (q) => {
        // Heuristic to detect if options might be merged.
        // A simple check for newlines or multiple sentences is a strong indicator.
        const needsCorrection = q.options.some((opt) => opt.includes('\n') || opt.split('. ').length > 2);
        
        let currentQuestion = { ...q };

        if (needsCorrection && q.options.length < 5) {
          try {
            // If options seem merged, ask the AI to correct them.
            const corrected = await correctMergedOptions({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
            });

            // Ensure the corrected answer is one of the new options.
            const finalAnswer = corrected.correctedOptions.includes(corrected.correctedAnswer)
              ? corrected.correctedAnswer
              : corrected.correctedOptions[0] || '';


            currentQuestion = {
              ...q,
              question: corrected.correctedQuestion,
              options: corrected.correctedOptions,
              correctAnswer: finalAnswer,
            };
          } catch (e) {
            console.error('AI correction failed, falling back to basic cleaning', e);
            // Fallback to the original logic if correction flow fails.
            const cleanedOptions = q.options
              .flatMap((opt) => opt.split(/[\n;]|\s*\d+\.\s*/))
              .map((opt) => opt.trim())
              .filter((opt) => opt.length > 0);
            
            const newCorrectAnswer = cleanedOptions.find((opt) => q.correctAnswer.includes(opt)) || cleanedOptions[0] || '';
            
            currentQuestion = { ...q, options: cleanedOptions, correctAnswer: newCorrectAnswer };
          }
        }
        
        // Ensure explanation is not null/undefined and options are clean
        return {
          ...currentQuestion,
          options: currentQuestion.options.map(opt => opt.trim()).filter(opt => opt),
          explanation: currentQuestion.explanation || '',
        };
      })
    );

    return { questions: processedQuestions };

  } catch (error) {
    console.error('Error in extractQuestionsAction:', error);
    if (error instanceof Error) {
      throw new Error(
        `An error occurred during question extraction: ${error.message}`
      );
    }
    throw new Error('An unknown error occurred during question extraction.');
  }
}
