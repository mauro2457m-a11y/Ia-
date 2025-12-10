export interface ChapterOutline {
  title: string;
  outline: string;
}

export interface BookPlan {
  title: string;
  subtitle: string;
  salesDescription: string;
  coverVisualPrompt: string;
  chapters: ChapterOutline[];
}

export interface ChapterContent {
  index: number;
  title: string;
  content: string;
  isGenerating: boolean;
  isComplete: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  REVIEW = 'REVIEW',
  GENERATING = 'GENERATING',
  FINISHED = 'FINISHED'
}

export interface GenerationProgress {
  currentChapter: number;
  totalChapters: number;
  status: string;
}
