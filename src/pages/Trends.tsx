import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useTrendingCategories,
  useLocationInsights,
  useJobTrends,
  useSalaryInsights,
  useCompanyInsights,
} from '@/hooks/useJobAnalytics';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, MapPin, Building2, DollarSign, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function Trends() {
  const { data: trendingCategories, isLoading: loadingCategories } = useTrendingCategories();
  const { data: locationInsights, isLoading: loadingLocations } = useLocationInsights();
  const { data: jobTrends, isLoading: loadingTrends } = useJobTrends(30);
  const { data: salaryInsights, isLoading: loadingSalaries } = useSalaryInsights();
  const { data: companyInsights, isLoading: loadingCompanies } = useCompanyInsights();

  const topCompanies = companyInsights?.slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Job Market Trends</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Insights and analytics about the current job market
          </p>
        </div>

        {/* Job Trends Over Time */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Job Postings - Last 30 Days
            </CardTitle>
            <CardDescription>
              Track how many jobs have been posted each day
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={jobTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [value, 'Jobs']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0088FE"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Jobs Posted"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trending Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Most In-Demand Positions
              </CardTitle>
              <CardDescription>
                Categories with the most job openings in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={trendingCategories?.slice(0, 6)}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {trendingCategories?.slice(0, 6).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {trendingCategories?.slice(0, 8).map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={category.growth > 0 ? 'default' : 'secondary'}>
                            {category.count} jobs
                          </Badge>
                          {category.growth !== 0 && (
                            <Badge
                              variant={category.growth > 0 ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {category.growth > 0 ? '+' : ''}
                              {category.growth.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Top Hiring Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top Hiring Locations
              </CardTitle>
              <CardDescription>
                Where companies are hiring most actively
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLocations ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={locationInsights?.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="location" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#00C49F" name="Job Openings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Salary Insights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Average Salaries by Category
            </CardTitle>
            <CardDescription>
              Salary ranges for different job categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSalaries ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={salaryInsights?.filter((s) => s.currency === 'USD').slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="avgSalaryMin" fill="#8884D8" name="Avg Min Salary" />
                  <Bar dataKey="avgSalaryMax" fill="#82CA9D" name="Avg Max Salary" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Companies Hiring Most Actively
            </CardTitle>
            <CardDescription>
              Companies with the most open positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCompanies ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topCompanies.map((company) => (
                  <Link
                    key={company.company}
                    to={`/companies/${encodeURIComponent(company.company)}`}
                  >
                    <Card className="hover:bg-accent transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {company.companyLogoUrl ? (
                              <img
                                src={company.companyLogoUrl}
                                alt={company.company}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold">{company.company}</h3>
                              <p className="text-sm text-muted-foreground">
                                {company.companySize && (
                                  <span className="capitalize">{company.companySize} • </span>
                                )}
                                {company.jobCount} open {company.jobCount === 1 ? 'position' : 'positions'}
                              </p>
                            </div>
                          </div>
                          {company.isFeatured && (
                            <Badge variant="default">Featured</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link to="/jobs">Browse All Jobs</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
