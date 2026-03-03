import { useEffect, useState } from "react";
import { categoriesApi } from "@/lib/api";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    categoriesApi.getAll()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-8">Categories</h1>
        {loading && <LoadingSpinner />}
        {error && <p className="text-destructive">{error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div key={cat._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/categories/${cat._id}`} className="group block bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {cat.image && <img src={cat.image} alt={cat.name} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />}
                <div className="p-4">
                  <h2 className="font-display font-semibold">{cat.name}</h2>
                  {cat.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default CategoriesPage;
