import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export type Period = '1d' | '7d' | '30d' | 'all';

const getStartDate = (period: Period) => {
  const now = new Date();
  switch (period) {
    case '1d':
      now.setDate(now.getDate() - 1);
      return now;
    case '7d':
      now.setDate(now.getDate() - 7);
      return now;
    case '30d':
      now.setDate(now.getDate() - 30);
      return now;
    case 'all':
    default:
      return null;
  }
};

export function useAnalytics(period: Period = 'all') {
  const startDate = getStartDate(period);
  const startDateString = startDate ? startDate.toISOString() : null;

  const fetchAnalyticsData = async () => {
    const [totalProductsRes, totalClicksRes, topProductsRes] = await Promise.all([
      supabase.rpc('get_total_products_by_period', { start_date: startDateString }),
      supabase.rpc('get_total_clicks_by_period', { start_date: startDateString }),
      supabase.rpc('get_product_click_counts_by_period', { start_date: startDateString })
    ]);

    if (totalProductsRes.error) throw new Error(`Failed to fetch total products: ${totalProductsRes.error.message}`);
    if (totalClicksRes.error) throw new Error(`Failed to fetch total clicks: ${totalClicksRes.error.message}`);
    if (topProductsRes.error) throw new Error(`Failed to fetch top products: ${topProductsRes.error.message}`);

    return {
      totalProducts: totalProductsRes.data,
      totalClicks: totalClicksRes.data,
      topProducts: topProductsRes.data || [],
    };
  };

  return useQuery({
    queryKey: ['analytics', period],
    queryFn: fetchAnalyticsData,
  });
}
