import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/integrations/supabase/types'

type Job = Database['public']['Tables']['jobs']['Row']
type SavedJob = Database['public']['Tables']['saved_jobs']['Row']

export function useSavedJobs() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get all saved jobs for the current user
  const { data: savedJobs = [], isLoading } = useQuery({
    queryKey: ['saved-jobs', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('saved_jobs')
        .select(`
          *,
          jobs (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data as (SavedJob & { jobs: Job })[]
    },
    enabled: !!user,
  })

  // Check if a specific job is saved
  const isJobSaved = (jobId: string) => {
    return savedJobs.some((saved) => saved.job_id === jobId)
  }

  // Save a job
  const saveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error('You must be signed in to save jobs')

      const { error } = await supabase
        .from('saved_jobs')
        .insert({ user_id: user.id, job_id: jobId })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast({
        title: 'Job saved!',
        description: 'Job has been added to your saved list.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save job',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Unsave a job
  const unsaveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!user) throw new Error('You must be signed in')

      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] })
      toast({
        title: 'Job removed',
        description: 'Job has been removed from your saved list.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove job',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Toggle save status
  const toggleSaveJob = (jobId: string) => {
    if (isJobSaved(jobId)) {
      unsaveJobMutation.mutate(jobId)
    } else {
      saveJobMutation.mutate(jobId)
    }
  }

  return {
    savedJobs,
    isLoading,
    isJobSaved,
    toggleSaveJob,
    saveJob: saveJobMutation.mutate,
    unsaveJob: unsaveJobMutation.mutate,
    isSaving: saveJobMutation.isPending || unsaveJobMutation.isPending,
  }
}
