'use client'

import { SidebarProvider } from '@/components/ui/sidebar';
import QuestionExtractorComponent from '@/components/question-extractor-component';

export default function QuestionExtractor() {
  return (
    <SidebarProvider>
      <QuestionExtractorComponent />
    </SidebarProvider>
  )
}
