export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_data: {
        Row: {
          category_distribution: Json | null
          created_at: string | null
          date: string
          domain_stats: Json | null
          id: string
          productivity_score: number | null
          total_time_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_distribution?: Json | null
          created_at?: string | null
          date: string
          domain_stats?: Json | null
          id?: string
          productivity_score?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_distribution?: Json | null
          created_at?: string | null
          date?: string
          domain_stats?: Json | null
          id?: string
          productivity_score?: number | null
          total_time_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_goals: {
        Row: {
          category: string
          created_at: string | null
          current_hours: number | null
          end_date: string
          id: string
          start_date: string
          target_hours: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          current_hours?: number | null
          end_date: string
          id?: string
          start_date: string
          target_hours: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          current_hours?: number | null
          end_date?: string
          id?: string
          start_date?: string
          target_hours?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookmark_analytics: {
        Row: {
          avg_time_spent: number | null
          bookmark_id: string
          created_at: string | null
          id: string
          last_visited: string | null
          updated_at: string | null
          user_id: string
          visit_count: number | null
        }
        Insert: {
          avg_time_spent?: number | null
          bookmark_id: string
          created_at?: string | null
          id?: string
          last_visited?: string | null
          updated_at?: string | null
          user_id: string
          visit_count?: number | null
        }
        Update: {
          avg_time_spent?: number | null
          bookmark_id?: string
          created_at?: string | null
          id?: string
          last_visited?: string | null
          updated_at?: string | null
          user_id?: string
          visit_count?: number | null
        }
        Relationships: []
      }
      bookmark_collection_items: {
        Row: {
          added_at: string | null
          bookmark_id: string
          collection_id: string
          position: number | null
        }
        Insert: {
          added_at?: string | null
          bookmark_id: string
          collection_id: string
          position?: number | null
        }
        Update: {
          added_at?: string | null
          bookmark_id?: string
          collection_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_collections: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          name: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_health: {
        Row: {
          bookmark_id: string
          created_at: string | null
          error_message: string | null
          id: string
          is_accessible: boolean | null
          last_checked: string | null
          response_time: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bookmark_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_accessible?: boolean | null
          last_checked?: string | null
          response_time?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bookmark_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_accessible?: boolean | null
          last_checked?: string | null
          response_time?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookmark_metadata: {
        Row: {
          bookmark_id: string
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          importance_score: number | null
          last_visited: string | null
          reading_time: number | null
          sentiment: string | null
          status: Database["public"]["Enums"]["bookmark_status"] | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          bookmark_id: string
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          importance_score?: number | null
          last_visited?: string | null
          reading_time?: number | null
          sentiment?: string | null
          status?: Database["public"]["Enums"]["bookmark_status"] | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          bookmark_id?: string
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          importance_score?: number | null
          last_visited?: string | null
          reading_time?: number | null
          sentiment?: string | null
          status?: Database["public"]["Enums"]["bookmark_status"] | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmark_shares: {
        Row: {
          collection_id: string | null
          created_at: string | null
          id: string
          owner_id: string
          permission_level: string
          shared_with_email: string | null
          shared_with_id: string | null
          updated_at: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          owner_id: string
          permission_level?: string
          shared_with_email?: string | null
          shared_with_id?: string | null
          updated_at?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          owner_id?: string
          permission_level?: string
          shared_with_email?: string | null
          shared_with_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_shares_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "bookmark_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string
          device_type: string
          id: string
          is_online: boolean | null
          last_active: string | null
          settings: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name: string
          device_type: string
          id?: string
          is_online?: boolean | null
          last_active?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string
          device_type?: string
          id?: string
          is_online?: boolean | null
          last_active?: string | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_categories: {
        Row: {
          category: string
          created_at: string | null
          domain: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          domain: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          domain?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      extension_connections: {
        Row: {
          browser: string
          created_at: string | null
          extension_id: string
          id: string
          last_connected: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          browser: string
          created_at?: string | null
          extension_id: string
          id?: string
          last_connected?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string
          created_at?: string | null
          extension_id?: string
          id?: string
          last_connected?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          subscription_end_date: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          subscription_end_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          subscription_end_date?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
      storage_backups: {
        Row: {
          created_at: string
          id: string
          key: string
          storage_type: Database["public"]["Enums"]["storage_type"] | null
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          storage_type?: Database["public"]["Enums"]["storage_type"] | null
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          storage_type?: Database["public"]["Enums"]["storage_type"] | null
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          created_at: string | null
          id: string
          last_sync: string | null
          message: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_sync?: string | null
          message?: string | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_sync?: string | null
          message?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_statistics: {
        Row: {
          api_calls: number | null
          created_at: string | null
          id: string
          last_reset: string | null
          storage_used: number | null
          summaries_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_calls?: number | null
          created_at?: string | null
          id?: string
          last_reset?: string | null
          storage_used?: number | null
          summaries_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_calls?: number | null
          created_at?: string | null
          id?: string
          last_reset?: string | null
          storage_used?: number | null
          summaries_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          data_collection_enabled: boolean | null
          id: string
          notifications_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_collection_enabled?: boolean | null
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_collection_enabled?: boolean | null
          id?: string
          notifications_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bookmark_status: "active" | "archived" | "deleted"
      storage_type: "sync" | "local"
      subscription_status: "free" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
