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
      jobs: {
        Row: {
          id: string
          title: string
          company: string
          description: string
          requirements: string | null
          location: string
          job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance'
          category: string
          tags: string[] | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string
          apply_url: string
          company_url: string | null
          company_logo_url: string | null
          source: string
          source_id: string | null
          published_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
          is_featured: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          company: string
          description: string
          requirements?: string | null
          location?: string
          job_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance'
          category: string
          tags?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          apply_url: string
          company_url?: string | null
          company_logo_url?: string | null
          source: string
          source_id?: string | null
          published_at: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          company?: string
          description?: string
          requirements?: string | null
          location?: string
          job_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance'
          category?: string
          tags?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          apply_url?: string
          company_url?: string | null
          company_logo_url?: string | null
          source?: string
          source_id?: string | null
          published_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_active?: boolean
        }
      }
    }
  }
}
