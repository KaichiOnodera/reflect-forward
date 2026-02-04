export interface DiaryEntry {
  id: string;
  userId: string;
  content: string | null;
  shortMemo: string | null;
  rating: number | null; // 1-5
  entryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaryEntryCreate {
  content?: string | null;
  shortMemo?: string | null;
  rating?: number | null;
  entryDate: string; // ISO date string
}

export interface DiaryEntryUpdate {
  content?: string | null;
  shortMemo?: string | null;
  rating?: number | null;
  entryDate?: string;
}
