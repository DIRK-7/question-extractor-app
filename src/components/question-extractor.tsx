'use client';

import React, { useState, useTransition, useEffect, useRef, ChangeEvent } from 'react';
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
  DropdownMenuSeparator,
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
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  FilePlus,
  ChevronRight,
  Menu,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

import { extractQuestionsAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';
import type { ExtractQuestionsInput } from '@/ai/flows/extract-questions-from-text';
import { ThemeToggle } from './theme-toggle';

// Types
type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type FileNode = {
  id: string;
  name:string;
  type: 'file';
  questions: Question[];
};

type FolderNode = {
  id: string;
  name: string;
  type: 'folder';
  children: TreeNode[];
};

type TreeNode = FileNode | FolderNode;

// Tree manipulation helpers
const findNode = (nodes: TreeNode[], nodeId: string | null): TreeNode | null => {
  if (!nodeId) return null;
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.type === 'folder') {
      const found = findNode(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
};

const updateNodeInTree = (
  nodes: TreeNode[],
  nodeId: string,
  updates: Partial<TreeNode>
): TreeNode[] => {
  return nodes
    .map((node) => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.type === 'folder' && node.children) {
        const newChildren = updateNodeInTree(node.children, nodeId, updates);
        if (newChildren !== node.children) {
          return { ...node, children: newChildren };
        }
      }
      return node;
    })
    .filter(Boolean) as TreeNode[];
};

const deleteNodeFromTree = (nodes: TreeNode[], nodeId: string): TreeNode[] => {
  return nodes.filter((node) => {
    if (node.id === nodeId) return false;
    if (node.type === 'folder' && node.children) {
      node.children = deleteNodeFromTree(node.children, nodeId);
    }
    return true;
  });
};

const addNodeToTree = (
  nodes: TreeNode[],
  parentId: string | null,
  newNode: TreeNode
): TreeNode[] => {
  if (parentId === null) {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.id === parentId && node.type === 'folder') {
      return { ...node, children: [...node.children, newNode] };
    }
    if (node.type === 'folder' && node.children) {
      return {
        ...node,
        children: addNodeToTree(node.children, parentId, newNode),
      };
    }
    return node;
  });
};

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
    noQuestionsDescription:
      'استخدم اللوحة اليمنى لإضافة أسئلة جديدة أو استخراجها من نص.',
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
      'سيؤدي هذا الإجراء إلى حذف جميع الأسئلة في الملف الحالي بشكل دائم.',
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
    deleteItemConfirmDescription:
      'سيتم حذف هذا العنصر وجميع محتوياته بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
    saveFile: 'حفظ الملف',
    unsavedChangesTitle: 'لديك تغييرات غير محفوظة',
    unsavedChangesDescription: 'هل تريد المتابعة وتجاهل التغييرات؟',
    discardChanges: 'تجاهل',
    unsavedChangesTooltip: 'توجد تغييرات غير محفوظة',
    noFileSelected: 'حدد ملفًا من القائمة أو أنشئ ملفًا جديدًا للبدء.',
    fileSavedSuccess: 'تم حفظ الملف بنجاح.',
    noActiveFile: 'الرجاء تحديد ملف أولاً.',
    saveButton: 'حفظ',
    createProjectButton: 'إنشاء',
    menu: 'القائمة',
  },
  en: {
    title: 'Question Extractor',
    description:
      'Turn your texts and documents into interactive quizzes with a few clicks.',
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
    noQuestionsDescription:
      'Use the right panel to add new questions or extract them from text.',
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
      'This action will permanently delete all questions in the current file.',
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
    deleteItemConfirmDescription:
      'This item and all its contents will be permanently deleted. This action cannot be undone.',
    saveFile: 'Save File',
    unsavedChangesTitle: 'You have unsaved changes',
    unsavedChangesDescription:
      'Are you sure you want to continue and discard them?',
    discardChanges: 'Discard',
    unsavedChangesTooltip: 'There are unsaved changes',
    noFileSelected: 'Select a file from the list or create a new one to start.',
    fileSavedSuccess: 'File saved successfully.',
    noActiveFile: 'Please select a file first.',
    saveButton: 'Save',
    createProjectButton: 'Create',
    menu: 'Menu',
  },
};

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


