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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Download,
  FileQuestion,
  Upload,
  PlusCircle,
  Trash2,
  X,
  Save,
  MoreVertical,
} from 'lucide-react';
import { extractQuestionsAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import type { ExtractQuestionsInput } from '@/ai/flows/extract-questions-from-text';
import { ThemeToggle } from './theme-toggle';
import { isEqual } from 'lodash';

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type Project = {
  id: string;
  name: string;
  questions: Question[];
};

const translations = {
  ar: {
    title: 'مُستخرِج الأسئلة',
    description: 'حوّل نصوصك ومستنداتك إلى اختبارات تفاعلية ببضع نقرات.',
    textAreaPlaceholder: 'الصق النص هنا...',
    analyzeButton: 'استخراج الأسئلة',
    analyzingButton: 'جاري الاستخراج...',
    downloadButton: 'تصدير',
    tableHeaderQuestion: 'السؤال',
    tableHeaderOptions: 'الخيارات',
    tableHeaderCorrectAnswer: 'الإجابة الصحيحة',
    tableHeaderExplanation: 'التفسير',
    tableHeaderActions: 'إجراءات',
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
    downloadDialogTitle: 'تسمية وتصدير الملف',
    downloadDialogDescription:
      'أدخل اسمًا لملفك واختر تنسيق التصدير. سيتم إضافة الامتداد تلقائيًا.',
    downloadDialogFileNameLabel: 'اسم الملف',
    downloadCsvButton: 'تنزيل كـ CSV',
    downloadJsonButton: 'تنزيل كـ JSON',
    errorEmptyFileName: 'لا يمكن أن يكون اسم الملف فارغًا.',
    addNewQuestionButton: 'إضافة سؤال جديد',
    deleteQuestionTooltip: 'حذف السؤال',
    clearAllButton: 'مسح الكل',
    clearAllDialogTitle: 'هل أنت متأكد؟',
    clearAllDialogDescription:
      'سيؤدي هذا الإجراء إلى حذف جميع الأسئلة بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
    clearAllDialogCancel: 'إلغاء',
    clearAllDialogConfirm: 'تأكيد الحذف',
    projects: 'المشاريع',
    selectProject: 'اختر مشروعًا',
    noProjects: 'لا توجد مشاريع بعد',
    newProject: 'مشروع جديد',
    saveProject: 'حفظ المشروع',
    renameProject: 'إعادة تسمية المشروع',
    deleteProject: 'حذف المشروع',
    projectNameLabel: 'اسم المشروع',
    createProjectTitle: 'إنشاء مشروع جديد',
    createProjectButton: 'إنشاء',
    renameProjectTitle: 'إعادة تسمية المشروع',
    saveButton: 'حفظ',
    deleteProjectTitle: 'هل أنت متأكد من حذف المشروع؟',
    deleteProjectDescription: 'سيتم حذف هذا المشروع بشكل دائم.',
    projectSavedSuccess: 'تم حفظ المشروع بنجاح.',
    noActiveProject: 'الرجاء اختيار أو إنشاء مشروع أولاً.',
    unsavedChangesTitle: 'لديك تغييرات غير محفوظة',
    unsavedChangesDescription: 'هل تريد المتابعة وتجاهل التغييرات؟',
    discardChanges: 'تجاهل',
    unsavedChangesTooltip: 'توجد تغييرات غير محفوظة',
  },
  en: {
    title: 'Question Extractor',
    description:
      'Turn your texts and documents into interactive quizzes with a few clicks.',
    textAreaPlaceholder: 'Paste your text here...',
    analyzeButton: 'Extract Questions',
    analyzingButton: 'Extracting...',
    downloadButton: 'Export',
    tableHeaderQuestion: 'Question',
    tableHeaderOptions: 'Options',
    tableHeaderCorrectAnswer: 'Correct Answer',
    tableHeaderExplanation: 'Explanation',
    tableHeaderActions: 'Actions',
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
    downloadDialogTitle: 'Name & Export File',
    downloadDialogDescription:
      'Enter a name for your file and choose an export format. The extension will be added automatically.',
    downloadDialogFileNameLabel: 'File Name',
    downloadCsvButton: 'Download as CSV',
    downloadJsonButton: 'Download as JSON',
    errorEmptyFileName: 'File name cannot be empty.',
    addNewQuestionButton: 'Add New Question',
    deleteQuestionTooltip: 'Delete Question',
    clearAllButton: 'Clear All',
    clearAllDialogTitle: 'Are you sure?',
    clearAllDialogDescription:
      'This action will permanently delete all questions. This cannot be undone.',
    clearAllDialogCancel: 'Cancel',
    clearAllDialogConfirm: 'Confirm Delete',
    projects: 'Projects',
    selectProject: 'Select a Project',
    noProjects: 'No projects yet',
    newProject: 'New Project',
    saveProject: 'Save Project',
    renameProject: 'Rename Project',
    deleteProject: 'Delete Project',
    projectNameLabel: 'Project Name',
    createProjectTitle: 'Create New Project',
    createProjectButton: 'Create',
    renameProjectTitle: 'Rename Project',
    saveButton: 'Save',
    deleteProjectTitle: 'Are you sure you want to delete the project?',
    deleteProjectDescription: 'This will permanently delete the project.',
    projectSavedSuccess: 'Project saved successfully.',
    noActiveProject: 'Please select or create a project first.',
    unsavedChangesTitle: 'You have unsaved changes',
    unsavedChangesDescription:
      'Are you sure you want to continue and discard them?',
    discardChanges: 'Discard',
    unsavedChangesTooltip: 'There are unsaved changes',
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
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadFileName, setDownloadFileName] = useState('questions');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // Dialog states
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameProjectName, setRenameProjectName] = useState('');
  const [isDeleteProjectConfirmOpen, setIsDeleteProjectConfirmOpen] = useState(false);
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false);
  const [nextAction, setNextAction] = useState<(() => void) | null>(null);


  const t = translations[language];
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('question-extractor-projects');
      if (savedProjects) {
        const parsedProjects: Project[] = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        const lastActiveId = localStorage.getItem('question-extractor-active-project-id');
        if (lastActiveId && parsedProjects.some(p => p.id === lastActiveId)) {
          const projectToLoad = parsedProjects.find(p => p.id === lastActiveId);
          if (projectToLoad) {
            setActiveProjectId(lastActiveId);
            setQuestions(projectToLoad.questions);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage', e);
    }
  }, []);

  // Save projects to localStorage when they change
  useEffect(() => {
    localStorage.setItem('question-extractor-projects', JSON.stringify(projects));
  }, [projects]);

  // Save active project ID to localStorage
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('question-extractor-active-project-id', activeProjectId);
    } else {
      localStorage.removeItem('question-extractor-active-project-id');
    }
  }, [activeProjectId]);

  // Check for unsaved changes
  useEffect(() => {
    if (!activeProject) {
      setIsDirty(questions.length > 0);
      return;
    }
    const savedQuestions = activeProject.questions;
    // Use a deep comparison to check for changes
    if (JSON.stringify(savedQuestions) !== JSON.stringify(questions)) {
        setIsDirty(true);
    } else {
        setIsDirty(false);
    }
  }, [questions, activeProject]);


  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

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
          description: 'Failed to read file.',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setFileName(null);
    setFileDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        setQuestions((prevQuestions) => [
          ...prevQuestions,
          ...result.questions,
        ]);

        // Reset inputs
        setText('');
        setFileDataUri(null);
        setFileName(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast({
          title: t.successToastTitle,
          description: t.successToastDescription,
        });
      } catch (error) {
        toast({
          title: t.errorToastTitle,
          description:
            error instanceof Error ? error.message : t.errorToastDescription,
          variant: 'destructive',
        });
      }
    });
  };

  const executeWithUnsavedChangesCheck = (action: () => void) => {
    if (isDirty) {
      setNextAction(() => action);
      setIsUnsavedChangesDialogOpen(true);
    } else {
      action();
    }
  };
  
  const handleConfirmDiscardChanges = () => {
    if (nextAction) {
      nextAction();
    }
    setIsUnsavedChangesDialogOpen(false);
    setNextAction(null);
    setIsDirty(false);
  };
  
  const handleSelectProject = (projectId: string) => {
    const projectToLoad = projects.find((p) => p.id === projectId);
    if (projectToLoad) {
      setActiveProjectId(projectId);
      setQuestions(projectToLoad.questions);
      setIsDirty(false);
    }
  };

  const handleCreateNewProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      questions: [],
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setQuestions([]);
    setIsNewProjectDialogOpen(false);
    setNewProjectName('');
    setIsDirty(false);
  };

  const handleSaveProject = () => {
    if (!activeProjectId) {
      toast({ title: t.errorToastTitle, description: t.noActiveProject, variant: 'destructive' });
      return;
    }
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === activeProjectId ? { ...p, questions: questions } : p
      )
    );
    toast({ title: t.successToastTitle, description: t.projectSavedSuccess });
    setIsDirty(false);
  };

  const handleRenameProject = () => {
    if (!activeProjectId || !renameProjectName.trim()) return;
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === activeProjectId ? { ...p, name: renameProjectName } : p
      )
    );
    setIsRenameDialogOpen(false);
    setRenameProjectName('');
  };
  
  const handleDeleteProject = () => {
    if (!activeProjectId) return;
    setProjects(prevProjects => prevProjects.filter(p => p.id !== activeProjectId));
    if (activeProjectId === activeProjectId) {
      setActiveProjectId(null);
      setQuestions([]);
    }
    setIsDeleteProjectConfirmOpen(false);
    setIsDirty(false);
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      question: '',
      options: ['', '', '', '', ''],
      correctAnswer: '',
      explanation: '',
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setQuestions((prev) => prev.filter((_, index) => index !== indexToDelete));
  };

  const handleClearAll = () => {
    setQuestions([]);
    setIsClearConfirmOpen(false);
  };

  const handleCorrectAnswerChange = (
    questionIndex: number,
    newCorrectAnswer: string
  ) => {
    setQuestions((prevQuestions) =>
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

  const executeCsvDownload = (fileNameToDownload: string) => {
    const headers = [
      `"${t.tableHeaderQuestion}"`,
      '"Option A"',
      '"Option B"',
      '"Option C"',
      '"Option D"',
      '"Option E"',
      `"${t.tableHeaderCorrectAnswer}"`,
      `"${t.tableHeaderExplanation}"`,
    ].join(';');

    const cleanCsvCell = (text: string): string => {
      const cleanedText = (text || '')
        .replace(/"/g, '""')
        .replace(/\r?\n/g, ' ');
      return `"${cleanedText}"`;
    };

    const rows = questions.map((q) => {
      const options = [...q.options];
      while (options.length < 5) {
        options.push('');
      }
      const rowData = [
        cleanCsvCell(q.question),
        ...options.slice(0, 5).map((opt) => cleanCsvCell(opt)),
        cleanCsvCell(q.correctAnswer),
        cleanCsvCell(q.explanation),
      ];
      return rowData.join(';');
    });

    const csvContent = `\uFEFF${headers}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileNameToDownload.trim()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const executeJsonDownload = (fileNameToDownload: string) => {
    const jsonContent = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileNameToDownload.trim()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDownload = (format: 'csv' | 'json') => {
    if (!downloadFileName.trim()) {
      toast({
        title: t.errorToastTitle,
        description: t.errorEmptyFileName,
        variant: 'destructive',
      });
      return;
    }
    if (format === 'csv') {
      executeCsvDownload(downloadFileName);
    } else {
      executeJsonDownload(downloadFileName)
    }
    setIsDownloadDialogOpen(false); // Close the dialog
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Unsaved Changes Dialog */}
      <AlertDialog open={isUnsavedChangesDialogOpen} onOpenChange={setIsUnsavedChangesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.unsavedChangesTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.unsavedChangesDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.clearAllDialogCancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscardChanges} variant="destructive">
              {t.discardChanges}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
          {t.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg md:text-xl">
          {t.description}
        </p>
      </header>

      {/* Project Management Bar */}
      <Card className="mb-8 shadow-sm border">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <Label className="font-bold text-lg">{t.projects}:</Label>
          <div className="flex-grow min-w-[200px]">
            <Select
              value={activeProjectId || ''}
              onValueChange={(value) => executeWithUnsavedChangesCheck(() => handleSelectProject(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.selectProject} />
              </SelectTrigger>
              <SelectContent>
                {projects.length > 0 ? projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                )) : <div className="p-2 text-sm text-muted-foreground">{t.noProjects}</div>}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => executeWithUnsavedChangesCheck(() => setIsNewProjectDialogOpen(true))}>
                {t.newProject}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.createProjectTitle}</DialogTitle>
              </DialogHeader>
              <Input
                placeholder={t.projectNameLabel}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewProject()}
              />
              <DialogFooter>
                <Button onClick={handleCreateNewProject}>{t.createProjectButton}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSaveProject} disabled={!activeProjectId || !isDirty || isPending}>
            <Save className="mr-2 h-4 w-4" />
            {t.saveProject}
            {isDirty && activeProjectId && <span className="ml-2 h-2 w-2 rounded-full bg-destructive animate-pulse" title={t.unsavedChangesTooltip}></span>}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!activeProjectId}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={() => {
                  setRenameProjectName(activeProject?.name || '');
                  setIsRenameDialogOpen(true);
                }}
              >
                {t.renameProject}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setIsDeleteProjectConfirmOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                {t.deleteProject}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Rename Project Dialog */}
          <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t.renameProjectTitle}</DialogTitle></DialogHeader>
              <Input value={renameProjectName} onChange={e => setRenameProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameProject()} />
              <DialogFooter><Button onClick={handleRenameProject}>{t.saveButton}</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Project Alert */}
          <AlertDialog open={isDeleteProjectConfirmOpen} onOpenChange={setIsDeleteProjectConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteProjectTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t.deleteProjectDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.clearAllDialogCancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject} variant="destructive">{t.deleteProject}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-sm border h-full">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="font-headline text-2xl">
                  {activeProject ? activeProject.name : t.extractedQuestionsTitle}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleAddQuestion}
                    disabled={isPending}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t.addNewQuestionButton}
                  </Button>
                  {questions.length > 0 && (
                    <>
                      <Dialog
                        open={isDownloadDialogOpen}
                        onOpenChange={setIsDownloadDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" disabled={isPending}>
                            <Download className="mr-2 h-4 w-4" />
                            {t.downloadButton}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>{t.downloadDialogTitle}</DialogTitle>
                            <DialogDescription>
                              {t.downloadDialogDescription}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="filename"
                                className="text-right rtl:text-left"
                              >
                                {t.downloadDialogFileNameLabel}
                              </Label>
                              <Input
                                id="filename"
                                value={downloadFileName}
                                onChange={(e) =>
                                  setDownloadFileName(e.target.value)
                                }
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleConfirmDownload('csv')}>
                              {t.downloadCsvButton}
                            </Button>
                             <Button onClick={() => handleConfirmDownload('json')} variant="secondary">
                              {t.downloadJsonButton}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog
                        open={isClearConfirmOpen}
                        onOpenChange={setIsClearConfirmOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" disabled={isPending}>
                            <X className="mr-2 h-4 w-4" />
                            {t.clearAllButton}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t.clearAllDialogTitle}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.clearAllDialogDescription}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t.clearAllDialogCancel}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearAll}>
                              {t.clearAllDialogConfirm}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                  <ThemeToggle />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length > 0 || isPending ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.tableHeaderQuestion}</TableHead>
                        <TableHead className="text-center" colSpan={5}>
                          {t.tableHeaderOptions}
                        </TableHead>
                        <TableHead>{t.tableHeaderCorrectAnswer}</TableHead>
                        <TableHead>{t.tableHeaderExplanation}</TableHead>
                        <TableHead className="w-[50px] text-center">{t.tableHeaderActions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((q, qIndex) => (
                        <TableRow key={qIndex}>
                          <TableCell className="font-medium align-top">
                            <Textarea
                              value={q.question}
                              onChange={(e) =>
                                handleQuestionFieldChange(
                                  qIndex,
                                  'question',
                                  e.target.value
                                )
                              }
                              rows={2}
                              className="w-full min-w-[200px] bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary p-1 resize-none"
                            />
                          </TableCell>
                          {Array.from({ length: 5 }).map((_, oIndex) => {
                            const optionText = q.options[oIndex] ?? '';
                            const isCorrect = q.correctAnswer === optionText && optionText !== '';

                            return (
                              <TableCell key={oIndex} className="p-1 align-top">
                                  <Label
                                    htmlFor={`q${qIndex}-o${oIndex}`}
                                    className={cn(
                                      'flex items-start w-full h-full gap-2 p-2 rounded-md cursor-pointer transition-colors',
                                      isCorrect
                                        ? 'bg-accent/80'
                                        : 'hover:bg-muted'
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      id={`q${qIndex}-o${oIndex}`}
                                      name={`question-${qIndex}`}
                                      value={optionText}
                                      checked={isCorrect}
                                      onChange={() =>
                                        handleCorrectAnswerChange(
                                          qIndex,
                                          optionText
                                        )
                                      }
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
                                        <div className="w-2 h-2 rounded-full bg-accent-foreground"></div>
                                      )}
                                    </div>
                                    <Textarea
                                      value={optionText}
                                      onChange={(e) =>
                                        handleOptionChange(
                                          qIndex,
                                          oIndex,
                                          e.target.value
                                        )
                                      }
                                      className="flex-grow min-w-[150px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary p-0 text-sm resize-none"
                                      rows={2}
                                    />
                                  </Label>
                              </TableCell>
                            );
                          })}
                          <TableCell className="font-semibold text-primary align-top min-w-[150px]">
                            {q.correctAnswer}
                          </TableCell>
                          <TableCell className="align-top">
                            <Textarea
                              value={q.explanation}
                              onChange={(e) =>
                                handleQuestionFieldChange(
                                  qIndex,
                                  'explanation',
                                  e.target.value
                                )
                              }
                              rows={2}
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
              ) : (
                <div className="text-center text-muted-foreground p-12 space-y-3">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="text-xl font-semibold text-foreground">
                    {t.noQuestionsYet}
                  </h3>
                  <p>{t.noQuestionsDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-sm border">
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
        </div>
      </div>
    </div>
  );
}
