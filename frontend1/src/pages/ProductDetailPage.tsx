import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { productsApi } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { ShoppingCart, PackageX, Minus, Plus } from "lucide-react";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    if (id) {
      productsApi.getOne(id)
        .then((data) => setProduct(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!product) return <Layout><div className="container py-16 text-center text-muted-foreground">Product not found.</div></Layout>;

  const outOfStock = product.stock <= 0;
  const img = product.images?.[0] || "/placeholder.svg";
  const catName = typeof product.category === "object" ? product.category?.name : "";

  return (
    <Layout>
      <div className="container py-12 animate-fade-in">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
            <img src={img} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6">
            {catName && <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{catName}</span>}
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{product.description}</p>
            <p className="text-3xl font-bold text-primary">KSh {product.price?.toLocaleString()}</p>
            {outOfStock ? (
              <div className="flex items-center gap-2 text-destructive"><PackageX className="w-5 h-5" /> Out of stock</div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{product.stock} units available</p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="w-4 h-4" /></Button>
                  <span className="font-bold text-lg w-8 text-center">{qty}</span>
                  <Button variant="outline" size="icon" onClick={() => setQty(Math.min(product.stock, qty + 1))}><Plus className="w-4 h-4" /></Button>
                </div>
                <Button size="lg" onClick={() => addItem({ productId: product._id, name: product.name, price: product.price, image: img, stock: product.stock }, qty)}>
                  <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;
