// Hand-written for Phase 1a. Regenerate when the schema grows:
//   npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      firms: {
        Row: {
          id: string;
          name: string;
          plan: "free" | "pro" | "small_firm";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: "free" | "pro" | "small_firm";
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          plan: "free" | "pro" | "small_firm";
        }>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          firm_id: string | null;
          role: "admin" | "member";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          firm_id?: string | null;
          role?: "admin" | "member";
          created_at?: string;
        };
        Update: Partial<{
          full_name: string | null;
          firm_id: string | null;
          role: "admin" | "member";
        }>;
      };
      quota_counters: {
        Row: {
          user_id: string;
          day: string;
          qa_count: number;
          draft_count: number;
        };
        Insert: {
          user_id: string;
          day?: string;
          qa_count?: number;
          draft_count?: number;
        };
        Update: Partial<{
          qa_count: number;
          draft_count: number;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
