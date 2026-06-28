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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      author_emails: {
        Row: {
          author_id: string
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_emails_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: true
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "author_emails_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: true
            referencedRelation: "authors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string | null
          display_name: string
          id: string
          is_public: boolean | null
          linked_user_id: string | null
          role_title: string | null
          slug: string
          social_instagram: string | null
          social_twitter: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          is_public?: boolean | null
          linked_user_id?: string | null
          role_title?: string | null
          slug: string
          social_instagram?: string | null
          social_twitter?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_public?: boolean | null
          linked_user_id?: string | null
          role_title?: string | null
          slug?: string
          social_instagram?: string | null
          social_twitter?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          click_tag: string
          created_at: string
          created_by: string | null
          cta_text: string
          description: string | null
          end_date: string | null
          id: string
          image_desktop_url: string | null
          image_mobile_url: string | null
          impression_tag: string | null
          is_active: boolean
          position: Database["public"]["Enums"]["banner_position"]
          start_date: string | null
          target_device: string
          title: string
          updated_at: string
        }
        Insert: {
          click_tag: string
          created_at?: string
          created_by?: string | null
          cta_text: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_desktop_url?: string | null
          image_mobile_url?: string | null
          impression_tag?: string | null
          is_active?: boolean
          position?: Database["public"]["Enums"]["banner_position"]
          start_date?: string | null
          target_device?: string
          title: string
          updated_at?: string
        }
        Update: {
          click_tag?: string
          created_at?: string
          created_by?: string | null
          cta_text?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_desktop_url?: string | null
          image_mobile_url?: string | null
          impression_tag?: string | null
          is_active?: boolean
          position?: Database["public"]["Enums"]["banner_position"]
          start_date?: string | null
          target_device?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
        }
        Relationships: []
      }
      news_sources: {
        Row: {
          created_at: string
          created_by: string | null
          feed_url: string | null
          id: string
          is_active: boolean
          last_scanned_at: string | null
          list_selector: string | null
          name: string
          updated_at: string
          url: string
          url_path_includes: string[] | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          feed_url?: string | null
          id?: string
          is_active?: boolean
          last_scanned_at?: string | null
          list_selector?: string | null
          name: string
          updated_at?: string
          url: string
          url_path_includes?: string[] | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          feed_url?: string | null
          id?: string
          is_active?: boolean
          last_scanned_at?: string | null
          list_selector?: string | null
          name?: string
          updated_at?: string
          url?: string
          url_path_includes?: string[] | null
        }
        Relationships: []
      }
      news_suggestions: {
        Row: {
          accepted_post_id: string | null
          ai_reasoning: string | null
          ai_score: number | null
          article_url: string
          created_at: string
          discovered_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published_at: string | null
          source_id: string | null
          status: string
          suggested_category_id: string | null
          suggested_tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          accepted_post_id?: string | null
          ai_reasoning?: string | null
          ai_score?: number | null
          article_url: string
          created_at?: string
          discovered_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_id?: string | null
          status?: string
          suggested_category_id?: string | null
          suggested_tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          accepted_post_id?: string | null
          ai_reasoning?: string | null
          ai_score?: number | null
          article_url?: string
          created_at?: string
          discovered_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string | null
          source_id?: string | null
          status?: string
          suggested_category_id?: string | null
          suggested_tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_suggestions_accepted_post_id_fkey"
            columns: ["accepted_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_suggestions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_suggestions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "sport_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          excerpt: string
          id: string
          image_url: string | null
          is_news_of_day: boolean
          is_sponsored: boolean
          published_at: string
          slug: string
          source_url: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          excerpt: string
          id?: string
          image_url?: string | null
          is_news_of_day?: boolean
          is_sponsored?: boolean
          published_at?: string
          slug: string
          source_url: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          image_url?: string | null
          is_news_of_day?: boolean
          is_sponsored?: boolean
          published_at?: string
          slug?: string
          source_url?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "sport_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          id: string
          is_public: boolean | null
          role_title: string | null
          slug: string | null
          social_instagram: string | null
          social_twitter: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id: string
          is_public?: boolean | null
          role_title?: string | null
          slug?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          is_public?: boolean | null
          role_title?: string | null
          slug?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      review_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string | null
          category_id: string | null
          cons: string[]
          content: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          gallery: string[]
          id: string
          is_ai_generated: boolean
          product_brand: string | null
          product_name: string | null
          pros: string[]
          published_at: string | null
          score: number | null
          slug: string
          source_url: string | null
          status: string
          title: string
          updated_at: string
          verdict: string | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          cons?: string[]
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          gallery?: string[]
          id?: string
          is_ai_generated?: boolean
          product_brand?: string | null
          product_name?: string | null
          pros?: string[]
          published_at?: string | null
          score?: number | null
          slug: string
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          cons?: string[]
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          gallery?: string[]
          id?: string
          is_ai_generated?: boolean
          product_brand?: string | null
          product_name?: string | null
          pros?: string[]
          published_at?: string | null
          score?: number | null
          slug?: string
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "review_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          id: string
          platform: string
          post_id: string
          published_at: string | null
          scheduled_at: string | null
          status: string
          webhook_response: Json | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          platform?: string
          post_id: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          webhook_response?: Json | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          platform?: string
          post_id?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          webhook_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_categories: {
        Row: {
          bg_color: string
          created_at: string
          icon_name: string | null
          icon_url: string | null
          id: string
          is_default: boolean
          name: string
          slug: string
          social_image_url: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          is_default?: boolean
          name: string
          slug: string
          social_image_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          icon_name?: string | null
          icon_url?: string | null
          id?: string
          is_default?: boolean
          name?: string
          slug?: string
          social_image_url?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          post_count: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          post_count?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          post_count?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallpapers: {
        Row: {
          background_color: string
          background_image_url: string | null
          click_url: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean
          left_wing_url: string | null
          linked_banner_id: string | null
          min_screen_width: number
          name: string
          right_wing_url: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string
          background_image_url?: string | null
          click_url: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          left_wing_url?: string | null
          linked_banner_id?: string | null
          min_screen_width?: number
          name: string
          right_wing_url?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string
          background_image_url?: string | null
          click_url?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          left_wing_url?: string | null
          linked_banner_id?: string | null
          min_screen_width?: number
          name?: string
          right_wing_url?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallpapers_linked_banner_id_fkey"
            columns: ["linked_banner_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
        ]
      }
      worldcup_cache: {
        Row: {
          cache_key: string
          data: Json
          expires_at: string
          fetched_at: string
        }
        Insert: {
          cache_key: string
          data: Json
          expires_at: string
          fetched_at?: string
        }
        Update: {
          cache_key?: string
          data?: Json
          expires_at?: string
          fetched_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      authors_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_public: boolean | null
          role_title: string | null
          slug: string | null
          social_instagram: string | null
          social_twitter: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_public?: boolean | null
          role_title?: string | null
          slug?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_public?: boolean | null
          role_title?: string | null
          slug?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_post_slug: { Args: { title: string }; Returns: string }
      generate_tag_slug: { Args: { tag_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_editor: { Args: { _user_id: string }; Returns: boolean }
      sync_tags: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      banner_position:
        | "home_top"
        | "home_middle"
        | "home_bottom"
        | "recki_home_top"
        | "recki_home_middle"
        | "recki_home_bottom"
        | "recki_inline"
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
      app_role: ["admin", "editor", "viewer"],
      banner_position: [
        "home_top",
        "home_middle",
        "home_bottom",
        "recki_home_top",
        "recki_home_middle",
        "recki_home_bottom",
        "recki_inline",
      ],
    },
  },
} as const
