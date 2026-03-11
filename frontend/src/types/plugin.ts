export interface Plugin {
  id: string; name: string; version: string; description: string | null;
  is_enabled: boolean; config: Record<string, unknown>; installed_at: string;
}
