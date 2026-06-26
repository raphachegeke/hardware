import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ordersApi } from "@/lib/api";
import Layout from "@/components/Layout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  RotateCcw,
  CheckCircle,
  XCircle,
  Truck,
  Ban,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const OrdersPage = () => {
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      navigate("/login");
      return;
    }
    if (token) {
      fetchOrders();
    }
  }, [token, authLoading]);

  const fetchOrders = () => {
    setLoading(true);
    ordersApi
      .getMy(token!)
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleRetry = (orderId: string) => {
    setRetryingId(orderId);
    setTimeout(() => {
      navigate(`/checkout?retry=${orderId}`);
    }, 300);
  };

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase()?.trim();
    
    if (s === "paid") {
      return {
        label: "Paid",
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        icon: <CheckCircle className="w-3 h-3" />,
      };
    }
    if (s === "delivered") {
      return {
        label: "Delivered",
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        icon: <Truck className="w-3 h-3" />,
      };
    }
    if (s === "failed") {
      return {
        label: "Payment Failed",
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        icon: <XCircle className="w-3 h-3" />,
      };
    }
    if (s === "cancelled") {
      return {
        label: "Cancelled",
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        icon: <Ban className="w-3 h-3" />,
      };
    }
    // Default = pending, undefined, null, or anything else
    return {
      label: "Pending",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-700 dark:text-yellow-400",
      icon: <Clock className="w-3 h-3" />,
    };
  };

  // Show retry for anything that's NOT paid/delivered/cancelled
  const canRetryPayment = (status: string) => {
    const s = status?.toLowerCase()?.trim();
    const finalStatuses = ["paid", "delivered", "cancelled"];
    return !finalStatuses.includes(s);
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-12 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground mb-8">
          Track your orders and retry failed payments.
        </p>

        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No orders yet</h3>
            <p className="text-muted-foreground mb-6">
              When you place an order, it will appear here.
            </p>
            <Button onClick={() => navigate("/products")}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const statusConfig = getStatusConfig(order.status);
              const showRetry = canRetryPayment(order.status);

              return (
                <div
                  key={order._id}
                  className="bg-card border rounded-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 pb-3 border-b">
                    <div>
                      <p className="font-mono text-sm font-medium">
                        #{order._id?.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
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
                      className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="p-4 pb-3 space-y-2">
                    {order.items?.map((item: any, idx: number) => {
                      const name = item.product?.name || item.name || "Product";
                      const price = item.product?.price || item.price || 0;
                      const qty = item.quantity || 1;
                      const image = item.product?.image || item.image;

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 text-sm"
                        >
                          {image && (
                            <img
                              src={image}
                              alt={name}
                              className="w-10 h-10 rounded object-cover bg-muted"
                            />
                          )}
                          {!image && (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              KSh {price.toLocaleString()} × {qty}
                            </p>
                          </div>
                          <span className="font-medium whitespace-nowrap">
                            KSh {(price * qty).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-muted/30 space-y-3">
                    {/* Paid - show receipt */}
                    {order.status === "paid" && order.mpesaReceiptNumber && (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>
                          M-Pesa Receipt:{" "}
                          <span className="font-mono font-medium">
                            {order.mpesaReceiptNumber}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Failed - show error + retry button */}
                    {order.status === "failed" && (
                      <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          {order.lastPaymentError || "Payment was not completed."}
                        </span>
                      </div>
                    )}

                    {/* Pending - show notice */}
                    {(!order.status || order.status === "pending") && (
                      <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Payment not yet completed. Tap retry to pay.
                        </span>
                      </div>
                    )}

                    {/* Delivery address */}
                    {order.deliveryAddress && (
                      <p className="text-xs text-muted-foreground">
                        📍 {order.deliveryAddress}
                      </p>
                    )}

                    {/* Total + Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Total
                        </span>
                        <p className="text-lg font-bold text-primary">
                          KSh {order.totalAmount?.toLocaleString() || "—"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 👇 RETRY BUTTON - now shows for pending/failed/undefined */}
                        {showRetry && (
                          <Button
                            size="sm"
                            onClick={() => handleRetry(order._id)}
                            disabled={retryingId === order._id}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            {retryingId === order._id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                Retry Payment
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;