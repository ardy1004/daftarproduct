import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Box, 
  Star, 
  MousePointer, 
  TrendingUp,
  Plus,
  Upload,
  Settings,
  BarChart3,
  Home,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useProducts, useFeaturedProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const { data: products = [] } = useProducts();
  const { data: featuredProducts = [] } = useFeaturedProducts();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLocation('/admin/login');
        return;
      }
      
      setUser(session.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      setLocation('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
      setLocation('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Please try again"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Mock stats - in real implementation, fetch from analytics API
  const stats = {
    totalProducts: products.length,
    featuredProducts: featuredProducts.length,
    totalClicks: 45678,
    revenue: 'Rp 2.4M'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald to-metallic rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your e-commerce platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="flex items-center space-x-2"
                data-testid="button-view-site"
              >
                <Home className="h-4 w-4" />
                <span>View Site</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-destructive hover:text-destructive"
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-emerald" data-testid="stat-total-products">
                    {stats.totalProducts}
                  </p>
                </div>
                <Box className="h-8 w-8 text-emerald" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Featured Products</p>
                  <p className="text-2xl font-bold text-metallic" data-testid="stat-featured-products">
                    {stats.featuredProducts}
                  </p>
                </div>
                <Star className="h-8 w-8 text-metallic" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Clicks</p>
                  <p className="text-2xl font-bold text-violet" data-testid="stat-total-clicks">
                    {stats.totalClicks.toLocaleString()}
                  </p>
                </div>
                <MousePointer className="h-8 w-8 text-violet" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Revenue</p>
                  <p className="text-2xl font-bold text-yellow" data-testid="stat-revenue">
                    {stats.revenue}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Box className="h-5 w-5 text-emerald mr-2" />
                    Product Management
                  </span>
                  <div className="flex space-x-2">
                    <Button className="bg-emerald hover:bg-emerald/90" data-testid="button-add-product">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <Button variant="outline" data-testid="button-import-products">
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Product management interface will be implemented here.
                  <br />
                  Features: CRUD operations, bulk actions, CSV import/export
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 text-yellow mr-2" />
                  Featured Products Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {featuredProducts.length > 0 ? (
                  <div className="space-y-4">
                    {featuredProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={product.imageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center'} 
                            alt={product.productName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <h3 className="font-medium" data-testid={`featured-product-name-${product.id}`}>
                              {product.productName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Order: {product.featuredOrder || 0}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-remove-featured-${product.id}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No featured products</p>
                    <Button className="mt-4" data-testid="button-add-featured">
                      Add Featured Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-violet mr-2" />
                    Product Analytics
                  </span>
                  <div className="flex space-x-2">
                    <select className="px-3 py-2 bg-background border border-border rounded-lg text-sm">
                      <option>1 hari</option>
                      <option>7 hari</option>
                      <option>1 bulan</option>
                    </select>
                    <Button variant="outline" size="sm" data-testid="button-reset-analytics">
                      Reset
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Analytics charts will be implemented here</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Real-time product performance metrics and click tracking
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 text-metallic mr-2" />
                  Platform Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Platform settings interface will be implemented here.
                  <br />
                  Features: Category filter toggle, site configuration, user management
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
