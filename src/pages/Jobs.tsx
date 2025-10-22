import { useState } from 'react'
import { useJobs } from '@/hooks/useJobs'
import { JobCard } from '@/components/JobCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Search, Loader2, Briefcase, TrendingUp, Filter, X } from 'lucide-react'

export default function Jobs() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>()
  const [jobType, setJobType] = useState<string>()
  const [page, setPage] = useState(0)

  const limit = 20
  const offset = page * limit

  const { data, isLoading, error } = useJobs({
    search,
    category: category === 'all' ? undefined : category,
    jobType: jobType === 'all' ? undefined : jobType,
    limit,
    offset
  })

  const totalPages = data ? Math.ceil(data.count / limit) : 0

  const hasFilters = search || (category && category !== 'all') || (jobType && jobType !== 'all')

  const clearFilters = () => {
    setSearch('')
    setCategory(undefined)
    setJobType(undefined)
    setPage(0)
  }

  // Calculate new jobs (last 24h)
  const newJobsCount = data?.jobs.filter(job => {
    const publishedDate = new Date(job.published_at)
    const now = new Date()
    const diffHours = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60)
    return diffHours < 24
  }).length || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Header */}
      <header className="border-b bg-gradient-to-r from-primary/5 via-background to-primary/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Find Your Dream Remote Job
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Discover thousands of remote opportunities from top companies worldwide
            </p>

            {/* Stats */}
            {!isLoading && data && (
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-semibold">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {data.count.toLocaleString()} Active Jobs
                </Badge>
                {newJobsCount > 0 && (
                  <Badge className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {newJobsCount} New Today
                  </Badge>
                )}
              </div>
            )}

            {/* Search & Filters */}
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, companies, skills..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(0)
                    }}
                    className="pl-11 h-12 text-base shadow-sm"
                  />
                </div>

                <Select
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px] h-12 shadow-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Engineering">💻 Engineering</SelectItem>
                    <SelectItem value="Design">🎨 Design</SelectItem>
                    <SelectItem value="Marketing">📢 Marketing</SelectItem>
                    <SelectItem value="Sales">💼 Sales</SelectItem>
                    <SelectItem value="Customer Support">🎧 Customer Support</SelectItem>
                    <SelectItem value="Product">🚀 Product</SelectItem>
                    <SelectItem value="Data">📊 Data</SelectItem>
                    <SelectItem value="Other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={jobType}
                  onValueChange={(val) => {
                    setJobType(val)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="w-full md:w-[200px] h-12 shadow-sm">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>

                {hasFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-12 shadow-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading amazing opportunities...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full bg-destructive/10 mb-4">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Oops! Something went wrong</h3>
            <p className="text-muted-foreground mb-4">Error loading jobs. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data?.jobs.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full bg-muted mb-4">
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms
            </p>
            {hasFilters && (
              <Button onClick={clearFilters} variant="outline">
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Job Cards Grid */}
        {!isLoading && !error && data && data.jobs.length > 0 && (
          <div className="space-y-6">
            {/* Results header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Showing {offset + 1} - {Math.min(offset + limit, data.count)} of{' '}
                <span className="text-foreground font-semibold">{data.count}</span> jobs
              </p>
            </div>

            {/* Job cards */}
            <div className="grid gap-6">
              {data.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="shadow-sm"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i
                    if (totalPages > 5 && page > 2) {
                      pageNum = page - 2 + i
                      if (pageNum >= totalPages) {
                        pageNum = totalPages - 5 + i
                      }
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'ghost'}
                        onClick={() => setPage(pageNum)}
                        className="w-10 h-10 p-0"
                      >
                        {pageNum + 1}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="shadow-sm"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
