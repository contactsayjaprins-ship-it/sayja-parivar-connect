export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          created_at: string
          doc_type: string
          family_id: string
          id: string
          label: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          family_id: string
          id?: string
          label?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          family_id?: string
          id?: string
          label?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          family_id: string | null
          id: string
          photo: string | null
          title: string
          village: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string
          family_id?: string | null
          id?: string
          photo?: string | null
          title: string
          village?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          family_id?: string | null
          id?: string
          photo?: string | null
          title?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          address: string | null
          blood_group: string | null
          category_tag: string | null
          created_at: string
          current_village: string | null
          education: string | null
          email: string | null
          family_code: string | null
          form_photo: string | null
          gallery: Json | null
          gov_job: string
          gov_job_place: string
          house_photo: string
          id: string
          lat: number | null
          lng: number | null
          mobile: string
          name: string
          native_village: string | null
          occupation: string | null
          profile_photo: string | null
          surname: string
          total_members: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          blood_group?: string | null
          category_tag?: string | null
          created_at?: string
          current_village?: string | null
          education?: string | null
          email?: string | null
          family_code?: string | null
          form_photo?: string | null
          gallery?: Json | null
          gov_job?: string
          gov_job_place?: string
          house_photo?: string
          id?: string
          lat?: number | null
          lng?: number | null
          mobile: string
          name?: string
          native_village?: string | null
          occupation?: string | null
          profile_photo?: string | null
          surname?: string
          total_members?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          blood_group?: string | null
          category_tag?: string | null
          created_at?: string
          current_village?: string | null
          education?: string | null
          email?: string | null
          family_code?: string | null
          form_photo?: string | null
          gallery?: Json | null
          gov_job?: string
          gov_job_place?: string
          house_photo?: string
          id?: string
          lat?: number | null
          lng?: number | null
          mobile?: string
          name?: string
          native_village?: string | null
          occupation?: string | null
          profile_photo?: string | null
          surname?: string
          total_members?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          blood_group: string | null
          created_at: string
          education: string | null
          family_id: string
          gender: string | null
          gov_job: string
          gov_job_place: string
          id: string
          mobile: string | null
          name: string | null
          occupation: string | null
          photo: string | null
          position: number | null
          relation: string | null
        }
        Insert: {
          blood_group?: string | null
          created_at?: string
          education?: string | null
          family_id: string
          gender?: string | null
          gov_job?: string
          gov_job_place?: string
          id?: string
          mobile?: string | null
          name?: string | null
          occupation?: string | null
          photo?: string | null
          position?: number | null
          relation?: string | null
        }
        Update: {
          blood_group?: string | null
          created_at?: string
          education?: string | null
          family_id?: string
          gender?: string | null
          gov_job?: string
          gov_job_place?: string
          id?: string
          mobile?: string | null
          name?: string | null
          occupation?: string | null
          photo?: string | null
          position?: number | null
          relation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          family_id: string
          id: string
          owner_mobile: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          owner_mobile: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          owner_mobile?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          mobile: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          mobile: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          mobile?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role_mobile: {
        Args: {
          _mobile: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