function QuestionExtractorComponent() {
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

  // File System State
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [isDirty, setIsDirty] = useState(false);

  // Dialog states
  const [nodeToRename, setNodeToRename] = useState<TreeNode | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [nodeToDelete, setNodeToDelete] = useState<TreeNode | null>(null);
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] =
    useState(false);
  const [nextAction, setNextAction] = useState<(() => void) | null>(null);
  const [nodeToAddTo, setNodeToAddTo] = useState<FolderNode | null>(null);
  const [newNodeInfo, setNewNodeInfo] = useState<{
    type: 'file' | 'folder';
    name: string;
  } | null>(null);

  const t = translations[language];
  const { isMobile, setOpenMobile } = useSidebar();
  const activeFile = findNode(fileTree, activeFileId) as FileNode | null;


  // Load tree from localStorage on mount
  useEffect(() => {
    try {
      const savedTreeJson = localStorage.getItem('question-extractor-file-tree');
      const savedExpandedJson = localStorage.getItem('question-extractor-expanded-folders');
      const savedActiveId = localStorage.getItem('question-extractor-active-file-id');

      if (savedTreeJson) {
        // If there is saved data, load it.
        const savedTree = JSON.parse(savedTreeJson);
        setFileTree(savedTree);
        if (savedExpandedJson) {
          setExpandedFolders(new Set(JSON.parse(savedExpandedJson)));
        }
        if (savedActiveId) {
          const fileToLoad = findNode(savedTree, savedActiveId) as FileNode | null;
          if (fileToLoad) {
            setActiveFileId(savedActiveId);
            setQuestions(fileToLoad.questions);
          }
        }
      } else {
        // If no saved data, create and set an example structure.
        const exampleTree: TreeNode[] = [
          {
            id: 'stage-1',
            name: 'المرحلة الجامعية',
            type: 'folder',
            children: [
              {
                id: 'uni-1',
                name: 'جامعة حلب',
                type: 'folder',
                children: [
                  {
                    id: 'faculty-1',
                    name: 'كلية الطب',
                    type: 'folder',
                    children: [
                       {
                        id: 'dep-1',
                        name: 'قسم الطب البشري',
                        type: 'folder',
                        children: [
                          {
                            id: 'year-1',
                            name: 'السنة الأولى',
                            type: 'folder',
                            children: [
                              {
                                id: 'semester-1',
                                name: 'الفصل الأول',
                                type: 'folder',
                                children: [
                                  {
                                    id: 'course-1',
                                    name: 'مادة التشريح',
                                    type: 'file',
                                    questions: []
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                       }
                    ]
                  }
                ]
              }
            ]
          }
        ];
        setFileTree(exampleTree);
        // Automatically expand the folders in the example to make it visible
        setExpandedFolders(new Set(['stage-1', 'uni-1', 'faculty-1', 'dep-1', 'year-1', 'semester-1']));
      }
    } catch (e) {
      console.error('Failed to load data from localStorage', e);
      setFileTree([]); // Fallback to empty on any error
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    localStorage.setItem(
      'question-extractor-expanded-folders',
      JSON.stringify(Array.from(expandedFolders))
    );
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
    const savedQuestions = savedFile.questions;
    if (JSON.stringify(savedQuestions) !== JSON.stringify(questions)) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [questions, activeFileId, fileTree]);

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

        setQuestions((prevQuestions) => [...prevQuestions, ...result.questions]);

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
    if (isDirty && activeFileId) {
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

  const handleSelectFile = (fileId: string) => {
    const action = () => {
      const fileToLoad = findNode(fileTree, fileId) as FileNode | null;
      if (fileToLoad && fileToLoad.type === 'file') {
        setActiveFileId(fileId);
        setQuestions(fileToLoad.questions);
        setIsDirty(false);
        if (isMobile) {
          setOpenMobile(false);
        }
      }
    };
    executeWithUnsavedChangesCheck(action);
  };

  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleSaveFile = () => {
    if (!activeFileId) {
      toast({
        title: t.errorToastTitle,
        description: t.noActiveFile,
        variant: 'destructive',
      });
      return;
    }
    setFileTree((prevTree) =>
      updateNodeInTree(prevTree, activeFileId, { questions })
    );
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

    if (parentId) {
      setExpandedFolders((prev) => new Set(prev).add(parentId));
    }

    setNodeToAddTo(null);
    setNewNodeInfo(null);
  };

  const handleRenameNode = () => {
    if (!nodeToRename || !newNodeName.trim()) return;
    setFileTree((prevTree) =>
      updateNodeInTree(prevTree, nodeToRename.id, { name: newNodeName })
    );
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
    const blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;',
    });
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
      executeJsonDownload(downloadFileName);
    }
    setIsDownloadDialogOpen(false);
  };

  const renderTree = (nodes: TreeNode[], level: number): React.ReactNode => {
    return nodes.map((node) => (
      <div
        key={node.id}
        style={{ paddingRight: `${level * 1.25}rem` }}
        className="pl-0"
      >
        <div
          className={cn(
            'flex items-center justify-between group rounded-md hover:bg-muted',
            activeFileId === node.id && 'bg-accent text-accent-foreground'
          )}
        >
          <button
            onClick={() =>
              node.type === 'folder'
                ? handleToggleFolder(node.id)
                : handleSelectFile(node.id)
            }
            className="flex-grow flex items-center gap-2 p-2 text-sm text-right"
          >
            {node.type === 'folder' ? (
              <>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-200',
                    expandedFolders.has(node.id) && 'rotate-90'
                  )}
                />
                {expandedFolders.has(node.id) ? (
                  <FolderOpen className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
              </>
            ) : (
              <FileText className="h-4 w-4 mr-1" />
            )}
            <span className="truncate">{node.name}</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-50 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {node.type === 'folder' && (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      setNodeToAddTo(node);
                      setNewNodeInfo({ type: 'folder', name: '' });
                    }}
                  >
                    <FolderPlus className="ml-2 h-4 w-4" />
                    <span>{t.newFolder}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setNodeToAddTo(node);
                      setNewNodeInfo({ type: 'file', name: '' });
                    }}
                  >
                    <FilePlus className="ml-2 h-4 w-4" />
                    <span>{t.newFile}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  setNodeToRename(node);
                  setNewNodeName(node.name);
                }}
              >
                {t.rename}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setNodeToDelete(node)}
                className="text-destructive focus:text-destructive"
              >
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {node.type === 'folder' &&
          expandedFolders.has(node.id) && (
            <div>{renderTree(node.children, level + 1)}</div>
          )}
      </div>
    ));
  };
  
  const SidebarComponent = (
    <Sidebar side="right" className="max-w-xs w-full" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.fileExplorer}</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SidebarTrigger className="hidden md:block" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>{renderTree(fileTree, 0)}</SidebarContent>
      <SidebarFooter className="flex-col gap-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            setNodeToAddTo(null);
            setNewNodeInfo({ type: 'folder', name: '' });
          }}
        >
          <FolderPlus className="ml-2 h-4 w-4" />
          <span>{t.newFolder}</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            setNodeToAddTo(null);
            setNewNodeInfo({ type: 'file', name: '' });
          }}
        >
          <FilePlus className="ml-2 h-4 w-4" />
          <span>{t.newFile}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* DIALOGS */}
      <AlertDialog
        open={isUnsavedChangesDialogOpen}
        onOpenChange={setIsUnsavedChangesDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.unsavedChangesTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.unsavedChangesDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.clearAllDialogCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscardChanges}
              variant="destructive"
            >
              {t.discardChanges}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!nodeToRename}
        onOpenChange={(isOpen) => !isOpen && setNodeToRename(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.rename}</DialogTitle>
          </DialogHeader>
          <Input
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameNode()}
          />
          <DialogFooter>
            <Button onClick={handleRenameNode}>{t.saveButton}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!newNodeInfo}
        onOpenChange={(isOpen) => !isOpen && setNewNodeInfo(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newNodeInfo?.type === 'folder' ? t.newFolder : t.newFile}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={newNodeInfo?.name || ''}
            onChange={(e) =>
              setNewNodeInfo((prev) =>
                prev ? { ...prev, name: e.target.value } : null
              )
            }
            placeholder={
              newNodeInfo?.type === 'folder'
                ? t.enterFolderName
                : t.enterFileName
            }
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewNode()}
          />
          <DialogFooter>
            <Button onClick={handleAddNewNode}>{t.createProjectButton}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!nodeToDelete}
        onOpenChange={(isOpen) => !isOpen && setNodeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteItemConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteItemConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.clearAllDialogCancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNode} variant="destructive">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-row-reverse gap-8">
        {SidebarComponent}
        
        <SidebarInset className="flex-1 min-w-0">
         <header className="flex justify-between items-center mb-10">
            <div className="text-right">
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
                    {t.title}
                </h1>
                <p className="text-muted-foreground mt-3 text-lg md:text-xl">
                    {t.description}
                </p>
            </div>
             <div className="md:hidden">
                <SidebarTrigger asChild>
                <Button variant="outline" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">{t.menu}</span>
                </Button>
                </SidebarTrigger>
            </div>
        </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="shadow-sm border h-full">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center justify-between w-full md:w-auto gap-4">
                      <CardTitle
                        className="font-headline text-2xl truncate"
                        title={activeFile?.name || (isDirty ? t.unsavedQuestions : t.extractedQuestionsTitle)}
                      >
                         {activeFile?.name || (isDirty ? t.unsavedQuestions : t.extractedQuestionsTitle)}
                      </CardTitle>
                      
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleSaveFile}
                        disabled={!activeFileId || !isDirty || isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {t.saveFile}
                        {isDirty && activeFileId && (
                          <span
                            className="ml-2 h-2 w-2 rounded-full bg-destructive animate-pulse"
                            title={t.unsavedChangesTooltip}
                          ></span>
                        )}
                      </Button>
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
                                <DialogTitle>
                                  {t.downloadDialogTitle}
                                </DialogTitle>
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
                                <Button
                                  onClick={() => handleConfirmDownload('csv')}
                                >
                                  {t.downloadCsvButton}
                                </Button>
                                <Button
                                  onClick={() => handleConfirmDownload('json')}
                                  variant="secondary"
                                >
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
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(questions.length > 0 || isPending) ? (
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
                                    handleQuestionFieldChange(
                                      qIndex,
                                      'question',
                                      e.target.value
                                    )
                                  }
                                  className="w-full min-w-[200px] bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary p-1 resize-none"
                                />
                              </TableCell>
                              {Array.from({ length: 5 }).map((_, oIndex) => {
                                const optionText = q.options[oIndex] ?? '';
                                const isCorrect =
                                  q.correctAnswer === optionText &&
                                  optionText !== '';

                                return (
                                  <TableCell
                                    key={oIndex}
                                    className="p-1 align-top"
                                  >
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
                                          <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                                        )}
                                      </div>
                                      <AutosizeTextarea
                                        value={optionText}
                                        onChange={(e) =>
                                          handleOptionChange(
                                            qIndex,
                                            oIndex,
                                            e.target.value
                                          )
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
                                    handleQuestionFieldChange(
                                      qIndex,
                                      'explanation',
                                      e.target.value
                                    )
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
                              <TableCell
                                colSpan={9}
                                className="p-8 text-center"
                              >
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
                    <div className="text-center text-muted-foreground p-12 space-y-3 h-full flex flex-col justify-center items-center">
                        <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <h3 className="text-xl font-semibold text-foreground">
                            {activeFileId ? t.noQuestionsYet : t.noFileSelected}
                        </h3>
                        <p>{activeFileId ? t.noQuestionsDescription : t.noQuestionsDescription}</p>
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
        </SidebarInset>
      </div>
    </div>
  );
}


export default function QuestionExtractor() {
  return (
    <SidebarProvider>
      <QuestionExtractorComponent />
    </SidebarProvider>
  )
}
