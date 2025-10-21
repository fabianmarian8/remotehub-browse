import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Clock, DollarSign, ExternalLink } from "lucide-react"
import { Database } from "@/integrations/supabase/types"

type Job = Database['public']['Tables']['jobs']['Row']

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null
    
    const min = job.salary_min ? `${job.salary_currency} ${job.salary_min.toLocaleString()}` : ''
    const max = job.salary_max ? `${job.salary_currency} ${job.salary_max.toLocaleString()}` : ''
    
    if (min && max) return `${min} - ${max}`
    return min || max
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

  const salary = formatSalary()

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 hover:text-primary transition-colors">
              {job.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              {job.company}
            </CardDescription>
          </div>
          {job.is_featured && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        
        {/* Job Info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {job.location}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {job.job_type}
          </div>
          {salary && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {salary}
            </div>
          )}
        </div>

        {/* Category & Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{job.category}</Badge>
          {job.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            {formatDate(job.published_at)}
          </span>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => window.open(job.apply_url, '_blank')}
            className="gap-2"
          >
            Apply Now
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
