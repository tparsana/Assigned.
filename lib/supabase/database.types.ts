export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assigned_access_level_permissions: {
        Row: {
          access_level: Database["public"]["Enums"]["assigned_access_level"]
          created_at: string
          permission: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["assigned_access_level"]
          created_at?: string
          permission: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["assigned_access_level"]
          created_at?: string
          permission?: string
        }
        Relationships: []
      }
      assigned_activity_log: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["assigned_activity_kind"]
          organization_id: string
          project_id: string | null
          summary: string
          target_user_id: string | null
          task_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["assigned_activity_kind"]
          organization_id: string
          project_id?: string | null
          summary: string
          target_user_id?: string | null
          task_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["assigned_activity_kind"]
          organization_id?: string
          project_id?: string | null
          summary?: string
          target_user_id?: string | null
          task_id?: string | null
        }
        Relationships: []
      }
      assigned_member_projects: {
        Row: {
          assigned_by_user_id: string | null
          created_at: string
          id: string
          is_primary: boolean
          membership_id: string
          project_id: string
        }
        Insert: {
          assigned_by_user_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          membership_id: string
          project_id: string
        }
        Update: {
          assigned_by_user_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          membership_id?: string
          project_id?: string
        }
        Relationships: []
      }
      assigned_memberships: {
        Row: {
          access_level: Database["public"]["Enums"]["assigned_access_level"]
          availability: Database["public"]["Enums"]["assigned_availability_status"]
          created_at: string
          id: string
          is_admin: boolean
          manager_user_id: string | null
          organization_id: string
          position_id: string | null
          status: Database["public"]["Enums"]["assigned_member_status"]
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["assigned_access_level"]
          availability?: Database["public"]["Enums"]["assigned_availability_status"]
          created_at?: string
          id?: string
          is_admin?: boolean
          manager_user_id?: string | null
          organization_id: string
          position_id?: string | null
          status?: Database["public"]["Enums"]["assigned_member_status"]
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["assigned_access_level"]
          availability?: Database["public"]["Enums"]["assigned_availability_status"]
          created_at?: string
          id?: string
          is_admin?: boolean
          manager_user_id?: string | null
          organization_id?: string
          position_id?: string | null
          status?: Database["public"]["Enums"]["assigned_member_status"]
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assigned_organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      assigned_positions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assigned_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lead_user_id: string | null
          location_text: string | null
          name: string
          organization_id: string
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["assigned_project_status"]
          end_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          lead_user_id?: string | null
          location_text?: string | null
          name: string
          organization_id: string
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["assigned_project_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          lead_user_id?: string | null
          location_text?: string | null
          name?: string
          organization_id?: string
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["assigned_project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      assigned_task_attachments: {
        Row: {
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      assigned_task_checklist_items: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          sort_order: number
          task_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          sort_order?: number
          task_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          sort_order?: number
          task_id?: string
          text?: string
        }
        Relationships: []
      }
      assigned_task_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      assigned_tasks: {
        Row: {
          assignee_user_id: string
          blocked_reason: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["assigned_task_priority"] | null
          project_id: string | null
          status: Database["public"]["Enums"]["assigned_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_user_id: string
          blocked_reason?: string | null
          category: string
          completed_at?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["assigned_task_priority"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["assigned_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_user_id?: string
          blocked_reason?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["assigned_task_priority"] | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["assigned_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assigned_team_projects: {
        Row: {
          created_at: string
          id: string
          project_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          team_id?: string
        }
        Relationships: []
      }
      assigned_teams: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          lead_user_id: string | null
          name: string
          organization_id: string
          parent_department: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          lead_user_id?: string | null
          name: string
          organization_id: string
          parent_department?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          lead_user_id?: string | null
          name?: string
          organization_id?: string
          parent_department?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      assigned_user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          first_name: string
          last_name: string
          onboarding_completed: boolean
          phone: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email: string
          first_name?: string
          last_name?: string
          onboarding_completed?: boolean
          phone?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          first_name?: string
          last_name?: string
          onboarding_completed?: boolean
          phone?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assigned_user_states: {
        Row: {
          created_at: string
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      assigned_bootstrap_admin_available: {
        Args: {
          organization_id?: string | null
        }
        Returns: boolean
      }
      assigned_can_manage_task_assignee: {
        Args: {
          check_user_id?: string | null
          target_user_id: string
        }
        Returns: boolean
      }
      assigned_can_manage_task_row: {
        Args: {
          check_user_id?: string | null
          task_assignee_user_id: string
          task_created_by_user_id: string
        }
        Returns: boolean
      }
      assigned_can_view_task: {
        Args: {
          check_user_id?: string | null
          target_user_id: string
        }
        Returns: boolean
      }
      assigned_can_view_task_row: {
        Args: {
          check_user_id?: string | null
          task_assignee_user_id: string
          task_created_by_user_id: string
        }
        Returns: boolean
      }
      assigned_claim_bootstrap_admin: {
        Args: Record<string, never>
        Returns: Json
      }
      assigned_default_organization_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      assigned_has_permission: {
        Args: {
          check_user_id?: string | null
          permission_name: string
        }
        Returns: boolean
      }
      assigned_is_admin: {
        Args: {
          check_user_id?: string | null
        }
        Returns: boolean
      }
      assigned_shares_team_with: {
        Args: {
          check_user_id?: string | null
          target_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      assigned_access_level: "employee" | "team_lead" | "admin" | "external"
      assigned_activity_kind: "assignment" | "completion" | "comment" | "update"
      assigned_availability_status: "available" | "busy" | "on_leave"
      assigned_member_status: "active" | "inactive"
      assigned_project_status: "active" | "planning" | "handover" | "on_hold"
      assigned_task_priority: "low" | "medium" | "high"
      assigned_task_status: "open" | "in_progress" | "on_hold" | "done" | "cancelled"
    }
    CompositeTypes: Record<string, never>
  }
}

export type DbTables = Database["public"]["Tables"]
export type DbEnums = Database["public"]["Enums"]
