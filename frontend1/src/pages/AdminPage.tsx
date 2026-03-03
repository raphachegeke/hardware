import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { productsApi, categoriesApi, ordersApi } from "@/lib/api";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2, Plus, Package, LayoutGrid, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const AdminPage = () => {
  const { token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Product form
  const [pForm, setPForm] = useState({ name: "", description: "", price: "", stock: "", images: "", category: "", featured: false });
  const [pLoading, setPLoading] = useState(false);

  // Category form
  const [cForm, setCForm] = useState({ name: "", description: "", image: "" });
  const [cLoading, setCLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!token || !isAdmin)) { navigate("/"); return; }
    if (token) fetchAll();
  }, [token, authLoading, isAdmin]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prods, cats, ords] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        ordersApi.getAll(token!),
      ]);
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setOrders(Array.isArray(ords) ? ords : []);
    } catch { }
    setLoading(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setPLoading(true);
    try {
      await productsApi.create(token!, {
        name: pForm.name,
        description: pForm.description,
        price: Number(pForm.price),
        stock: Number(pForm.stock),
        images: pForm.images.split(",").map((s) => s.trim()).filter(Boolean),
        category: pForm.category,
        featured: pForm.featured,
      });
      toast.success("Product created!");
      setPForm({ name: "", description: "", price: "", stock: "", images: "", category: "", featured: false });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
    setPLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productsApi.delete(token!, id);
      toast.success("Product deleted");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCLoading(true);
    try {
      await categoriesApi.create(token!, cForm);
      toast.success("Category created!");
      setCForm({ name: "", description: "", image: "" });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message);
    }
    setCLoading(false);
  };

  if (authLoading || loading) return <Layout><div className="container py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container py-12 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-1"><Package className="w-4 h-4" /> Products</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1"><LayoutGrid className="w-4 h-4" /> Categories</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1"><ClipboardList className="w-4 h-4" /> Orders</TabsTrigger>
          </TabsList>

          {/* Products */}
          <TabsContent value="products" className="space-y-8">
            <form onSubmit={handleCreateProduct} className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> Add Product</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input value={pForm.name} onChange={(e) => setPForm((p) => ({ ...p, name: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Price (KSh)</Label><Input type="number" value={pForm.price} onChange={(e) => setPForm((p) => ({ ...p, price: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Stock</Label><Input type="number" value={pForm.stock} onChange={(e) => setPForm((p) => ({ ...p, stock: e.target.value }))} required /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={pForm.category} onValueChange={(v) => setPForm((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2"><Label>Description</Label><Input value={pForm.description} onChange={(e) => setPForm((p) => ({ ...p, description: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Image URLs (comma separated)</Label><Input value={pForm.images} onChange={(e) => setPForm((p) => ({ ...p, images: e.target.value }))} /></div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="featured" checked={pForm.featured} onChange={(e) => setPForm((p) => ({ ...p, featured: e.target.checked }))} />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>
              <Button type="submit" disabled={pLoading}>{pLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Product</Button>
            </form>

            <div className="space-y-3">
              <h2 className="font-display font-bold">All Products ({products.length})</h2>
              {products.map((p) => (
                <div key={p._id} className="flex items-center justify-between bg-card border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0] || "/placeholder.svg"} alt={p.name} className="w-12 h-12 rounded-md object-cover bg-muted" />
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">KSh {p.price?.toLocaleString()} • Stock: {p.stock}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProduct(p._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories" className="space-y-8">
            <form onSubmit={handleCreateCategory} className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold flex items-center gap-2"><Plus className="w-5 h-5" /> Add Category</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input value={cForm.name} onChange={(e) => setCForm((p) => ({ ...p, name: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Image URL</Label><Input value={cForm.image} onChange={(e) => setCForm((p) => ({ ...p, image: e.target.value }))} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Description</Label><Input value={cForm.description} onChange={(e) => setCForm((p) => ({ ...p, description: e.target.value }))} /></div>
              </div>
              <Button type="submit" disabled={cLoading}>{cLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Category</Button>
            </form>

            <div className="space-y-3">
              <h2 className="font-display font-bold">All Categories ({categories.length})</h2>
              {categories.map((c) => (
                <div key={c._id} className="flex items-center gap-3 bg-card border rounded-lg p-4">
                  {c.image && <img src={c.image} alt={c.name} className="w-12 h-12 rounded-md object-cover bg-muted" />}
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="font-display font-bold">All Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet.</p>
            ) : orders.map((order: any) => (
              <div key={order._id} className="bg-card border rounded-lg p-5 space-y-2">
                <div className="flex justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Order #{order._id?.slice(-8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                    {order.user && <p className="text-xs text-muted-foreground">User: {order.user.name || order.user.email || order.user}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full h-fit ${
                    order.status === "delivered" ? "bg-success/10 text-success" :
                    order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning-foreground"
                  }`}>{order.status || "pending"}</span>
                </div>
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product?.name || "Product"} × {item.quantity}</span>
                    <span>KSh {((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold text-sm">
                  <span>Total: KSh {order.totalAmount?.toLocaleString() || "—"}</span>
                  <span>Payment: {order.paymentStatus || "pending"}</span>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPage;
