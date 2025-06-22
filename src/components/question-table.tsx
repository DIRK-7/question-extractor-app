'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import type { Question } from '@/lib/file-tree-utils';

const AutosizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea>
>((props, ref) => {
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(ref, () => textAreaRef.current!, []);

  const { value } = props;

  React.useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [value, textAreaRef]);

  return <Textarea ref={textAreaRef} {...props} rows={1} />;
});
AutosizeTextarea.displayName = 'AutosizeTextarea';

type QuestionTableProps = {
  questions: Question[];
  isPending: boolean;
  translations: Record<string, string>;
  activeFileId: string | null;
  onQuestionsChange: (newQuestions: Question[]) => void;
};

export function QuestionTable({
  questions,
  isPending,
  translations: t,
  activeFileId,
  onQuestionsChange,
}: QuestionTableProps) {
  
  const handleQuestionFieldChange = (
    qIndex: number,
    field: 'question' | 'explanation',
    value: string
  ) => {
    const newQuestions = questions.map((q, i) =>
      i === qIndex ? { ...q, [field]: value } : q
    );
    onQuestionsChange(newQuestions);
  };

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    newText: string
  ) => {
    const newQuestions = questions.map((q, i) => {
      if (i === qIndex) {
        const oldText = q.options[oIndex];
        const newOptions = [...q.options];
        newOptions[oIndex] = newText;
        const newCorrectAnswer =
          q.correctAnswer === oldText ? newText : q.correctAnswer;
        return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
      }
      return q;
    });
    onQuestionsChange(newQuestions);
  };

  const handleCorrectAnswerChange = (qIndex: number, newCorrectAnswer: string) => {
    const newQuestions = questions.map((q, i) =>
      i === qIndex ? { ...q, correctAnswer: newCorrectAnswer } : q
    );
    onQuestionsChange(newQuestions);
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    const newQuestions = questions.filter((_, index) => index !== indexToDelete);
    onQuestionsChange(newQuestions);
  };

  if (!isPending && questions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-12 space-y-3 h-full flex flex-col justify-center items-center">
        <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h3 className="text-xl font-semibold text-foreground">
          {activeFileId ? t.noQuestionsYet : t.noFileSelected}
        </h3>
        <p className="max-w-md mx-auto">
          {activeFileId ? t.noQuestionsDescription : t.noFileSelectedDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.tableHeaderQuestion}</TableHead>
            <TableHead className="text-center" colSpan={5}>
              {t.tableHeaderOptions}
            </TableHead>
            <TableHead>{t.tableHeaderCorrectAnswer}</TableHead>
            <TableHead>{t.tableHeaderExplanation}</TableHead>
            <TableHead className="w-[50px] text-center">
              {t.tableHeaderActions}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((q, qIndex) => (
            <TableRow key={qIndex}>
              <TableCell className="font-medium align-top">
                <AutosizeTextarea
                  value={q.question}
                  onChange={(e) =>
                    handleQuestionFieldChange(qIndex, 'question', e.target.value)
                  }
                  className="w-full min-w-[200px] bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary p-1 resize-none"
                />
              </TableCell>
              {Array.from({ length: 5 }).map((_, oIndex) => {
                const optionText = q.options[oIndex] ?? '';
                const isCorrect =
                  q.correctAnswer === optionText && optionText !== '';
                return (
                  <TableCell key={oIndex} className="p-1 align-top">
                    <Label
                      htmlFor={`q${qIndex}-o${oIndex}`}
                      className={cn(
                        'flex items-start w-full h-full gap-2 p-2 rounded-md cursor-pointer transition-colors',
                        isCorrect ? 'bg-accent/20' : 'hover:bg-muted'
                      )}
                    >
                      <input
                        type="radio"
                        id={`q${qIndex}-o${oIndex}`}
                        name={`question-${qIndex}`}
                        value={optionText}
                        checked={isCorrect}
                        onChange={() => handleCorrectAnswerChange(qIndex, optionText)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          'mt-1.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all',
                          isCorrect
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        )}
                      >
                        {isCorrect && (
                          <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                        )}
                      </div>
                      <AutosizeTextarea
                        value={optionText}
                        onChange={(e) =>
                          handleOptionChange(qIndex, oIndex, e.target.value)
                        }
                        className="flex-grow min-w-[150px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary p-0 text-sm resize-none"
                      />
                    </Label>
                  </TableCell>
                );
              })}
              <TableCell className="font-semibold text-primary align-top min-w-[150px]">
                {q.correctAnswer}
              </TableCell>
              <TableCell className="align-top">
                <AutosizeTextarea
                  value={q.explanation}
                  onChange={(e) =>
                    handleQuestionFieldChange(qIndex, 'explanation', e.target.value)
                  }
                  className="w-full min-w-[250px] bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary p-1 text-sm text-muted-foreground resize-none"
                />
              </TableCell>
              <TableCell className="align-top p-2 text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteQuestion(qIndex)}
                  aria-label={t.deleteQuestionTooltip}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {isPending && (
            <TableRow>
              <TableCell colSpan={9} className="p-8 text-center">
                <div className="flex justify-center items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    {t.analyzingButton}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
