export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment'
          balance: number
          currency: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment'
          balance?: number
          currency?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'checking' | 'savings' | 'credit' | 'cash' | 'investment'
          balance?: number
          currency?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          type: 'income' | 'expense'
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string
          type: 'income' | 'expense'
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          type?: 'income' | 'expense'
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string | null
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          notes: string | null
          receipt_url: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          category_id?: string | null
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          notes?: string | null
          receipt_url?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          category_id?: string | null
          type?: 'income' | 'expense' | 'transfer'
          amount?: number
          description?: string
          notes?: string | null
          receipt_url?: string | null
          date?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          invoice_number: string
          client_name: string
          client_email: string | null
          client_address: string | null
          client_pan: string | null
          date: string
          due_date: string
          status: 'draft' | 'sent' | 'paid'
          notes: string | null
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          invoice_number: string
          client_name: string
          client_email?: string | null
          client_address?: string | null
          client_pan?: string | null
          date: string
          due_date: string
          status?: 'draft' | 'sent' | 'paid'
          notes?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          created_at?: string
        }
        Update: {
          id?: string
          client_name?: string
          client_email?: string | null
          client_address?: string | null
          client_pan?: string | null
          date?: string
          due_date?: string
          status?: 'draft' | 'sent' | 'paid'
          notes?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: 'planning' | 'active' | 'completed' | 'on-hold'
          color: string
          key: string | null
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: 'planning' | 'active' | 'completed' | 'on-hold'
          color?: string
          key?: string | null
          due_date?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: 'planning' | 'active' | 'completed' | 'on-hold'
          color?: string
          key?: string | null
          due_date?: string | null
        }
        Relationships: []
      }
      sprints: {
        Row: {
          id: string
          project_id: string
          user_id: string
          name: string
          goal: string | null
          status: 'planning' | 'active' | 'completed'
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          name: string
          goal?: string | null
          status?: 'planning' | 'active' | 'completed'
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          goal?: string | null
          status?: 'planning' | 'active' | 'completed'
          start_date?: string | null
          end_date?: string | null
        }
        Relationships: []
      }
      epics: {
        Row: {
          id: string
          project_id: string
          user_id: string
          name: string
          color: string
          status: 'open' | 'in-progress' | 'done'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          name: string
          color?: string
          status?: 'open' | 'in-progress' | 'done'
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
          status?: 'open' | 'in-progress' | 'done'
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          project_id: string
          sprint_id: string | null
          epic_id: string | null
          user_id: string
          ticket_number: number
          title: string
          description: string | null
          type: 'story' | 'bug' | 'task'
          status: 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
          priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest'
          story_points: number | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          sprint_id?: string | null
          epic_id?: string | null
          user_id: string
          title: string
          description?: string | null
          type?: 'story' | 'bug' | 'task'
          status?: 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
          priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest'
          story_points?: number | null
          created_at?: string
        }
        Update: {
          sprint_id?: string | null
          epic_id?: string | null
          title?: string
          description?: string | null
          type?: 'story' | 'bug' | 'task'
          status?: 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done'
          priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest'
          story_points?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string
          description: string | null
          status: 'todo' | 'in-progress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title: string
          description?: string | null
          status?: 'todo' | 'in-progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          status?: 'todo' | 'in-progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price?: number
          amount?: number
        }
        Update: {
          id?: string
          description?: string
          quantity?: number
          unit_price?: number
          amount?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Account = Database['public']['Tables']['accounts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type Sprint = Database['public']['Tables']['sprints']['Row']
export type Epic = Database['public']['Tables']['epics']['Row']
export type Ticket = Database['public']['Tables']['tickets']['Row']
