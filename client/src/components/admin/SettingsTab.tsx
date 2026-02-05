import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings"; // Assuming BarChart3 is not used elsewhere
import { useToast } from "@/hooks/use-toast";
import { Facebook, MonitorSmartphone } from 'lucide-react';

const settingsFormSchema = z.object({
  facebook_pixel_id: z.string().optional(),
  google_analytics_id: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function SettingsTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      facebook_pixel_id: '',
      google_analytics_id: '',
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        facebook_pixel_id: settings.facebook_pixel_id || '',
        google_analytics_id: settings.google_analytics_id || '',
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings.mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Tracking settings have been updated." });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking Settings</CardTitle>
        <CardDescription>
          Manage your marketing and analytics tracking IDs here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading settings...</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="facebook_pixel_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook Pixel ID
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your Facebook Pixel ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      This ID will be used to track events with Facebook Pixel.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="google_analytics_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <MonitorSmartphone className="h-4 w-4 mr-2" />
                      Google Analytics ID
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your G- or UA- ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      This ID will be used for Google Analytics tracking.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}