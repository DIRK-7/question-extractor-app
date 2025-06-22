'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileQuestion } from 'lucide-react';
import { extractQuestionsAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const translations = {
  ar: {
    title: 'مُستخرِج الأسئلة',
    description: 'حوّل نصوصك إلى اختبارات تفاعلية ببضع نقرات.',
    textAreaPlaceholder: 'الصق النص هنا لاستخراج الأسئلة...',
    analyzeButton: 'استخراج الأسئلة',
    analyzingButton: 'جاري الاستخراج...',
    downloadButton: 'تنزيل كملف CSV',
    tableHeaderQuestion: 'السؤال',
    tableHeaderCorrectAnswer: 'الإجابة الصحيحة',
    tableHeaderExplanation: 'التفسير',
    errorToastTitle: 'حدث خطأ',
    errorToastDescription: 'فشل استخراج الأسئلة. الرجاء المحاولة مرة أخرى.',
    errorEmptyText: 'الرجاء إدخال نص للتحليل.',
    successToastTitle: 'نجاح',
    successToastDescription: 'تمت إضافة الأسئلة الجديدة بنجاح.',
    extractedQuestionsTitle: 'بنك الأسئلة',
    noQuestionsYet: 'لم يتم استخراج أي أسئلة بعد.',
    noQuestionsDescription: 'الصق نصاً في المربع أدناه للبدء.',
    addNewTextCardTitle: 'إضافة أسئلة جديدة من نص',
  },
  en: {
    title: 'Question Extractor',
    description: 'Turn your texts into interactive quizzes with a few clicks.',
    textAreaPlaceholder: 'Paste your text here to extract questions...',
    analyzeButton: 'Extract Questions',
    analyzingButton: 'Extracting...',
    downloadButton: 'Download as CSV',
    tableHeaderQuestion: 'Question',
    tableHeaderCorrectAnswer: 'Correct Answer',
    tableHeaderExplanation: 'Explanation',
    errorToastTitle: 'Error',
    errorToastDescription: 'Failed to extract questions. Please try again.',
    errorEmptyText: 'Please enter text to analyze.',
    successToastTitle: 'Success',
    successToastDescription: 'New questions added successfully.',
    extractedQuestionsTitle: 'Question Bank',
    noQuestionsYet: 'No questions extracted yet.',
    noQuestionsDescription: 'Paste text in the box below to get started.',
    addNewTextCardTitle: 'Add New Questions from Text',
  },
};

export default function QuestionExtractor() {
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const detectLanguage = (inputText: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(inputText) ? 'ar' : 'en';
  };

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast({
        title: t.errorToastTitle,
        description: t.errorEmptyText,
        variant: 'destructive',
      });
      return;
    }

    const detectedLang = detectLanguage(text);
    setLanguage(detectedLang);

    startTransition(async () => {
      try {
        const result = await extractQuestionsAction({ text, language: detectedLang });
        setQuestions(prevQuestions => [...prevQuestions, ...result.questions]);
        setText('');
        toast({
          title: t.successToastTitle,
          description: t.successToastDescription,
        });
      } catch (error) {
        toast({
          title: t.errorToastTitle,
          description: error instanceof Error ? error.message : t.errorToastDescription,
          variant: 'destructive',
        });
      }
    });
  };

  const handleCorrectAnswerChange = (questionIndex: number, newCorrectAnswer: string) => {
    setQuestions(prevQuestions =>
      prevQuestions.map((q, i) =>
        i === questionIndex ? { ...q, correctAnswer: newCorrectAnswer } : q
      )
    );
  };
  
  const handleDownload = () => {
    const headers = [
      `"${t.tableHeaderQuestion}"`,
      '"Option A"', '"Option B"', '"Option C"', '"Option D"', '"Option E"',
      `"${t.tableHeaderCorrectAnswer}"`,
      `"${t.tableHeaderExplanation}"`
    ].join(';');

    const rows = questions.map(q => {
      const options = [...q.options];
      while (options.length < 5) {
        options.push('');
      }
      const rowData = [
        `"${q.question.replace(/"/g, '""')}"`,
        ...options.slice(0, 5).map(opt => `"${opt.replace(/"/g, '""')}"`),
        `"${q.correctAnswer.replace(/"/g, '""')}"`,
        `"${(q.explanation || '').replace(/"/g, '""')}"`
      ];
      return rowData.join(';');
    });

    const csvContent = `\uFEFF${headers}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'questions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">{t.title}</h1>
        <p className="text-muted-foreground mt-3 text-lg md:text-xl">{t.description}</p>
      </header>

      <div className="space-y-8">
        <Card className="shadow-sm border">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CardTitle className="font-headline text-2xl">{t.extractedQuestionsTitle}</CardTitle>
              {questions.length > 0 && (
                <Button onClick={handleDownload} variant="outline" disabled={isPending}>
                  <Download className="mr-2 h-4 w-4" />
                  {t.downloadButton}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <div className="overflow-x-auto">
                  <Table className="min-w-full">
                  <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">{t.tableHeaderQuestion}</TableHead>
                        <TableHead className="text-center">A</TableHead>
                        <TableHead className="text-center">B</TableHead>
                        <TableHead className="text-center">C</TableHead>
                        <TableHead className="text-center">D</TableHead>
                        <TableHead className="text-center">E</TableHead>
                        <TableHead>{t.tableHeaderCorrectAnswer}</TableHead>
                        <TableHead className="w-[30%]">{t.tableHeaderExplanation}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {questions.map((q, qIndex) => (
                      <TableRow key={qIndex}>
                          <TableCell className="font-medium align-top">{q.question}</TableCell>
                          {Array.from({ length: 5 }).map((_, oIndex) => {
                              const optionText = q.options[oIndex] || '';
                              const isCorrect = q.correctAnswer === optionText;
                              
                              return (
                                  <TableCell key={oIndex} className="p-1 align-top">
                                  {optionText && (
                                      <Label
                                        htmlFor={`q${qIndex}-o${oIndex}`}
                                        className={cn(
                                          "flex items-center w-full h-full gap-2 p-2 rounded-md cursor-pointer transition-colors",
                                          isCorrect ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
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
                                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all", isCorrect ? "border-primary bg-primary" : "border-muted-foreground")}>
                                          {isCorrect && <div className="w-2 h-2 rounded-full bg-accent-foreground"></div>}
                                        </div>
                                        <span>{optionText}</span>
                                      </Label>
                                  )}
                                  </TableCell>
                              );
                          })}
                          <TableCell className="font-semibold text-primary align-top">{q.correctAnswer}</TableCell>
                          <TableCell className="align-top">
                            <p className="text-sm text-muted-foreground">{q.explanation}</p>
                          </TableCell>
                      </TableRow>
                      ))}
                      {isPending && (
                         <TableRow>
                            <TableCell colSpan={8} className="p-8 text-center">
                              <div className="flex justify-center items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="text-muted-foreground">{t.analyzingButton}</span>
                              </div>
                            </TableCell>
                         </TableRow>
                      )}
                  </TableBody>
                  </Table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-12 space-y-3">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50"/>
                <h3 className="text-xl font-semibold text-foreground">{t.noQuestionsYet}</h3>
                <p>{isPending ? t.analyzingButton : t.noQuestionsDescription}</p>
                 {isPending && <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-4" />}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">{t.addNewTextCardTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t.textAreaPlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[180px] text-base focus-visible:ring-primary"
              dir={detectLanguage(text) === 'ar' ? 'rtl' : 'ltr'}
            />
            <Button onClick={handleAnalyze} disabled={isPending || !text.trim()} className="mt-4 w-full md:w-auto" size="lg">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.analyzingButton}
                </>
              ) : (
                t.analyzeButton
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
