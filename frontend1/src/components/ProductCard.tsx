import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, PackageX } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Props {
  product: any;
}

const ProductCard = ({ product }: Props) => {
  const { addItem } = useCart();
  const outOfStock = product.stock <= 0;
  const img = product.images?.[0] || "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
    >
      <Link to={`/products/${product._id}`} className="block aspect-square overflow-hidden bg-muted">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </Link>
      <div className="p-4 space-y-2">
        <Link to={`/products/${product._id}`} className="font-display font-semibold text-sm leading-tight hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </Link>
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-lg text-primary">KSh {product.price?.toLocaleString()}</span>
          {outOfStock ? (
            <span className="flex items-center gap-1 text-xs text-destructive font-medium"><PackageX className="w-3 h-3" /> Out of stock</span>
          ) : (
            <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full"
          disabled={outOfStock}
          onClick={() => addItem({ productId: product._id, name: product.name, price: product.price, image: img, stock: product.stock })}
        >
          <ShoppingCart className="w-4 h-4 mr-1" /> {outOfStock ? "Unavailable" : "Add to Cart"}
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
