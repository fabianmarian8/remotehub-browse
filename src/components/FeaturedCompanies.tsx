import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeaturedCompanies } from '@/hooks/useJobAnalytics';
import { Building2, Loader2, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeaturedCompaniesProps {
  limit?: number;
  showHeader?: boolean;
}

export default function FeaturedCompanies({ limit = 6, showHeader = true }: FeaturedCompaniesProps) {
  const { data: companies, isLoading } = useFeaturedCompanies(limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          {showHeader && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Companies
              </CardTitle>
              <CardDescription>Top companies actively hiring on our platform</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <Card>
        <CardHeader>
          {showHeader && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Companies
              </CardTitle>
              <CardDescription>Top companies actively hiring on our platform</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No featured companies at the moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {showHeader && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Featured Companies
                </CardTitle>
                <CardDescription>Top companies actively hiring on our platform</CardDescription>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/trends">View All</Link>
              </Button>
            </div>
          </>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Link
              key={company.company}
              to={`/companies/${encodeURIComponent(company.company)}`}
            >
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-3">
                    {/* Company Logo */}
                    {company.companyLogoUrl ? (
                      <img
                        src={company.companyLogoUrl}
                        alt={company.company}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Company Name */}
                    <div className="w-full">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {company.company}
                      </h3>
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {company.jobCount} {company.jobCount === 1 ? 'job' : 'jobs'}
                        </Badge>
                        {company.companySize && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {company.companySize}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Featured Badge */}
                    <Badge variant="default" className="w-full justify-center">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
