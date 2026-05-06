export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          title: string;
          role: string;
          color: string;
          initials: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          name?: string;
          title?: string;
          role?: string;
          color?: string;
          initials?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string | null;
          name?: string;
          title?: string;
          role?: string;
          color?: string;
          initials?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          }
        ];
      };
      tasks: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          category: string;
          priority: string;
          status: string;
          visibility: string;
          due_date: string | null;
          notes: string | null;
          created_by: string;
          assigned_to: string | null;
          claimed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          category?: string;
          priority?: string;
          status?: string;
          visibility?: string;
          due_date?: string | null;
          notes?: string | null;
          created_by: string;
          assigned_to?: string | null;
          claimed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          category?: string;
          priority?: string;
          status?: string;
          visibility?: string;
          due_date?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
          claimed_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      people_care: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          care_category: string;
          last_contact_date: string | null;
          next_follow_up_date: string | null;
          notes: string | null;
          status: string;
          visibility: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          care_category: string;
          last_contact_date?: string | null;
          next_follow_up_date?: string | null;
          notes?: string | null;
          status?: string;
          visibility?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          care_category?: string;
          last_contact_date?: string | null;
          next_follow_up_date?: string | null;
          notes?: string | null;
          status?: string;
          visibility?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sermons: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          scripture_text: string | null;
          series_name: string | null;
          preaching_date: string | null;
          status: string;
          big_idea: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          scripture_text?: string | null;
          series_name?: string | null;
          preaching_date?: string | null;
          status?: string;
          big_idea?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          scripture_text?: string | null;
          series_name?: string | null;
          preaching_date?: string | null;
          status?: string;
          big_idea?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      prayer_requests: {
        Row: {
          id: string;
          organization_id: string;
          person_name: string;
          request: string;
          category: string;
          date_added: string;
          follow_up_date: string | null;
          status: string;
          private_notes: string | null;
          visibility: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          person_name: string;
          request: string;
          category: string;
          date_added?: string;
          follow_up_date?: string | null;
          status?: string;
          private_notes?: string | null;
          visibility?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          person_name?: string;
          request?: string;
          category?: string;
          date_added?: string;
          follow_up_date?: string | null;
          status?: string;
          private_notes?: string | null;
          visibility?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rhythm_items: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string;
          title: string;
          description: string | null;
          day_of_week: string | null;
          is_recurring: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          profile_id: string;
          title: string;
          description?: string | null;
          day_of_week?: string | null;
          is_recurring?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          day_of_week?: string | null;
          is_recurring?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      rhythm_completions: {
        Row: {
          id: string;
          rhythm_item_id: string;
          profile_id: string;
          completed_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          rhythm_item_id: string;
          profile_id: string;
          completed_date: string;
          created_at?: string;
        };
        Update: {
          completed_date?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
