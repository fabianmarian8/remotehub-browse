import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FeaturedCompanies from "@/components/FeaturedCompanies";
import JobRecommendations from "@/components/JobRecommendations";
import { TrendingUp, Sparkles, Building2, Search } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              RemoteJobsHub
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Find your dream remote job with AI-powered recommendations
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 transition-all hover:scale-105"
              onClick={() => navigate('/jobs')}
            >
              <Search className="h-5 w-5 mr-2" />
              Browse Jobs
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 transition-all hover:scale-105"
              onClick={() => navigate('/trends')}
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              View Trends
            </Button>
          </div>
        </div>

        {/* Features Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-lg bg-card border text-center space-y-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">AI Job Matching</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized job recommendations based on your preferences and interests
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border text-center space-y-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Market Insights</h3>
            <p className="text-sm text-muted-foreground">
              Explore job market trends, salary insights, and hiring patterns
            </p>
          </div>
          <div className="p-6 rounded-lg bg-card border text-center space-y-2">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Company Pages</h3>
            <p className="text-sm text-muted-foreground">
              Browse jobs by company and discover featured employers
            </p>
          </div>
        </div>

        {/* Job Recommendations */}
        <div className="mb-16">
          <JobRecommendations limit={6} showHeader={true} />
        </div>

        {/* Featured Companies */}
        <div className="mb-16">
          <FeaturedCompanies limit={6} showHeader={true} />
        </div>
      </div>
    </div>
  );
};

export default Index;
