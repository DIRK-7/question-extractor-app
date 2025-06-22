'use client';

// Types
export type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type FileNode = {
  id: string;
  name: string;
  type: 'file';
  questions: Question[];
};

export type FolderNode = {
  id: string;
  name: string;
  type: 'folder';
  children: TreeNode[];
};

export type TreeNode = FileNode | FolderNode;

// Tree manipulation helpers
export const findNode = (nodes: TreeNode[], nodeId: string | null): TreeNode | null => {
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

export const updateNodeInTree = (
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

export const deleteNodeFromTree = (nodes: TreeNode[], nodeId: string): TreeNode[] => {
  return nodes.filter((node) => {
    if (node.id === nodeId) return false;
    if (node.type === 'folder' && node.children) {
      node.children = deleteNodeFromTree(node.children, nodeId);
    }
    return true;
  });
};

export const addNodeToTree = (
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
