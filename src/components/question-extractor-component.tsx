'use client';

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Save,
  PlusCircle,
  X,
  Menu,
} from 'lucide-react';
import { SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Label } from '@/components/ui/label';

import { extractQuestionsAction } from '@/app/actions';
import type { ExtractQuestionsInput } from '@/ai/flows/extract-questions-from-text';
import {
  findNode,
  updateNodeInTree,
  deleteNodeFromTree,
  addNodeToTree,
} from '@/lib/file-tree-utils';
import type {
  Question,
  TreeNode,
  FileNode,
  FolderNode,
} from '@/lib/file-tree-utils';
import { FileExplorer } from './file-explorer';
import { QuestionTable } from './question-table';
import { ExtractionPanel } from './extraction-panel';
import { cn } from '@/lib/utils';

const translations = {
  ar: {
    title: 'مُستخرِج الأسئلة',
    description: 'حوّل نصوصك ومستنداتك إلى اختبارات تفاعلية ببضع نقرات.',
    textAreaPlaceholder: 'الصق النص هنا أو ارفع ملفًا للبدء...',
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
    unsavedQuestions: 'أسئلة غير محفوظة',
    noQuestionsYet: 'لا توجد أسئلة في هذا الملف بعد.',
    noQuestionsDescription: 'استخدم اللوحة اليمنى لإضافة أسئلة جديدة أو استخراجها من نص.',
    addNewTextCardTitle: 'إضافة أسئلة جديدة',
    uploadFileButton: 'رفع ملف (صورة أو PDF)',
    orSeparator: 'أو',
    downloadDialogTitle: 'تسمية وتصدير الملف',
    downloadDialogDescription: 'أدخل اسمًا لملفك واختر تنسيق التصدير. سيتم إضافة الامتداد تلقائيًا.',
    downloadDialogFileNameLabel: 'اسم الملف',
    downloadCsvButton: 'تنزيل كـ CSV',
    downloadJsonButton: 'تنزيل كـ JSON',
    errorEmptyFileName: 'لا يمكن أن يكون اسم الملف فارغًا.',
    addNewQuestionButton: 'إضافة سؤال جديد',
    deleteQuestionTooltip: 'حذف السؤال',
    clearAllButton: 'مسح الكل',
    clearAllDialogTitle: 'هل أنت متأكد؟',
    clearAllDialogDescription: 'سيؤدي هذا الإجراء إلى حذف جميع الأسئلة في الملف الحالي بشكل دائم.',
    clearAllDialogCancel: 'إلغاء',
    clearAllDialogConfirm: 'تأكيد الحذف',
    fileExplorer: 'مستكشف الملفات',
    newFolder: 'مجلد جديد',
    newFile: 'ملف جديد',
    rename: 'إعادة تسمية',
    delete: 'حذف',
    enterFolderName: 'أدخل اسم المجلد (مثال: كلية الطب)',
    enterFileName: 'أدخل اسم المادة (مثال: علم التشريح)',
    deleteItemConfirmTitle: 'هل أنت متأكد من الحذف؟',
    deleteItemConfirmDescription: 'سيتم حذف هذا العنصر وجميع محتوياته بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
    saveFile: 'حفظ الملف',
    unsavedChangesTitle: 'لديك تغييرات غير محفوظة',
    unsavedChangesDescription: 'هل تريد المتابعة وتجاهل التغييرات؟',
    discardChanges: 'تجاهل',
    unsavedChangesTooltip: 'توجد تغييرات غير محفوظة',
    noFileSelected: 'حدد ملفًا للبدء',
    noFileSelectedDescription: 'حدد ملفًا من القائمة أو أنشئ ملفًا جديدًا لبدء العمل.',
    fileSavedSuccess: 'تم حفظ الملف بنجاح.',
    noActiveFile: 'الرجاء تحديد ملف أولاً.',
    saveButton: 'حفظ',
    createProjectButton: 'إنشاء',
    menu: 'القائمة',
  },
  en: {
    title: 'Question Extractor',
    description: 'Turn your texts and documents into interactive quizzes with a few clicks.',
    textAreaPlaceholder: 'Paste text here or upload a file to start...',
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
    unsavedQuestions: 'Unsaved Questions',
    noQuestionsYet: 'No questions in this file yet.',
    noQuestionsDescription: 'Use the right panel to add new questions or extract them from text.',
    addNewTextCardTitle: 'Add New Questions',
    uploadFileButton: 'Upload File (Image or PDF)',
    orSeparator: 'or',
    downloadDialogTitle: 'Name & Export File',
    downloadDialogDescription: 'Enter a name for your file and choose an export format. The extension will be added automatically.',
    downloadDialogFileNameLabel: 'File Name',
    downloadCsvButton: 'Download as CSV',
    downloadJsonButton: 'Download as JSON',
    errorEmptyFileName: 'File name cannot be empty.',
    addNewQuestionButton: 'Add New Question',
    deleteQuestionTooltip: 'Delete Question',
    clearAllButton: 'Clear All',
    clearAllDialogTitle: 'Are you sure?',
    clearAllDialogDescription: 'This action will permanently delete all questions in the current file.',
    clearAllDialogCancel: 'Cancel',
    clearAllDialogConfirm: 'Confirm Delete',
    fileExplorer: 'File Explorer',
    newFolder: 'New Folder',
    newFile: 'New File',
    rename: 'Rename',
    delete: 'Delete',
    enterFolderName: 'Enter folder name (e.g., Faculty of Medicine)',
    enterFileName: 'Enter course name (e.g., Anatomy)',
    deleteItemConfirmTitle: 'Are you sure you want to delete?',
    deleteItemConfirmDescription: 'This item and all its contents will be permanently deleted. This action cannot be undone.',
    saveFile: 'Save File',
    unsavedChangesTitle: 'You have unsaved changes',
    unsavedChangesDescription: 'Are you sure you want to continue and discard them?',
    discardChanges: 'Discard',
    unsavedChangesTooltip: 'There are unsaved changes',
    noFileSelected: 'Select a file to start',
    noFileSelectedDescription: 'Select a file from the list or create a new one to get started.',
    fileSavedSuccess: 'File saved successfully.',
    noActiveFile: 'Please select a file first.',
    saveButton: 'Save',
    createProjectButton: 'Create',
    menu: 'Menu',
  },
};

