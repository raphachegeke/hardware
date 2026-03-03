import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { productsApi, categoriesApi } from "@/lib/api";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";

const CategoryProductsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [products, setProducts] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productsApi.getAll(), categoriesApi.getAll()])
      .then(([prods, cats]) => {
        const arr = Array.isArray(prods) ? prods : [];
        const filtered = arr.filter((p: any) => {
          const catId = typeof p.category === "object" ? p.category?._id : p.category;
          return catId === id;
        });
        setProducts(filtered);
        const cat = (Array.isArray(cats) ? cats : []).find((c: any) => c._id === id);
        if (cat) setCategoryName(cat.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-2">{categoryName || "Category"}</h1>
        <p className="text-muted-foreground mb-8">{products.length} product{products.length !== 1 ? "s" : ""} found</p>
        {loading ? <LoadingSpinner /> : products.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoryProductsPage;
