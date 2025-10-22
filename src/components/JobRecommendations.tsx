import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useJobRecommendations } from '@/hooks/useJobRecommendations';
import { Sparkles, Loader2, Briefcase } from 'lucide-react';
import { JobCard } from '@/components/JobCard';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface JobRecommendationsProps {
  limit?: number;
  showHeader?: boolean;
}

export default function JobRecommendations({ limit = 6, showHeader = true }: JobRecommendationsProps) {
  const { user } = useAuth();
  const { data: recommendations, isLoading } = useJobRecommendations(limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          {showHeader && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {user ? 'Recommended For You' : 'Trending Jobs'}
              </CardTitle>
              <CardDescription>
                {user
                  ? 'Personalized job recommendations based on your preferences'
                  : 'Popular jobs that might interest you'}
              </CardDescription>
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

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          {showHeader && (
            <>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {user ? 'Recommended For You' : 'Trending Jobs'}
              </CardTitle>
              <CardDescription>
                {user
                  ? 'Personalized job recommendations based on your preferences'
                  : 'Popular jobs that might interest you'}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {user
                ? 'No recommendations available. Try saving some jobs to help us understand your preferences!'
                : 'No jobs available at the moment'}
            </p>
            <Button asChild>
              <Link to="/jobs">Browse All Jobs</Link>
            </Button>
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
                  <Sparkles className="h-5 w-5 text-primary" />
                  {user ? 'Recommended For You' : 'Trending Jobs'}
                </CardTitle>
                <CardDescription>
                  {user
                    ? 'Personalized job recommendations based on your preferences'
                    : 'Popular jobs that might interest you'}
                </CardDescription>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/jobs">View All</Link>
              </Button>
            </div>
          </>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
        {user && recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <Sparkles className="h-4 w-4 inline mr-1" />
              These recommendations improve as you save more jobs and update your preferences
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