export default function QuestionExtractorComponent() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [language] = useState<'ar' | 'en'>('ar');
  
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [downloadFileName, setDownloadFileName] = useState('questions');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // File System State
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Dialog states
  const [nodeToRename, setNodeToRename] = useState<TreeNode | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [nodeToDelete, setNodeToDelete] = useState<TreeNode | null>(null);
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false);
  const [nextAction, setNextAction] = useState<(() => void) | null>(null);
  const [nodeToAddTo, setNodeToAddTo] = useState<FolderNode | null>(null);
  const [newNodeInfo, setNewNodeInfo] = useState<{ type: 'file' | 'folder'; name: string } | null>(null);

  const t = translations[language];
  const { isMobile, setOpen: setOpenMobile } = useSidebar();
  const activeFile = findNode(fileTree, activeFileId) as FileNode | null;

  // Load tree from localStorage on mount
  useEffect(() => {
    try {
      const savedTreeJson = localStorage.getItem('question-extractor-file-tree');
      const savedExpandedJson = localStorage.getItem('question-extractor-expanded-folders');
      const savedActiveId = localStorage.getItem('question-extractor-active-file-id');

      if (savedTreeJson) {
        const savedTree = JSON.parse(savedTreeJson);
        setFileTree(savedTree);
        if (savedExpandedJson) setExpandedFolders(new Set(JSON.parse(savedExpandedJson)));
        if (savedActiveId) {
          const fileToLoad = findNode(savedTree, savedActiveId) as FileNode | null;
          if (fileToLoad) {
            setActiveFileId(savedActiveId);
            setQuestions(fileToLoad.questions);
          }
        }
      } else {
        const exampleTree: TreeNode[] = [
          {
            id: 'stage-1', name: 'المرحلة الجامعية', type: 'folder', children: [
              { id: 'uni-1', name: 'جامعة حلب', type: 'folder', children: [
                  { id: 'faculty-1', name: 'كلية الطب', type: 'folder', children: [
                      { id: 'dep-1', name: 'قسم الطب البشري', type: 'folder', children: [
                          { id: 'year-1', name: 'السنة الأولى', type: 'folder', children: [
                              { id: 'semester-1', name: 'الفصل الأول', type: 'folder', children: [
                                  { id: 'course-1', name: 'مادة التشريح', type: 'file', questions: [] }
                                ]}
                            ]}
                        ]}
                    ]}
                ]}
            ]}
        ];
        setFileTree(exampleTree);
        setExpandedFolders(new Set(['stage-1', 'uni-1', 'faculty-1', 'dep-1', 'year-1', 'semester-1']));
      }
    } catch (e) {
      console.error('Failed to load data from localStorage', e);
      setFileTree([]);
    }
  }, []);

  // Save tree and state to localStorage when they change
  useEffect(() => {
    localStorage.setItem('question-extractor-file-tree', JSON.stringify(fileTree));
  }, [fileTree]);

  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem('question-extractor-active-file-id', activeFileId);
    } else {
      localStorage.removeItem('question-extractor-active-file-id');
    }
  }, [activeFileId]);

  useEffect(() => {
    localStorage.setItem('question-extractor-expanded-folders', JSON.stringify(Array.from(expandedFolders)));
  }, [expandedFolders]);

  // Check for unsaved changes
  useEffect(() => {
    if (!activeFileId) {
      setIsDirty(questions.length > 0);
      return;
    }
    const savedFile = findNode(fileTree, activeFileId) as FileNode | null;
    if (!savedFile) {
      setIsDirty(questions.length > 0);
      return;
    }
    setIsDirty(JSON.stringify(savedFile.questions) !== JSON.stringify(questions));
  }, [questions, activeFileId, fileTree]);

  const handleAnalyze = (inputPayload: ExtractQuestionsInput) => {
    startTransition(async () => {
      try {
        const result = await extractQuestionsAction(inputPayload);
        setQuestions((prevQuestions) => [...prevQuestions, ...result.questions]);
        toast({ title: t.successToastTitle, description: t.successToastDescription });
      } catch (error) {
        toast({
          title: t.errorToastTitle,
          description: error instanceof Error ? error.message : t.errorToastDescription,
          variant: 'destructive',
        });
      }
    });
  };

  const executeWithUnsavedChangesCheck = useCallback((action: () => void) => {
    if (isDirty && activeFileId) {
      setNextAction(() => action);
      setIsUnsavedChangesDialogOpen(true);
    } else {
      action();
    }
  }, [isDirty, activeFileId]);

  const handleConfirmDiscardChanges = () => {
    if (nextAction) nextAction();
    setIsUnsavedChangesDialogOpen(false);
    setNextAction(null);
    setIsDirty(false);
  };

  const handleSelectFile = (fileId: string) => {
    const action = () => {
      const fileToLoad = findNode(fileTree, fileId) as FileNode | null;
      if (fileToLoad && fileToLoad.type === 'file') {
        setActiveFileId(fileId);
        setQuestions(fileToLoad.questions);
        setDownloadFileName(fileToLoad.name);
        setIsDirty(false);
        if (isMobile) setOpenMobile(false);
      }
    };
    executeWithUnsavedChangesCheck(action);
  };

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
      return newSet;
    });
  };

  const handleSaveFile = () => {
    if (!activeFileId) {
      toast({ title: t.errorToastTitle, description: t.noActiveFile, variant: 'destructive' });
      return;
    }
    setFileTree((prevTree) => updateNodeInTree(prevTree, activeFileId, { questions }));
    toast({ title: t.successToastTitle, description: t.fileSavedSuccess });
    setIsDirty(false);
  };

  const handleAddNewNode = () => {
    if (!newNodeInfo) return;
    const { type, name } = newNodeInfo;
    const parentId = nodeToAddTo?.id || null;
    if (!name.trim()) return;

    const newNode: TreeNode =
      type === 'file'
        ? { id: Date.now().toString(), name, type: 'file', questions: [] }
        : { id: Date.now().toString(), name, type: 'folder', children: [] };
    setFileTree((prevTree) => addNodeToTree(prevTree, parentId, newNode));
    if (parentId) setExpandedFolders((prev) => new Set(prev).add(parentId));
    setNodeToAddTo(null);
    setNewNodeInfo(null);
  };

  const handleRenameNode = () => {
    if (!nodeToRename || !newNodeName.trim()) return;
    setFileTree((prevTree) => updateNodeInTree(prevTree, nodeToRename.id, { name: newNodeName }));
    setNodeToRename(null);
    setNewNodeName('');
  };

  const handleDeleteNode = () => {
    if (!nodeToDelete) return;
    setFileTree((prevTree) => deleteNodeFromTree(prevTree, nodeToDelete.id));
    if (activeFileId === nodeToDelete.id) {
      setActiveFileId(null);
      setQuestions([]);
      setIsDirty(false);
    }
    setNodeToDelete(null);
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

  const handleClearAll = () => {
    setQuestions([]);
    setIsClearConfirmOpen(false);
  };

  const executeCsvDownload = (fileNameToDownload: string) => {
    const headers = [`"${t.tableHeaderQuestion}"`,'"Option A"','"Option B"','"Option C"','"Option D"','"Option E"',`"${t.tableHeaderCorrectAnswer}"`,`"${t.tableHeaderExplanation}"`].join(';');
    const cleanCsvCell = (text: string) => `"${(text || '').replace(/"/g, '""').replace(/\\r?\\n/g, ' ')}"`;
    const rows = questions.map((q) => {
      const options = [...q.options];
      while (options.length < 5) options.push('');
      return [cleanCsvCell(q.question),...options.slice(0, 5).map(cleanCsvCell),cleanCsvCell(q.correctAnswer),cleanCsvCell(q.explanation)].join(';');
    });
    const csvContent = `\uFEFF${headers}\n${rows.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${fileNameToDownload.trim()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeJsonDownload = (fileNameToDownload: string) => {
    const jsonContent = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${fileNameToDownload.trim()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDownload = (format: 'csv' | 'json') => {
    if (!downloadFileName.trim()) {
      toast({ title: t.errorToastTitle, description: t.errorEmptyFileName, variant: 'destructive' });
      return;
    }
    if (format === 'csv') executeCsvDownload(downloadFileName);
    else executeJsonDownload(downloadFileName);
    setIsDownloadDialogOpen(false);
  };

  return (
    <div className="flex flex-row-reverse min-h-screen w-full">
      {/* DIALOGS */}
      <AlertDialog open={isUnsavedChangesDialogOpen} onOpenChange={setIsUnsavedChangesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.unsavedChangesTitle}</AlertDialogTitle><AlertDialogDescription>{t.unsavedChangesDescription}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t.clearAllDialogCancel}</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDiscardChanges} variant="destructive">{t.discardChanges}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={!!nodeToRename} onOpenChange={(isOpen) => !isOpen && setNodeToRename(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.rename}</DialogTitle></DialogHeader>
          <Input value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRenameNode()} />
          <DialogFooter><Button onClick={handleRenameNode}>{t.saveButton}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!newNodeInfo} onOpenChange={(isOpen) => !isOpen && setNewNodeInfo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{newNodeInfo?.type === 'folder' ? t.newFolder : t.newFile}</DialogTitle></DialogHeader>
          <Input value={newNodeInfo?.name || ''} onChange={(e) => setNewNodeInfo((prev) => prev ? { ...prev, name: e.target.value } : null)} placeholder={newNodeInfo?.type === 'folder' ? t.enterFolderName : t.enterFileName} onKeyDown={(e) => e.key === 'Enter' && handleAddNewNode()} />
          <DialogFooter><Button onClick={handleAddNewNode}>{t.createProjectButton}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!nodeToDelete} onOpenChange={(isOpen) => !isOpen && setNodeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.deleteItemConfirmTitle}</AlertDialogTitle><AlertDialogDescription>{t.deleteItemConfirmDescription}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t.clearAllDialogCancel}</AlertDialogCancel><AlertDialogAction onClick={handleDeleteNode} variant="destructive">{t.delete}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        
      <FileExplorer
        fileTree={fileTree}
        activeFileId={activeFileId}
        expandedFolders={expandedFolders}
        translations={t}
        onNodeSelect={handleSelectFile}
        onToggleFolder={handleToggleFolder}
        onRenameNode={(node) => { setNodeToRename(node); setNewNodeName(node.name); }}
        onDeleteNode={setNodeToDelete}
        onNewFile={(parent) => { setNodeToAddTo(parent); setNewNodeInfo({ type: 'file', name: '' }); }}
        onNewFolder={(parent) => { setNodeToAddTo(parent); setNewNodeInfo({ type: 'folder', name: '' }); }}
      />

      <SidebarInset className="flex-1 min-w-0">
        <div className="flex flex-col h-full">
          <header className="flex justify-between items-center p-4 sm:p-6 border-b">
            <div className="text-right">
              <h1 className="text-2xl font-headline font-bold text-primary">{t.title}</h1>
              <p className="text-muted-foreground mt-1 text-sm">{t.description}</p>
            </div>
            <div className="md:hidden">
              <SidebarTrigger asChild>
                <Button variant="outline" size="icon"><Menu className="h-6 w-6" /><span className="sr-only">{t.menu}</span></Button>
              </SidebarTrigger>
            </div>
          </header>

          <main className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 p-4 sm:p-6 lg:p-8">
            <div className="xl:col-span-2 flex flex-col h-full">
              <Card className="shadow-sm border h-full flex flex-col">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle className="font-headline text-2xl truncate" title={activeFile?.name || (isDirty ? t.unsavedQuestions : t.extractedQuestionsTitle)}>
                      {activeFile?.name || (isDirty ? t.unsavedQuestions : t.extractedQuestionsTitle)}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button onClick={handleSaveFile} disabled={!activeFileId || !isDirty || isPending}>
                        <Save className="mr-2" />{t.saveFile}
                        {isDirty && activeFileId && (<span className="ml-2 h-2 w-2 rounded-full bg-destructive animate-pulse" title={t.unsavedChangesTooltip}></span>)}
                      </Button>
                      <Button variant="outline" onClick={handleAddQuestion} disabled={isPending || !activeFileId}>
                        <PlusCircle className="mr-2" />{t.addNewQuestionButton}
                      </Button>
                      {questions.length > 0 && (
                        <>
                          <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" disabled={isPending}><Download className="mr-2" />{t.downloadButton}</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader><DialogTitle>{t.downloadDialogTitle}</DialogTitle><DialogDescription>{t.downloadDialogDescription}</DialogDescription></DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="filename" className="text-right rtl:text-left">{t.downloadDialogFileNameLabel}</Label>
                                  <Input id="filename" value={downloadFileName} onChange={(e) => setDownloadFileName(e.target.value)} className="col-span-3" />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button onClick={() => handleConfirmDownload('csv')}>{t.downloadCsvButton}</Button>
                                <Button onClick={() => handleConfirmDownload('json')} variant="secondary">{t.downloadJsonButton}</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" disabled={isPending}><X className="mr-2" />{t.clearAllButton}</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>{t.clearAllDialogTitle}</AlertDialogTitle><AlertDialogDescription>{t.clearAllDialogDescription}</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>{t.clearAllDialogCancel}</AlertDialogCancel><AlertDialogAction onClick={handleClearAll}>{t.clearAllDialogConfirm}</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <QuestionTable 
                    questions={questions}
                    isPending={isPending}
                    translations={t}
                    activeFileId={activeFileId}
                    onQuestionsChange={setQuestions}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-1">
              <ExtractionPanel 
                isPending={isPending}
                translations={t}
                onExtract={handleAnalyze}
              />
            </div>
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
