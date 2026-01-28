export type Database = {
  public: {
    Tables: {
      projects: {
        Row: { id: string; name: string; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; name: string; created_at?: string | null; updated_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      urls: {
        Row: {
          id: string;
          project_id: string;
          url: string;
          tags: string[] | null;
          note: string | null;
          expected_status: number | null;
          check_interval_minutes: number | null;
          active: boolean;
          last_checked_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["urls"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["urls"]["Row"]>;
      };
      checks: {
        Row: {
          id: string;
          url_id: string;
          started_at: string;
          finished_at: string | null;
          status: string;
          http_status: number | null;
          response_ms: number | null;
          content_hash: string | null;
          meta_hash: string | null;
          screenshot_path: string | null;
          final_url: string | null;
          redirect_count: number | null;
          ssl_expires_at: string | null;
          error_message: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["checks"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["checks"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          project_id: string;
          type: string;
          endpoint: string;
          enabled: boolean;
          threshold: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
  };
};
