import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/integrations/supabase/types'

type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert']
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update']

export function useEmailPreferences() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get user preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['email-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If no preferences exist yet, return null
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data as UserPreferences
    },
    enabled: !!user,
  })

  // Create or update preferences
  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<UserPreferencesUpdate>) => {
      if (!user) throw new Error('You must be signed in')

      if (preferences) {
        // Update existing
        const { error } = await supabase
          .from('user_preferences')
          .update(prefs)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            ...prefs,
          } as UserPreferencesInsert)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences'] })
      toast({
        title: 'Preferences saved!',
        description: 'Your email alert preferences have been updated.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save preferences',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  return {
    preferences,
    isLoading,
    savePreferences: savePreferencesMutation.mutate,
    isSaving: savePreferencesMutation.isPending,
  }
}
