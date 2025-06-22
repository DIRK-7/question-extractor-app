'use client';

import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  FolderPlus,
  FilePlus,
  MoreVertical,
  ChevronRight,
  FolderOpen,
  Folder,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import type { TreeNode, FolderNode } from '@/lib/file-tree-utils';

type FileExplorerProps = {
  fileTree: TreeNode[];
  activeFileId: string | null;
  expandedFolders: Set<string>;
  translations: Record<string, string>;
  onNodeSelect: (nodeId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onRenameNode: (node: TreeNode) => void;
  onDeleteNode: (node: TreeNode) => void;
  onNewFile: (parentNode: FolderNode | null) => void;
  onNewFolder: (parentNode: FolderNode | null) => void;
};

export function FileExplorer({
  fileTree,
  activeFileId,
  expandedFolders,
  translations: t,
  onNodeSelect,
  onToggleFolder,
  onRenameNode,
  onDeleteNode,
  onNewFile,
  onNewFolder,
}: FileExplorerProps) {
  const renderTree = (nodes: TreeNode[], level: number): React.ReactNode => {
    return nodes.map((node) => (
      <div
        key={node.id}
        style={{ paddingRight: `${level * 1.25}rem` }}
        className="pl-0"
      >
        <div
          className={cn(
            'flex items-center justify-between group rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            activeFileId === node.id && 'bg-sidebar-primary text-sidebar-primary-foreground'
          )}
        >
          <button
            onClick={() =>
              node.type === 'folder'
                ? onToggleFolder(node.id)
                : onNodeSelect(node.id)
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
                  <DropdownMenuItem onSelect={() => onNewFolder(node)}>
                    <FolderPlus className="ml-2 h-4 w-4" />
                    <span>{t.newFolder}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onNewFile(node)}>
                    <FilePlus className="ml-2 h-4 w-4" />
                    <span>{t.newFile}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onSelect={() => onRenameNode(node)}>
                {t.rename}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onDeleteNode(node)}
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

  return (
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
      <SidebarContent className="p-2">{renderTree(fileTree, 0)}</SidebarContent>
      <SidebarFooter className="flex-col gap-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onNewFolder(null)}
        >
          <FolderPlus className="ml-2 h-4 w-4" />
          <span>{t.newFolder}</span>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => onNewFile(null)}
        >
          <FilePlus className="ml-2 h-4 w-4" />
          <span>{t.newFile}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
