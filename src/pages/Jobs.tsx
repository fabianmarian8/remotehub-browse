import { useState } from 'react'
import { useJobs } from '@/hooks/useJobs'
import { JobCard } from '@/components/JobCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Search, Loader2 } from 'lucide-react'

export default function Jobs() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>()
  const [jobType, setJobType] = useState<string>()
  const [page, setPage] = useState(0)
  
  const limit = 20
  const offset = page * limit
  
  const { data, isLoading, error } = useJobs({ 
    search, 
    category, 
    jobType, 
    limit, 
    offset 
  })

  const totalPages = data ? Math.ceil(data.count / limit) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">Remote Jobs</h1>
          
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs, companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Customer Support">Customer Support</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Data">Data</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-full md:w-[200px]">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading jobs. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data?.jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No jobs found. Try adjusting your filters.</p>
          </div>
        )}

        {/* Job Cards Grid */}
        {!isLoading && !error && data && data.jobs.length > 0 && (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground">
              Showing {offset + 1} - {Math.min(offset + limit, data.count)} of {data.count} jobs
            </div>
            
            <div className="grid gap-4">
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
                >
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground px-4">
                  Page {page + 1} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
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
