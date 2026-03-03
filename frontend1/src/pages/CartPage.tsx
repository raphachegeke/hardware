import { useCart } from "@/context/CartContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const CartPage = () => {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center animate-fade-in">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Browse our products and add items to your cart.</p>
          <Button asChild><Link to="/products">Shop Now</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4 bg-card border rounded-lg p-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-md object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                  <p className="text-primary font-bold">KSh {item.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.productId)}><Trash2 className="w-4 h-4" /></Button>
                  <span className="text-sm font-bold">KSh {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-card border rounded-lg p-6 h-fit space-y-4">
            <h2 className="font-display font-bold text-lg">Order Summary</h2>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-bold">KSh {total.toLocaleString()}</span></div>
            <Button className="w-full" size="lg" asChild><Link to="/checkout">Proceed to Checkout</Link></Button>
            <Button variant="outline" className="w-full" onClick={clearCart}>Clear Cart</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
