import { useParams, Link } from 'react-router-dom';
import { useCompanyJobs, useCompanyDetails } from '@/hooks/useCompanyJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ExternalLink, MapPin, Briefcase, ArrowLeft, Loader2 } from 'lucide-react';
import { JobCard } from '@/components/JobCard';

export default function Company() {
  const { companyName } = useParams<{ companyName: string }>();
  const decodedCompanyName = decodeURIComponent(companyName || '');

  const { data: companyData, isLoading: loadingDetails } = useCompanyDetails(decodedCompanyName);
  const { data: jobsData, isLoading: loadingJobs } = useCompanyJobs(decodedCompanyName);

  if (loadingDetails || loadingJobs) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  const jobs = jobsData?.jobs || [];
  const jobCount = jobsData?.count || 0;

  // Group jobs by category
  const jobsByCategory: Record<string, typeof jobs> = {};
  jobs.forEach((job) => {
    const category = job.category || 'Other';
    if (!jobsByCategory[category]) {
      jobsByCategory[category] = [];
    }
    jobsByCategory[category].push(job);
  });

  // Group jobs by remote type
  const jobsByRemoteType: Record<string, number> = {};
  jobs.forEach((job) => {
    const remoteType = job.remote_type || 'not-specified';
    jobsByRemoteType[remoteType] = (jobsByRemoteType[remoteType] || 0) + 1;
  });

  // Get unique locations
  const locations = Array.from(new Set(jobs.map((job) => job.location).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/trends">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trends
          </Link>
        </Button>

        {/* Company Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Company Logo */}
              {companyData?.logoUrl ? (
                <img
                  src={companyData.logoUrl}
                  alt={companyData.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              {/* Company Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{decodedCompanyName}</h1>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {companyData?.size && (
                    <Badge variant="secondary" className="capitalize">
                      <Building2 className="h-3 w-3 mr-1" />
                      {companyData.size}
                    </Badge>
                  )}
                  <Badge variant="default">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {jobCount} open {jobCount === 1 ? 'position' : 'positions'}
                  </Badge>
                </div>
                {companyData?.websiteUrl && (
                  <Button variant="outline" asChild>
                    <a
                      href={companyData.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      Visit Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(jobsByCategory)
                  .sort(([, a], [, b]) => b.length - a.length)
                  .map(([category, categoryJobs]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <Badge variant="secondary">{categoryJobs.length}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Remote Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work Arrangements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(jobsByRemoteType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {type.replace(/-/g, ' ')}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hiring Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {locations.slice(0, 5).map((location) => (
                  <div key={location} className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{location}</span>
                  </div>
                ))}
                {locations.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    +{locations.length - 5} more {locations.length - 5 === 1 ? 'location' : 'locations'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No open positions</h3>
                <p className="text-muted-foreground">
                  {decodedCompanyName} doesn't have any active job postings at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" variant="outline">
            <Link to="/jobs">Browse All Jobs</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
