'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import type { ExtractQuestionsInput } from '@/ai/flows/extract-questions-from-text';

type ExtractionPanelProps = {
  isPending: boolean;
  translations: Record<string, string>;
  onExtract: (input: ExtractQuestionsInput) => void;
};

export function ExtractionPanel({
  isPending,
  translations: t,
  onExtract,
}: ExtractionPanelProps) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const { toast } = useToast();

  const detectLanguage = (inputText: string) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(inputText) ? 'ar' : 'en';
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setText('');
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
          description: 'Failed to read file.',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    setFileName(null);
    setFileDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setLanguage(detectLanguage(newText));
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

    const inputPayload: ExtractQuestionsInput = { language: detectedLang };

    if (text.trim()) {
      inputPayload.text = text;
    } else if (fileDataUri) {
      inputPayload.fileDataUri = fileDataUri;
    }

    onExtract(inputPayload);
  };
  
  return (
    <Card className="shadow-sm border sticky top-6">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          {t.addNewTextCardTitle}
        </CardTitle>
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

        <Button
          onClick={handleAnalyze}
          disabled={isPending || (!text.trim() && !fileDataUri)}
          className="mt-6 w-full"
          size="lg"
        >
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
  );
}
