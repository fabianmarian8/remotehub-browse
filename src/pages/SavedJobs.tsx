import { useAuth } from '@/contexts/AuthContext'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { JobCard } from '@/components/JobCard'
import { AuthDialog } from '@/components/AuthDialog'
import { Button } from '@/components/ui/button'
import { Loader2, Heart, LogIn } from 'lucide-react'

export default function SavedJobs() {
  const { user } = useAuth()
  const { savedJobs, isLoading } = useSavedJobs()

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <header className="border-b bg-gradient-to-r from-primary/5 via-background to-primary/5 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Saved Jobs
            </h1>
            <p className="text-lg text-muted-foreground">
              Keep track of jobs you're interested in
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-20">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-6">
              <Heart className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Sign in to save jobs</h2>
            <p className="text-muted-foreground mb-6">
              Create an account or sign in to start saving jobs and get personalized job alerts.
            </p>
            <AuthDialog
              trigger={
                <Button size="lg" className="gap-2">
                  <LogIn className="h-5 w-5" />
                  Sign In
                </Button>
              }
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-gradient-to-r from-primary/5 via-background to-primary/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Saved Jobs
          </h1>
          <p className="text-lg text-muted-foreground">
            {savedJobs.length > 0
              ? `You have ${savedJobs.length} saved job${savedJobs.length === 1 ? '' : 's'}`
              : 'No saved jobs yet'}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your saved jobs...</p>
          </div>
        )}

        {!isLoading && savedJobs.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full bg-muted mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
            <p className="text-muted-foreground mb-4">
              Start saving jobs you're interested in to keep track of them here
            </p>
            <Button onClick={() => window.location.href = '/jobs'} variant="outline">
              Browse Jobs
            </Button>
          </div>
        )}

        {!isLoading && savedJobs.length > 0 && (
          <div className="grid gap-6">
            {savedJobs.map((savedJob) => (
              <JobCard key={savedJob.id} job={savedJob.jobs} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
