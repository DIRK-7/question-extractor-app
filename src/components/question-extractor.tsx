'use client';

import { useState, useTransition, useEffect, useRef, ChangeEvent } from 'react';
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
import { Loader2, Download, FileQuestion, Upload } from 'lucide-react';
import { extractQuestionsAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import type { ExtractQuestionsInput } from '@/ai/flows/extract-questions-from-text';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

const translations = {
  ar: {
    title: 'مُستخرِج الأسئلة',
    description: 'حوّل نصوصك ومستنداتك إلى اختبارات تفاعلية ببضع نقرات.',
    textAreaPlaceholder: 'الصق النص هنا...',
    analyzeButton: 'استخراج الأسئلة',
    analyzingButton: 'جاري الاستخراج...',
    downloadButton: 'تنزيل كملف CSV',
    tableHeaderQuestion: 'السؤال',
    tableHeaderOptions: 'الخيارات',
    tableHeaderCorrectAnswer: 'الإجابة الصحيحة',
    tableHeaderExplanation: 'التفسير',
    errorToastTitle: 'حدث خطأ',
    errorToastDescription: 'فشل استخراج الأسئلة. الرجاء المحاولة مرة أخرى.',
    errorEmptyText: 'الرجاء إدخال نص أو رفع ملف للتحليل.',
    successToastTitle: 'نجاح',
    successToastDescription: 'تمت إضافة الأسئلة الجديدة بنجاح.',
    extractedQuestionsTitle: 'بنك الأسئلة',
    noQuestionsYet: 'لم يتم استخراج أي أسئلة بعد.',
    noQuestionsDescription: 'ابدأ بلصق نص أو رفع ملف.',
    addNewTextCardTitle: 'إضافة أسئلة جديدة',
    uploadFileButton: 'رفع ملف (صورة أو PDF)',
    orSeparator: 'أو',
  },
  en: {
    title: 'Question Extractor',
    description: 'Turn your texts and documents into interactive quizzes with a few clicks.',
    textAreaPlaceholder: 'Paste your text here...',
    analyzeButton: 'Extract Questions',
    analyzingButton: 'Extracting...',
    downloadButton: 'Download as CSV',
    tableHeaderQuestion: 'Question',
    tableHeaderOptions: 'Options',
    tableHeaderCorrectAnswer: 'Correct Answer',
    tableHeaderExplanation: 'Explanation',
    errorToastTitle: 'Error',
    errorToastDescription: 'Failed to extract questions. Please try again.',
    errorEmptyText: 'Please enter text or upload a file to analyze.',
    successToastTitle: 'Success',
    successToastDescription: 'New questions added successfully.',
    extractedQuestionsTitle: 'Question Bank',
    noQuestionsYet: 'No questions extracted yet.',
    noQuestionsDescription: 'Get started by pasting text or uploading a file.',
    addNewTextCardTitle: 'Add New Questions',
    uploadFileButton: 'Upload File (Image or PDF)',
    orSeparator: 'or',
  },
};

export default function QuestionExtractor() {
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);

  const t = translations[language];

  const resizeTextarea = (element: HTMLTextAreaElement) => {
    if (element) {
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    // This will run after the component has rendered with new questions
    // to ensure all textareas are resized correctly.
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('textarea[data-autoresize="true"]');
    textareas.forEach(resizeTextarea);
  }, [questions]);

  const detectLanguage = (inputText: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(inputText) ? 'ar' : 'en';
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setText(''); // Clear text input
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result;
        if (typeof result === 'string') {
          setFileDataUri(result);
        }
      };
      reader.onerror = () => {
        toast({
            title: t.errorToastTitle,
            description: "Failed to read file.",
            variant: 'destructive',
          });
      }
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setFileName(null);
    setFileDataUri(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };


  const handleAnalyze = () => {
    if (!text.trim() && !fileDataUri) {
      toast({
        title: t.errorToastTitle,
        description: t.errorEmptyText,
        variant: 'destructive',
      });
      return;
    }

    const detectedLang = text ? detectLanguage(text) : language;
    setLanguage(detectedLang);

    startTransition(async () => {
      try {
        const inputPayload: ExtractQuestionsInput = { language: detectedLang };

        if (text.trim()) {
          inputPayload.text = text;
        } else if (fileDataUri) {
          inputPayload.fileDataUri = fileDataUri;
        }
        
        const result = await extractQuestionsAction(inputPayload);
        setQuestions(prevQuestions => [...prevQuestions, ...result.questions]);
        
        // Reset inputs
        setText('');
        setFileDataUri(null);
        setFileName(null);
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }

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
  
  const handleQuestionFieldChange = (
    questionIndex: number,
    field: 'question' | 'explanation',
    value: string
  ) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) =>
        i === questionIndex ? { ...q, [field]: value } : q
      )
    );
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    newText: string
  ) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => {
        if (i === questionIndex) {
          const oldText = q.options[optionIndex];
          const newOptions = [...q.options];
          newOptions[optionIndex] = newText;

          const newCorrectAnswer =
            q.correctAnswer === oldText ? newText : q.correctAnswer;

          return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
        }
        return q;
      })
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
        ...options.slice(0, 5).map(opt => `"${(opt || '').replace(/"/g, '""')}"`),
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card className="shadow-sm border h-full">
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
                {questions.length > 0 || isPending ? (
                <div className="overflow-x-auto">
                    <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[25%]">{t.tableHeaderQuestion}</TableHead>
                            <TableHead className="w-[50%] text-center" colSpan={5}>{t.tableHeaderOptions}</TableHead>
                            <TableHead>{t.tableHeaderCorrectAnswer}</TableHead>
                            <TableHead className="w-[25%]">{t.tableHeaderExplanation}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions.map((q, qIndex) => (
                        <TableRow key={qIndex}>
                            <TableCell className="font-medium align-top">
                                <Textarea
                                    data-autoresize="true"
                                    value={q.question}
                                    onChange={(e) => handleQuestionFieldChange(qIndex, 'question', e.target.value)}
                                    onInput={(e) => resizeTextarea(e.target as HTMLTextAreaElement)}
                                    rows={1}
                                    className="w-full bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary p-1 resize-none"
                                />
                            </TableCell>
                            {Array.from({ length: 5 }).map((_, oIndex) => {
                                const optionText = q.options[oIndex];
                                const isCorrect = q.correctAnswer === optionText;
                                
                                return (
                                    <TableCell key={oIndex} className="p-1 align-top">
                                    {optionText !== undefined ? (
                                        <Label
                                            htmlFor={`q${qIndex}-o${oIndex}`}
                                            className={cn(
                                            "flex items-start w-full h-full gap-2 p-2 rounded-md cursor-pointer transition-colors",
                                            isCorrect ? 'bg-accent/80' : 'hover:bg-muted'
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
                                            <div className={cn("mt-1.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all", isCorrect ? "border-primary bg-primary" : "border-muted-foreground")}>
                                                {isCorrect && <div className="w-2 h-2 rounded-full bg-accent-foreground"></div>}
                                            </div>
                                            <Textarea
                                                data-autoresize="true"
                                                value={optionText}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                onInput={(e) => resizeTextarea(e.target as HTMLTextAreaElement)}
                                                className="flex-grow bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary p-0 text-sm resize-none"
                                                rows={1}
                                            />
                                        </Label>
                                    ) : <div className="w-full h-full p-2">&nbsp;</div>}
                                    </TableCell>
                                );
                            })}
                            <TableCell className="font-semibold text-primary align-top">{q.correctAnswer}</TableCell>
                            <TableCell className="align-top">
                                <Textarea
                                    data-autoresize="true"
                                    value={q.explanation}
                                    onChange={(e) => handleQuestionFieldChange(qIndex, 'explanation', e.target.value)}
                                    onInput={(e) => resizeTextarea(e.target as HTMLTextAreaElement)}
                                    rows={1}
                                    className="w-full bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary p-1 text-sm text-muted-foreground resize-none"
                                />
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
                    <p>{t.noQuestionsDescription}</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
        
        <div className="lg:col-span-1">
            <Card className="shadow-sm border">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{t.addNewTextCardTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                placeholder={t.textAreaPlaceholder}
                value={text}
                onChange={handleTextChange}
                className="min-h-[150px] text-base focus-visible:ring-primary"
                dir={detectLanguage(text) === 'ar' ? 'rtl' : 'ltr'}
                />

                <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <span className="relative bg-card px-2 text-sm text-muted-foreground">
                        {t.orSeparator}
                    </span>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="application/pdf,image/png,image/jpeg"
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={isPending}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {fileName || t.uploadFileButton}
                </Button>

                <Button onClick={handleAnalyze} disabled={isPending || (!text.trim() && !fileDataUri)} className="mt-6 w-full" size="lg">
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
    </div>
  );
}
