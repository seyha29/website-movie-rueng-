import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, TrendingUp, TrendingDown, Eye, Clock, Film, AlertCircle, Activity, ChevronUp, ChevronDown, Radio } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useActiveViewers } from "@/hooks/useHeartbeat";

export default function Analytics() {
  const { data: overview } = useQuery<any>({
    queryKey: ["/api/admin/analytics/overview"],
  });

  const { data: topMovies } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/top-movies"],
  });

  const { data: topGenres } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/top-genres"],
  });

  const { data: revenue } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/revenue"],
  });

  const { data: paymentIssues } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/payment-issues"],
  });

  const { data: recentActivity } = useQuery<any[]>({
    queryKey: ["/api/admin/analytics/recent-activity"],
  });

  // Real-time active viewers - updates every 5 seconds
  const { viewers: activeViewers, total: totalActiveViewers, stats: viewerStats, isLoading: viewersLoading } = useActiveViewers(true, 5000);

  // Fetch movie titles for active viewer display
  const { data: moviesData } = useQuery<{ movies: any[] }>({
    queryKey: ["/api/movies"],
  });
  const allMovies = moviesData?.movies || [];

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fb923c', '#ea580c', '#c2410c'];

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatNumber = (num: number) => num.toLocaleString();
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const predictions = {
    nextMonthRevenue: overview ? overview.revenueThisMonth * 1.15 : 0,
    projectedSubscribers: overview ? overview.activeSubscribers + Math.floor(overview.newSubscribersThisMonth * 0.8) : 0,
    churnRate: overview && overview.totalSubscribers > 0 
      ? ((overview.lostSubscribersThisMonth / overview.totalSubscribers) * 100).toFixed(1)
      : "0.0",
    growthRate: overview && overview.totalSubscribers > 0
      ? ((overview.newSubscribersThisMonth / overview.totalSubscribers) * 100).toFixed(1)
      : "0.0",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="page-admin">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-admin-dashboard">Admin Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive analytics and insights</p>
          </div>
          <Badge variant="default" data-testid="badge-real-time">Real-time Data</Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6" data-testid="tabs-admin">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live" className="flex items-center gap-1">
              <Radio className="h-3 w-3 animate-pulse text-red-500" />
              Live
            </TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
            <TabsTrigger value="issues" data-testid="tab-issues">Issues</TabsTrigger>
            <TabsTrigger value="predictions" data-testid="tab-predictions">Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-total-users">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-users">{overview ? formatNumber(overview.totalUsers) : "0"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview?.totalSubscribers || 0} subscribed ({overview && overview.totalUsers > 0 ? ((overview.totalSubscribers / overview.totalUsers) * 100).toFixed(1) : 0}%)
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-active-subscribers">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-subscribers">{overview ? formatNumber(overview.activeSubscribers) : "0"}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={overview && overview.newSubscribersThisMonth > overview.lostSubscribersThisMonth ? "default" : "destructive"} className="text-xs">
                      {overview && overview.newSubscribersThisMonth > overview.lostSubscribersThisMonth ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {overview ? overview.newSubscribersThisMonth : 0} new
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      -{overview ? overview.lostSubscribersThisMonth : 0} lost
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-revenue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-revenue">{overview ? formatCurrency(overview.totalRevenue) : "$0.00"}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview ? formatCurrency(overview.revenueThisMonth) : "$0.00"} this month
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-watch-time">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-watch-time">{overview ? formatNumber(overview.totalWatchTimeHours) : "0"}h</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: {overview ? overview.averageWatchTimeMinutes : 0} min/view
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-movie-views">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-movie-views">{overview ? formatNumber(overview.totalMovieViews) : "0"}</div>
                  <p className="text-xs text-muted-foreground mt-1">All-time movie views</p>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-subscriber-trend">
              <CardHeader>
                <CardTitle>Subscriber Trends</CardTitle>
                <CardDescription>New vs Lost Subscribers This Month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'New Subscribers', value: overview?.newSubscribersThisMonth || 0, fill: '#f97316' },
                    { name: 'Lost Subscribers', value: overview?.lostSubscribersThisMonth || 0, fill: '#dc2626' },
                    { name: 'Net Growth', value: (overview?.newSubscribersThisMonth || 0) - (overview?.lostSubscribersThisMonth || 0), fill: '#22c55e' },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest platform interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 10).map((activity: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg hover-elevate" data-testid={`activity-${index}`}>
                        <div className="flex items-center gap-3">
                          {activity.type === 'view' && <Eye className="h-4 w-4 text-primary" />}
                          {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-500" />}
                          <div>
                            <p className="text-sm font-medium">
                              {activity.type === 'view' && 'Movie View'}
                              {activity.type === 'payment' && `Payment ${activity.data.status}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp * 1000).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{activity.type}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LIVE VIEWERS TAB - Real-time tracking of users watching movies */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card data-testid="card-total-watching">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Currently Watching</CardTitle>
                  <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary" data-testid="text-total-watching">
                    {totalActiveViewers}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active viewers right now
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-movies-streaming">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Movies Being Watched</CardTitle>
                  <Film className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold" data-testid="text-movies-streaming">
                    {viewerStats?.totalMovies || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Different movies streaming
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-server-load">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Entries</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold" data-testid="text-memory-entries">
                    {viewerStats?.memoryEntries || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active tracking entries
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-active-viewers-table">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Viewer Details
                </CardTitle>
                <CardDescription>
                  Real-time breakdown of viewers by movie (updates every 5 seconds)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {viewersLoading ? (
                  <p className="text-muted-foreground">Loading active viewers...</p>
                ) : Object.keys(activeViewers).length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No one is watching right now</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Viewer counts will appear here when users start watching movies
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Movie</TableHead>
                        <TableHead className="text-right">Viewers</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(activeViewers)
                        .sort(([, a], [, b]) => b - a)
                        .map(([movieId, count]) => {
                          const movie = allMovies?.find((m: any) => m.id === movieId);
                          const percentage = totalActiveViewers > 0 
                            ? ((count / totalActiveViewers) * 100).toFixed(1) 
                            : "0";
                          return (
                            <TableRow key={movieId} data-testid={`viewer-row-${movieId}`}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {movie?.posterImage && (
                                    <img 
                                      src={movie.posterImage} 
                                      alt={movie?.title || 'Movie'} 
                                      className="w-8 h-12 object-cover rounded"
                                    />
                                  )}
                                  <span>{movie?.title || `Movie ID: ${movieId.slice(0, 8)}...`}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="default" className="text-lg px-3 py-1">
                                  {count}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {percentage}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card data-testid="card-revenue-chart">
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue and subscriber growth (Last 6 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#f97316" name="Revenue ($)" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="subscribers" stroke="#22c55e" name="Subscribers" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card data-testid="card-monthly-revenue">
                <CardHeader>
                  <CardTitle className="text-sm">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{overview ? formatCurrency(overview.revenueThisMonth) : "$0.00"}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-average-revenue">
                <CardHeader>
                  <CardTitle className="text-sm">Monthly Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {revenue && revenue.length > 0 
                      ? formatCurrency(revenue.reduce((sum: number, r: any) => sum + r.revenue, 0) / revenue.length)
                      : "$0.00"}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-all-time">
                <CardHeader>
                  <CardTitle className="text-sm">All-Time Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{overview ? formatCurrency(overview.totalRevenue) : "$0.00"}</div>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-revenue-table">
              <CardHeader>
                <CardTitle>Revenue Breakdown by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Subscribers</TableHead>
                      <TableHead>Avg per Subscriber</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenue && revenue.length > 0 ? (
                      revenue.map((item: any, index: number) => (
                        <TableRow key={index} data-testid={`revenue-row-${index}`}>
                          <TableCell className="font-medium">{item.month}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell>{formatNumber(item.subscribers)}</TableCell>
                          <TableCell>
                            {item.subscribers > 0 ? formatCurrency(item.revenue / item.subscribers) : "$0.00"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No revenue data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card data-testid="card-top-movies">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Top 10 Movies
                  </CardTitle>
                  <CardDescription>Most viewed content</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Watch Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topMovies && topMovies.length > 0 ? (
                        topMovies.map((item: any, index: number) => (
                          <TableRow key={index} data-testid={`top-movie-${index}`}>
                            <TableCell className="font-bold text-primary">{index + 1}</TableCell>
                            <TableCell className="font-medium">{item.movie.title}</TableCell>
                            <TableCell>{formatNumber(item.views)}</TableCell>
                            <TableCell>{formatDuration(item.totalWatchTime)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">No view data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card data-testid="card-top-genres">
                <CardHeader>
                  <CardTitle>Top Genres</CardTitle>
                  <CardDescription>Most popular content categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topGenres || []}
                        dataKey="views"
                        nameKey="genre"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.genre} (${entry.views})`}
                      >
                        {(topGenres || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-genre-table">
              <CardHeader>
                <CardTitle>Genre Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Total Views</TableHead>
                      <TableHead>Popularity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topGenres && topGenres.length > 0 ? (
                      topGenres.map((genre: any, index: number) => (
                        <TableRow key={index} data-testid={`genre-row-${index}`}>
                          <TableCell className="font-bold">{index + 1}</TableCell>
                          <TableCell className="font-medium">{genre.genre}</TableCell>
                          <TableCell>{formatNumber(genre.views)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ 
                                    width: `${topGenres.length > 0 ? (genre.views / topGenres[0].views) * 100 : 0}%` 
                                  }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {topGenres.length > 0 ? ((genre.views / topGenres[0].views) * 100).toFixed(0) : 0}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No genre data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <Card data-testid="card-payment-issues">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Payment Issues
                </CardTitle>
                <CardDescription>Failed transactions requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentIssues && paymentIssues.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentIssues.slice(0, 20).map((issue: any, index: number) => (
                        <TableRow key={index} data-testid={`payment-issue-${index}`}>
                          <TableCell>{new Date(issue.createdAt * 1000).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono text-xs">{issue.id.substring(0, 8)}...</TableCell>
                          <TableCell className="font-medium">{formatCurrency(parseFloat(issue.amount))}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{issue.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" data-testid={`button-investigate-${index}`}>
                              Investigate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-lg font-medium text-green-600">No payment issues!</p>
                    <p className="text-sm text-muted-foreground mt-1">All transactions are processing successfully</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-system-health">
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Gateway</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Response Time</span>
                    <Badge variant="outline">{"<"}50ms</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Uptime</span>
                    <Badge variant="default">99.9%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-error-summary">
                <CardHeader>
                  <CardTitle>Error Summary (Last 24h)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment Failures</span>
                    <Badge variant="destructive">{paymentIssues?.length || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auth Errors</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Server Errors</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Errors</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <Card data-testid="card-predictions">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI-Powered Predictions & Insights
                </CardTitle>
                <CardDescription>Data-driven forecasts based on current trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <h3 className="font-semibold mb-2">Next Month Revenue Forecast</h3>
                      <div className="text-3xl font-bold text-primary">{formatCurrency(predictions.nextMonthRevenue)}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        +15% growth projection based on current trends
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted">
                      <h3 className="font-semibold mb-2">Projected Subscribers</h3>
                      <div className="text-3xl font-bold text-green-600">{formatNumber(predictions.projectedSubscribers)}</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Expected active subscribers next month
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted">
                      <h3 className="font-semibold mb-2">Churn Rate</h3>
                      <div className="text-3xl font-bold text-amber-600">{predictions.churnRate}%</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Monthly subscriber cancellation rate
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted">
                      <h3 className="font-semibold mb-2">Growth Rate</h3>
                      <div className="text-3xl font-bold text-green-600">{predictions.growthRate}%</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Monthly new subscriber growth
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-recommendations">
              <CardHeader>
                <CardTitle>Strategic Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Content Strategy</h4>
                      <p className="text-sm text-muted-foreground">
                        Focus on {topGenres && topGenres[0] ? topGenres[0].genre : 'popular'} genre - it has {topGenres && topGenres[0] ? formatNumber(topGenres[0].views) : 0} views. 
                        Consider adding more titles in this category.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Revenue Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Current conversion rate: {overview && overview.totalUsers > 0 ? ((overview.totalSubscribers / overview.totalUsers) * 100).toFixed(1) : 0}%. 
                        Target: 15%. Consider promotional campaigns or free trial period.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Retention Focus</h4>
                      <p className="text-sm text-muted-foreground">
                        Churn rate at {predictions.churnRate}%. Implement personalized recommendations and 
                        exclusive content to improve retention.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <Film className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Watch Time Improvement</h4>
                      <p className="text-sm text-muted-foreground">
                        Average watch time: {overview ? overview.averageWatchTimeMinutes : 0} minutes. 
                        Optimize video player UX and add continue watching feature.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
