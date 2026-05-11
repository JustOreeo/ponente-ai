// Hand-written for Phase 1b. Regenerate when the schema grows:
//   npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LegalDocType =
  | "constitution"
  | "code"
  | "republic_act"
  | "supreme_court_decision"
  | "executive_order"
  | "admin_issuance"
  | "local_ordinance";

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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      legal_documents: {
        Row: {
          id: string;
          title: string;
          doc_type: LegalDocType;
          source_url: string | null;
          jurisdiction: string;
          practice_areas: string[];
          effective_date: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          doc_type: LegalDocType;
          source_url?: string | null;
          jurisdiction?: string;
          practice_areas?: string[];
          effective_date?: string | null;
          metadata?: Json;
        };
        Update: Partial<{
          title: string;
          doc_type: LegalDocType;
          source_url: string | null;
          practice_areas: string[];
          effective_date: string | null;
          metadata: Json;
        }>;
        Relationships: [];
      };
      legal_chunks: {
        Row: {
          id: string;
          document_id: string;
          chunk_index: number;
          text: string;
          embedding: number[];
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          chunk_index: number;
          text: string;
          embedding: number[];
          metadata?: Json;
        };
        Update: Partial<{
          text: string;
          embedding: number[];
          metadata: Json;
        }>;
        Relationships: [];
      };
      firm_invites: {
        Row: {
          id: string;
          firm_id: string;
          email: string;
          role: "admin" | "member";
          token: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          firm_id: string;
          email: string;
          role?: "admin" | "member";
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_by: string;
        };
        Update: Partial<{
          role: "admin" | "member";
          accepted_at: string | null;
          accepted_by: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_firm_admin: {
        Args: {
          check_firm_id: string;
          check_user_id: string;
        };
        Returns: boolean;
      };
      match_legal_chunks: {
        Args: {
          query_embedding: number[];
          match_count?: number;
          practice_area_filter?: string[] | null;
        };
        Returns: {
          chunk_id: string;
          document_id: string;
          chunk_index: number;
          chunk_text: string;
          similarity: number;
          doc_title: string;
          doc_type: LegalDocType;
          source_url: string | null;
          practice_areas: string[];
          effective_date: string | null;
          doc_metadata: Json;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
