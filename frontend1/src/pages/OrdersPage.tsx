import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ordersApi } from "@/lib/api";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { Package, Clock } from "lucide-react";

const OrdersPage = () => {
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) { navigate("/login"); return; }
    if (token) {
      ordersApi.getMy(token)
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [token, authLoading]);

  return (
    <Layout>
      <div className="container py-12 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div key={order._id} className="bg-card border rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Order #{order._id?.slice(-8)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    order.status === "delivered" ? "bg-success/10 text-success" :
                    order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                    "bg-warning/10 text-warning-foreground"
                  }`}>
                    {order.status || "pending"}
                  </span>
                </div>
                <div className="space-y-1">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.product?.name || "Product"} × {item.quantity}</span>
                      <span className="font-medium">KSh {((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">KSh {order.totalAmount?.toLocaleString() || "—"}</span>
                </div>
                {order.paymentStatus && (
                  <p className="text-xs text-muted-foreground">Payment: <span className="capitalize">{order.paymentStatus}</span></p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;
