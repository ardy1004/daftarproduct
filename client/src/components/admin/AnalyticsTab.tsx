import { useState } from 'react';
import { useAnalytics, Period } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function AnalyticsTab() {
  const [period, setPeriod] = useState<Period>('all');
  const { data: analytics, isLoading, refetch } = useAnalytics(period);

  const handlePeriodChange = (value: Period) => {
    if (value) setPeriod(value);
  };

  const handleReset = () => {
    // Set the period back to 'all'
    setPeriod('all');
    // Explicitly refetch to ensure the latest data is loaded, fulfilling the "Refresh" action.
    // TanStack Query is smart enough to not cause a double-fetch if the query key hasn't changed.
    refetch();
  };

  const StatCard = ({ title, value }: { title: string, value: number | undefined }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <div className="h-8 w-24 bg-muted rounded animate-pulse" /> : value?.toLocaleString() || 0}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ToggleGroup type="single" value={period} onValueChange={handlePeriodChange} aria-label="Select period">
          <ToggleGroupItem value="1d" aria-label="Last 1 day">1D</ToggleGroupItem>
          <ToggleGroupItem value="7d" aria-label="Last 7 days">7D</ToggleGroupItem>
          <ToggleGroupItem value="30d" aria-label="Last 30 days">30D</ToggleGroupItem>
          <ToggleGroupItem value="all" aria-label="All time">All</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" size="sm" onClick={handleReset} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Reset / Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={analytics?.totalProducts} />
        <StatCard title="Total Affiliate Clicks" value={analytics?.totalClicks} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 text-violet mr-2" />
            Top 10 Most Clicked Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : analytics?.topProducts && analytics.topProducts.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rank</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Total Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topProducts.map((product, index) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell className="text-right font-bold">{product.click_count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4" />
              <p>No click data available for this period.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}