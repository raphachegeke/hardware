import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { productsApi, categoriesApi, ordersApi } from "@/lib/api";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2, Plus, Package, LayoutGrid, ClipboardList, Search, CheckCircle, XCircle, Clock, Truck, Ban, Smartphone } from "lucide-react";
import { toast } from "sonner";

const AdminPage = () => {
  const { token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) return false;

      // Search filter
      if (!query) return true;

      const orderId = order._id?.toLowerCase() || "";
      const shortId = orderId.slice(-8);
      const userName = order.user?.name?.toLowerCase() || "";
      const userEmail = order.user?.email?.toLowerCase() || "";
      const userPhone = order.phone?.toLowerCase() || "";
      const receipt = order.mpesaReceiptNumber?.toLowerCase() || "";

      // Search by order number, name, email, phone, or receipt
      return (
        orderId.includes(query) ||
        shortId.includes(query) ||
        userName.includes(query) ||
        userEmail.includes(query) ||
        userPhone.includes(query) ||
        receipt.includes(query)
      );
    });
  }, [orders, searchQuery, statusFilter]);

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

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase()?.trim();
    switch (s) {
      case "paid":
        return { label: "Paid", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: <CheckCircle className="w-3 h-3" /> };
      case "delivered":
        return { label: "Delivered", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: <Truck className="w-3 h-3" /> };
      case "cancelled":
        return { label: "Cancelled", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: <Ban className="w-3 h-3" /> };
      case "failed":
        return { label: "Failed", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: <XCircle className="w-3 h-3" /> };
      default:
        return { label: "Pending", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: <Clock className="w-3 h-3" /> };
    }
  };

  if (authLoading || loading) return <Layout><div className="container py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container max-w-5xl py-12 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-1"><Package className="w-4 h-4" /> Products</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1"><LayoutGrid className="w-4 h-4" /> Categories</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1"><ClipboardList className="w-4 h-4" /> Orders</TabsTrigger>
          </TabsList>

          {/* ==================== PRODUCTS ==================== */}
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

          {/* ==================== CATEGORIES ==================== */}
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

          {/* ==================== ORDERS ==================== */}
          <TabsContent value="orders" className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <button
                  className="text-primary hover:underline text-xs"
                  onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-card border rounded-lg">
                <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "No orders match your search."
                    : "No orders yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order: any) => {
                  const statusBadge = getStatusBadge(order.status);
                  const user = order.user || {};

                  return (
                    <div
                      key={order._id}
                      className="bg-card border rounded-lg overflow-hidden"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between p-4 pb-3 border-b bg-muted/20">
                        <div className="space-y-0.5">
                          <p className="font-mono text-sm font-bold">
                            #{order._id?.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          {statusBadge.icon}
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="px-4 py-3 border-b grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Customer</p>
                          <p className="font-medium">{user.name || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium truncate">{user.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium">{order.phone || user.phone || "—"}</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="px-4 py-3 border-b">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-muted-foreground border-b">
                              <th className="text-left pb-2 font-medium">Product</th>
                              <th className="text-center pb-2 font-medium w-16">Qty</th>
                              <th className="text-right pb-2 font-medium w-28">Price</th>
                              <th className="text-right pb-2 font-medium w-28">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items?.map((item: any, idx: number) => {
                              const name = item.product?.name || item.name || "Product";
                              const price = item.product?.price || item.price || 0;
                              const qty = item.quantity || 1;
                              const image = item.product?.image || item.image;

                              return (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="py-2">
                                    <div className="flex items-center gap-2">
                                      {image && (
                                        <img
                                          src={image}
                                          alt={name}
                                          className="w-8 h-8 rounded object-cover bg-muted"
                                        />
                                      )}
                                      <span className="truncate max-w-[200px]">{name}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 text-center">{qty}</td>
                                  <td className="py-2 text-right text-muted-foreground">
                                    KSh {price.toLocaleString()}
                                  </td>
                                  <td className="py-2 text-right font-medium">
                                    KSh {(price * qty).toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Order Footer */}
                      <div className="px-4 py-3 bg-muted/30 space-y-2">
                        {/* Delivery address */}
                        {order.deliveryAddress && (
                          <p className="text-xs text-muted-foreground">
                            📍 Delivery: {order.deliveryAddress}
                          </p>
                        )}

                        {/* M-Pesa receipt */}
                        {order.mpesaReceiptNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                            <Smartphone className="w-3 h-3" />
                            <span>
                              Receipt:{" "}
                              <span className="font-mono font-medium">
                                {order.mpesaReceiptNumber}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Error */}
                        {order.status === "failed" && order.lastPaymentError && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            ⚠️ {order.lastPaymentError}
                          </p>
                        )}

                        {/* Total */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <span className="text-sm font-medium">Total</span>
                          <span className="text-xl font-bold text-primary">
                            KSh {order.totalAmount?.toLocaleString() || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPage;