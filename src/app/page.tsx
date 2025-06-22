import QuestionExtractor from '@/components/question-extractor';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <SidebarProvider>
        <QuestionExtractor />
      </SidebarProvider>
    </main>
  );
}
