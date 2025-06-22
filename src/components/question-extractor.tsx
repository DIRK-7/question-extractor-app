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
import { Loader2, Download } from 'lucide-react';
import { extractQuestionsAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

const translations = {
  ar: {
    title: 'مُستخرِج الأسئلة',
    description: 'أتمتة عملية إنشاء بنوك الأسئلة متعددة الخيارات من النصوص.',
    textAreaPlaceholder: 'الصق النص هنا...',
    analyzeButton: 'تحليل النص واستخراج الأسئلة',
    analyzingButton: 'جاري التحليل...',
    downloadButton: 'تنزيل كملف Excel',
    tableHeaderQuestion: 'السؤال',
    tableHeaderCorrectAnswer: 'الإجابة الصحيحة',
    errorToastTitle: 'خطأ',
    errorToastDescription: 'حدث خطأ أثناء استخراج الأسئلة.',
    errorEmptyText: 'الرجاء إدخال نص للتحليل.',
    successToastTitle: 'نجاح',
    successToastDescription: 'تم استخراج الأسئلة بنجاح.',
  },
  en: {
    title: 'Question Extractor',
    description: 'Automate creating multiple-choice question banks from text.',
    textAreaPlaceholder: 'Paste your text here...',
    analyzeButton: 'Analyze Text and Extract Questions',
    analyzingButton: 'Analyzing...',
    downloadButton: 'Download as Excel File',
    tableHeaderQuestion: 'Question',
    tableHeaderCorrectAnswer: 'Correct Answer',
    errorToastTitle: 'Error',
    errorToastDescription: 'An error occurred while extracting questions.',
    errorEmptyText: 'Please enter text to analyze.',
    successToastTitle: 'Success',
    successToastDescription: 'Questions extracted successfully.',
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
        setQuestions(result.questions);
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
        setQuestions([]);
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
      t.tableHeaderQuestion,
      'A', 'B', 'C', 'D', 'E',
      t.tableHeaderCorrectAnswer
    ].join(';');

    const rows = questions.map(q => {
      const options = [...q.options];
      while (options.length < 5) {
        options.push('');
      }
      const rowData = [
        `"${q.question.replace(/"/g, '""')}"`,
        ...options.slice(0, 5).map(opt => `"${opt.replace(/"/g, '""')}"`),
        `"${q.correctAnswer.replace(/"/g, '""')}"`
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
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">{t.title}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t.description}</p>
      </header>

      <Card className="mb-8 shadow-lg">
        <CardContent className="p-6">
          <Textarea
            placeholder={t.textAreaPlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] text-base"
            dir={detectLanguage(text) === 'ar' ? 'rtl' : 'ltr'}
          />
          <Button onClick={handleAnalyze} disabled={isPending} className="mt-4 w-full md:w-auto">
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

      {questions.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CardTitle className="font-headline">{t.title}</CardTitle>
              <Button onClick={handleDownload} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t.downloadButton}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="min-w-[250px]">{t.tableHeaderQuestion}</TableHead>
                    <TableHead>A</TableHead>
                    <TableHead>B</TableHead>
                    <TableHead>C</TableHead>
                    <TableHead>D</TableHead>
                    <TableHead>E</TableHead>
                    <TableHead>{t.tableHeaderCorrectAnswer}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {questions.map((q, qIndex) => (
                    <TableRow key={qIndex}>
                        <TableCell className="font-medium">{q.question}</TableCell>
                        {Array.from({ length: 5 }).map((_, oIndex) => {
                            const optionText = q.options[oIndex] || '';
                            const isCorrect = q.correctAnswer === optionText;
                            
                            return (
                                <TableCell key={oIndex}>
                                {optionText && (
                                    <div
                                        onClick={() => handleCorrectAnswerChange(qIndex, optionText)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                                            isCorrect ? 'bg-accent' : 'hover:bg-muted'
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            id={`q${qIndex}-o${oIndex}`}
                                            name={`question-${qIndex}`}
                                            value={optionText}
                                            checked={isCorrect}
                                            onChange={() => {}}
                                            className="form-radio h-4 w-4 accent-primary"
                                        />
                                        <Label htmlFor={`q${qIndex}-o${oIndex}`} className="cursor-pointer">
                                            {optionText}
                                        </Label>
                                    </div>
                                )}
                                </TableCell>
                            );
                        })}
                        <TableCell className="font-semibold text-primary">{q.correctAnswer}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
