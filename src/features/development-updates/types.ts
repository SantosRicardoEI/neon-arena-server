export type NoticeLevel = "info" | "warning" | "critical";

export interface DevelopmentUpdate {
  id: string;
  level: NoticeLevel;
  text: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}
