
export type MediaType = 'none' | 'image' | 'video';
export type NodeType = 'scene' | 'decision' | 'ending' | 'interrupt';
export type StyleMode = 'late_shift' | 'meibao' | 'shengshi';
export type InteractivityType = 'classic' | 'qte' | 'investigation' | 'emotion';
export type LayoutType = 'cinematic' | 'vertical' | 'rpg' | 'minimalist';
export type MonetizationType = 'free' | 'ad' | 'paid';
export type UserRole = 'creator' | 'admin';

export interface StoryOption {
  id: string;
  label: string;
  targetId: string;
  isDefault?: boolean;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  avatarSrc: string;
}

export interface ElementPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StoryNode {
  id: string;
  title: string;
  type: NodeType;
  content: string; 
  mediaType: MediaType;
  mediaSrc: string; 
  audioSrc: string; 
  x: number;
  y: number;
  options: StoryOption[];
  
  interactiveSettings?: {
    decisionTriggerTime: number; 
    autoTransition: boolean;    
    duration: number;           
  };

  monetization?: {
    type: MonetizationType;
    price?: number;
    adDescription?: string;
  };

  styleMode?: StyleMode;
  interactivity?: InteractivityType;

  layout?: {
    type?: LayoutType;
    textPos: ElementPosition;
    optionsPos: ElementPosition;
    uiBackgroundSrc: string;
  };
}

export interface ProjectMetadata {
  id: string;
  name: string;
  author: string;
  coverUrl: string;
  description: string;
  likes: number;
  views: number;
  remixCount: number;
  status: 'draft' | 'published';
  styleMode: StyleMode;
  interactivity: InteractivityType;
  layout: LayoutType;
  createdAt: string;
}

export interface ProjectData {
  metadata: ProjectMetadata;
  nodes: Record<string, StoryNode>;
  characters: Record<string, Character>;
  viewport: { x: number; y: number; zoom: number };
}
