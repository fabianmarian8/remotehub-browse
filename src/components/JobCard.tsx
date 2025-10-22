import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, MapPin, Clock, DollarSign, ExternalLink, Sparkles, Heart } from "lucide-react"
import { Database } from "@/integrations/supabase/types"
import { useAuth } from "@/contexts/AuthContext"
import { useSavedJobs } from "@/hooks/useSavedJobs"
import { AuthDialog } from "@/components/AuthDialog"

type Job = Database['public']['Tables']['jobs']['Row']

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const { user } = useAuth()
  const { isJobSaved, toggleSaveJob, isSaving } = useSavedJobs()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const isSaved = isJobSaved(job.id)

  const handleSaveClick = () => {
    if (!user) {
      setShowAuthDialog(true)
      return
    }
    toggleSaveJob(job.id)
  }

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null

    const formatNumber = (num: number) => {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}k`
      }
      return num.toLocaleString()
    }

    const currency = job.salary_currency === 'USD' ? '$' : job.salary_currency
    const min = job.salary_min ? `${currency}${formatNumber(job.salary_min)}` : ''
    const max = job.salary_max ? `${currency}${formatNumber(job.salary_max)}` : ''

    // Format period suffix
    const periodMap: Record<string, string> = {
      'yearly': '/year',
      'monthly': '/month',
      'hourly': '/hr',
      'project': ''
    }
    const period = periodMap[job.salary_period || 'yearly'] || '/year'

    const salaryRange = min && max ? `${min} - ${max}` : min || max
    return `${salaryRange}${period}`
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  const isNew = () => {
    const d = new Date(job.published_at)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = diff / (1000 * 60 * 60)
    return hours < 24
  }

  const salary = formatSalary()
  const newJob = isNew()

  // Get company initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/20">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative">
        <div className="flex gap-4">
          {/* Company Logo */}
          <Avatar className="h-16 w-16 rounded-lg border-2 border-border group-hover:border-primary/30 transition-colors">
            <AvatarImage
              src={job.company_logo_url || undefined}
              alt={job.company}
              className="object-cover"
            />
            <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold">
              {getInitials(job.company)}
            </AvatarFallback>
          </Avatar>

          {/* Job Title & Company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                {job.title}
              </CardTitle>
              <div className="flex gap-2 flex-shrink-0">
                {newJob && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    NEW
                  </Badge>
                )}
                {job.is_featured && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg shadow-yellow-500/20">
                    ⭐ Featured
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="flex items-center gap-2 text-base font-medium">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{job.company}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Job Info Grid */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium">{job.job_type}</span>
          </div>
          {salary && (
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-green-600">{salary}</span>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {job.description.replace(/<[^>]*>/g, '').slice(0, 150)}
          </p>
        )}

        {/* Category & Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 text-primary font-medium hover:bg-primary/10 transition-colors"
          >
            {job.category}
          </Badge>
          {job.tags?.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-secondary/50 hover:bg-secondary transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm text-muted-foreground font-medium">
            {formatDate(job.published_at)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isSaved ? "default" : "outline"}
              onClick={handleSaveClick}
              disabled={isSaving}
              className="gap-2 transition-all"
            >
              <Heart
                className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`}
              />
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Button
              size="sm"
              onClick={() => window.open(job.apply_url, '_blank')}
              className="gap-2 shadow-md hover:shadow-lg transition-all group-hover:scale-105"
            >
              Apply Now
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Auth Dialog */}
        <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </CardContent>
    </Card>
  )
}
