
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
}

export interface MindMapNode {
  id: string;
  type: string;
  data: { label: string };
  position: { x: number; y: number };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

import { Timestamp } from 'firebase/firestore';

export interface MindMapDoc {
  id: string;
  title: string;
  ownerId: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  updatedAt: Timestamp | number | null;
  collaborators: string[];
}

export interface AIResponseNode {
  label: string;
  children?: AIResponseNode[];
}
