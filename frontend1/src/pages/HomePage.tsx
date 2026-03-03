import { useEffect, useState } from "react";
import { categoriesApi, productsApi } from "@/lib/api";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Wrench, Zap, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([categoriesApi.getAll(), productsApi.getAll()])
      .then(([cats, prods]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        const arr = Array.isArray(prods) ? prods : [];
        setFeatured(arr.filter((p: any) => p.featured).slice(0, 8));
        if (arr.filter((p: any) => p.featured).length === 0) setFeatured(arr.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      {/* Hero */}
      <section className="gradient-primary text-primary-foreground">
        <div className="container py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">Quality Hardware,<br />Delivered Fast.</h1>
            <p className="text-lg opacity-90">Nairobi's trusted source for construction, electrical, and plumbing supplies. Shop online and pay with M-Pesa.</p>
            <div className="flex gap-3 flex-wrap">
              <Button size="lg" variant="secondary" asChild><Link to="/products">Shop Now <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/categories">Browse Categories</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Wrench, title: "Premium Tools", desc: "Top-brand hand & power tools" },
            { icon: Zap, title: "Fast Delivery", desc: "Same-day delivery in Nairobi" },
            { icon: HardHat, title: "Expert Support", desc: "Trade-certified staff advice" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4 p-5 rounded-lg bg-card border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><f.icon className="w-5 h-5 text-primary" /></div>
              <div><h3 className="font-display font-semibold">{f.title}</h3><p className="text-sm text-muted-foreground">{f.desc}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Shop by Category</h2>
            <Link to="/categories" className="text-sm text-primary hover:underline flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat: any) => (
              <Link key={cat._id} to={`/categories/${cat._id}`} className="group bg-card border rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                {cat.image && <img src={cat.image} alt={cat.name} className="w-full aspect-square object-cover rounded-md mb-3 group-hover:scale-105 transition-transform" />}
                <h3 className="font-display font-semibold text-sm">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {loading ? <LoadingSpinner /> : featured.length > 0 && (
        <section className="container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link to="/products" className="text-sm text-primary hover:underline flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((p: any) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </Layout>
  );
};

export default HomePage;
