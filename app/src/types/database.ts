export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type CompanyStatus = 'active' | 'inactive'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type DocumentCategory =
  | 'compliance_certificate'
  | 'safety_policy'
  | 'audit_report'
  | 'training_record'
  | 'legal_document'
  | 'inspection_report'
  | 'internal_template'
  | 'miscellaneous'
export type SafetyFileStatus = 'pending' | 'in_progress' | 'under_review' | 'completed' | 'expired'
export type SafetySectionStatus = 'pending' | 'in_progress' | 'completed' | 'not_applicable'
export type SafetySectionType =
  | 'risk_assessments'
  | 'method_statements'
  | 'ppe_compliance'
  | 'training_records'
  | 'induction_records'
  | 'emergency_procedures'
  | 'site_inspections'
export type UserRole = 'admin' | 'manager' | 'compliance_officer' | 'finance'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: UserRole
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          role?: UserRole
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          name: string
          registration_number: string | null
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          industry_type: string | null
          status: CompanyStatus
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          registration_number?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          industry_type?: string | null
          status?: CompanyStatus
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          registration_number?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          industry_type?: string | null
          status?: CompanyStatus
          notes?: string | null
          created_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          company_id: string
          issue_date: string
          due_date: string
          status: InvoiceStatus
          vat_enabled: boolean
          vat_rate: number
          subtotal: number
          vat_amount: number
          total: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          company_id: string
          issue_date?: string
          due_date: string
          status?: InvoiceStatus
          vat_enabled?: boolean
          vat_rate?: number
          subtotal?: number
          vat_amount?: number
          total?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          invoice_number?: string
          company_id?: string
          issue_date?: string
          due_date?: string
          status?: InvoiceStatus
          vat_enabled?: boolean
          vat_rate?: number
          subtotal?: number
          vat_amount?: number
          total?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          line_total: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          description?: string
          quantity?: number
          unit_price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          }
        ]
      }
      quotes: {
        Row: {
          id: string
          quote_number: string
          company_id: string
          issue_date: string
          valid_until: string
          status: QuoteStatus
          vat_enabled: boolean
          vat_rate: number
          subtotal: number
          vat_amount: number
          total: number
          notes: string | null
          converted_to_invoice_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quote_number: string
          company_id: string
          issue_date?: string
          valid_until: string
          status?: QuoteStatus
          vat_enabled?: boolean
          vat_rate?: number
          subtotal?: number
          vat_amount?: number
          total?: number
          notes?: string | null
          converted_to_invoice_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          quote_number?: string
          company_id?: string
          issue_date?: string
          valid_until?: string
          status?: QuoteStatus
          vat_enabled?: boolean
          vat_rate?: number
          subtotal?: number
          vat_amount?: number
          total?: number
          notes?: string | null
          converted_to_invoice_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      quote_line_items: {
        Row: {
          id: string
          quote_id: string
          description: string
          quantity: number
          unit_price: number
          line_total: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          quote_id: string
          description: string
          quantity?: number
          unit_price?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          description?: string
          quantity?: number
          unit_price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          title: string
          description: string | null
          category: DocumentCategory
          company_id: string | null
          storage_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          tags: string[]
          upload_date: string
          expiry_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: DocumentCategory
          company_id?: string | null
          storage_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          tags?: string[]
          upload_date?: string
          expiry_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          category?: DocumentCategory
          company_id?: string | null
          expiry_date?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      safety_files: {
        Row: {
          id: string
          file_reference: string
          company_id: string
          project_name: string
          site_name: string | null
          status: SafetyFileStatus
          assigned_date: string
          due_date: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          file_reference: string
          company_id: string
          project_name: string
          site_name?: string | null
          status?: SafetyFileStatus
          assigned_date?: string
          due_date?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          file_reference?: string
          project_name?: string
          site_name?: string | null
          status?: SafetyFileStatus
          assigned_date?: string
          due_date?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      safety_file_sections: {
        Row: {
          id: string
          safety_file_id: string
          section_type: SafetySectionType
          status: SafetySectionStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          safety_file_id: string
          section_type: SafetySectionType
          status?: SafetySectionStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: SafetySectionStatus
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      safety_file_section_documents: {
        Row: {
          id: string
          section_id: string
          document_id: string
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          document_id: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          entity_label: string | null
          old_value: Json | null
          new_value: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          entity_label?: string | null
          old_value?: Json | null
          new_value?: Json | null
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: {
      v_safety_file_progress: {
        Row: {
          safety_file_id: string
          file_reference: string
          project_name: string
          company_id: string
          company_name: string
          status: SafetyFileStatus
          due_date: string | null
          total_sections: number
          completed_sections: number
          completion_percentage: number
        }
        Relationships: []
      }
      v_dashboard_kpis: {
        Row: {
          total_active_companies: number
          outstanding_invoices: number
          overdue_invoices: number
          outstanding_amount: number
          active_quotes: number
          safety_files_in_progress: number
          expiring_documents_30d: number
        }
        Relationships: []
      }
      v_monthly_revenue: {
        Row: {
          month: string
          revenue: number
          invoice_count: number
        }
        Relationships: []
      }
    }
    Functions: {
      check_invoice_number_unique: {
        Args: { p_invoice_number: string; p_exclude_id?: string }
        Returns: boolean
      }
      check_quote_number_unique: {
        Args: { p_quote_number: string; p_exclude_id?: string }
        Returns: boolean
      }
      convert_quote_to_invoice: {
        Args: {
          p_quote_id: string
          p_invoice_number: string
          p_issue_date?: string
          p_due_date?: string
        }
        Returns: string
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
    }
    Enums: {
      company_status: CompanyStatus
      invoice_status: InvoiceStatus
      quote_status: QuoteStatus
      document_category: DocumentCategory
      safety_file_status: SafetyFileStatus
      safety_section_status: SafetySectionStatus
      user_role: UserRole
    }
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceLineItem = Database['public']['Tables']['invoice_line_items']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type QuoteLineItem = Database['public']['Tables']['quote_line_items']['Row']
export type SHEDocument = Database['public']['Tables']['documents']['Row']
export type SafetyFile = Database['public']['Tables']['safety_files']['Row']
export type SafetyFileSection = Database['public']['Tables']['safety_file_sections']['Row']
export type SafetyFileSectionDocument = Database['public']['Tables']['safety_file_section_documents']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']

// With relations
export type InvoiceWithCompany = Invoice & { companies: Pick<Company, 'id' | 'name'> }
export type QuoteWithCompany = Quote & { companies: Pick<Company, 'id' | 'name'> }
export type InvoiceWithLineItems = Invoice & { invoice_line_items: InvoiceLineItem[] }
export type QuoteWithLineItems = Quote & { quote_line_items: QuoteLineItem[] }
export type SafetyFileWithSections = SafetyFile & { safety_file_sections: SafetyFileSection[] }
