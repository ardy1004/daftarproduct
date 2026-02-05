import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Settings {
  id: string;
  show_category_filter: boolean;
  updated_at: string;
  facebook_pixel_id?: string | null;
  google_analytics_id?: string | null;
}

// The settings row has a fixed ID for simplicity, ensure this row exists in your DB.
// You can create it with: INSERT INTO settings (id) VALUES ('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed');
const SETTINGS_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

export function useSettings() {
  return useQuery<Settings | null>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = 'exact-one-row-not-found'
        throw new Error(error.message);
      }

      return data;
    }
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSettings: Partial<Omit<Settings, 'id' | 'updated_at'>>) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ id: SETTINGS_ID, ...newSettings })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}