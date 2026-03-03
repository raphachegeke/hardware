import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    productsApi.getAll()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">All Products</h1>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;
