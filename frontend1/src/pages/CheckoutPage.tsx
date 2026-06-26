import { useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ordersApi, mpesaApi } from "@/lib/api";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Smartphone,
} from "lucide-react";

type Step = "form" | "paying" | "waiting" | "success" | "failed";

const POLL_INTERVAL = 3000;
const MAX_WAIT_TIME = 120000;
const RETRY_COOLDOWN = 5000;

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const retryOrderId = searchParams.get("retry");

  // ✅ ALL hooks declared at the top, before any conditional logic
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [orderId, setOrderId] = useState("");
  const [paymentResult, setPaymentResult] = useState<{ mpesaReceiptNumber?: string } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [manualConfirmOpen, setManualConfirmOpen] = useState(false);
  const [receiptInput, setReceiptInput] = useState("");
  const [confirming, setConfirming] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Handle redirects with useEffect (after all hooks)
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    if (items.length === 0 && step === "form" && !retryOrderId && token) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, step, retryOrderId, token, navigate]);

  // Handle retry from orders page
  useEffect(() => {
    if (retryOrderId && token) {
      setOrderId(retryOrderId);
      ordersApi
        .getById(token, retryOrderId)
        .then((order) => {
          const orderData = order.order || order;
          setPhone(orderData.phone?.replace("254", "0") || "");
          setAddress(orderData.deliveryAddress || "");
          handleRetryPayment(retryOrderId);
        })
        .catch(() => {
          setError("Order not found");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryOrderId]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (oid: string) => {
      waitStartTimeRef.current = Date.now();
      setElapsedTime(0);
      setCanRetry(false);
      setStep("waiting");

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - waitStartTimeRef.current;
        setElapsedTime(Math.floor(elapsed / 1000));

        if (elapsed >= RETRY_COOLDOWN) {
          setCanRetry(true);
        }

        if (elapsed >= MAX_WAIT_TIME) {
          stopPolling();
          setStep("failed");
          setFailureReason("Payment timed out. The STK push may have expired.");
        }
      }, 1000);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const response = await mpesaApi.checkPaymentStatus(token!, oid);
          const status = response.status;

          if (status === "paid") {
            stopPolling();
            clearCart();
            setStep("success");
            setPaymentResult({
              mpesaReceiptNumber: response.mpesaReceiptNumber,
            });
          } else if (status === "failed") {
            stopPolling();
            setStep("failed");
            setFailureReason(response.message || "Payment failed");
            setCanRetry(true);
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, POLL_INTERVAL);
    },
    [token, clearCart, stopPolling],
  );

  const handleCheckout = async () => {
    setError("");
    setLoading(true);
    setFailureReason("");

    try {
      let mpesaPhone = phone.replace(/\s/g, "");
      if (mpesaPhone.startsWith("0")) mpesaPhone = "254" + mpesaPhone.slice(1);
      if (!mpesaPhone.startsWith("254")) mpesaPhone = "254" + mpesaPhone;

      if (!/^254\d{9}$/.test(mpesaPhone)) {
        throw new Error("Please enter a valid phone number (e.g., 07XXXXXXXX)");
      }

      const order = await ordersApi.create(token!, {
        items: items.map((i) => ({
          product: i.productId,
          quantity: i.quantity,
        })),
        phone: mpesaPhone,
        deliveryAddress: address,
      });

      const oid = order._id || order.order?._id;
      setOrderId(oid);

      setStep("paying");
      const result = await mpesaApi.stkPush(token!, {
        orderId: oid,
        phone: mpesaPhone,
      });
      setPaymentResult(result);

      if (result.ResponseCode === "0") {
        startPolling(oid);
      } else {
        setStep("failed");
        setFailureReason(
          result.data?.ResponseDescription || "STK Push was rejected",
        );
        setCanRetry(true);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "An error occurred",
      );
      setStep("failed");
      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (oid?: string) => {
    const targetOrderId = oid || orderId;
    if (!targetOrderId) return;
    
    setError("");
    setFailureReason("");
    setLoading(true);
    setCanRetry(false);

    try {
      setStep("paying");
      const result = await mpesaApi.retryStkPush(token!, targetOrderId);
      setPaymentResult(result);

      if (result.ResponseCode === "0") {
        startPolling(targetOrderId);
      } else {
        setStep("failed");
        setFailureReason(
          result.data?.ResponseDescription || "STK Push was rejected",
        );
        setCanRetry(true);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to retry payment",
      );
      setStep("failed");
      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualConfirm = async () => {
    setConfirming(true);
    try {
      await mpesaApi.manualConfirm(token!, {
        orderId,
        receiptNumber: receiptInput,
      });
      stopPolling();
      clearCart();
      setPaymentResult({ mpesaReceiptNumber: receiptInput });
      setStep("success");
      setManualConfirmOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setConfirming(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ✅ Guard clauses for rendering (not before hooks)
  if (!token || (items.length === 0 && step === "form" && !retryOrderId)) {
    return (
      <Layout>
        <div className="container max-w-lg py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-lg py-16 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {step === "form" && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                M-Pesa Payment
              </h2>
              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  required
                  type="tel"
                />
                <p className="text-xs text-muted-foreground">
                  The M-Pesa prompt will be sent to this number
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nairobi CBD, Near Kencom"
                  required
                />
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 space-y-3">
              <h2 className="font-display font-bold">Order Summary</h2>
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    KSh {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">
                  KSh {total.toLocaleString()}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </p>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={loading || !phone || !address}
              onClick={handleCheckout}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Pay KSh {total.toLocaleString()} with M-Pesa
            </Button>
          </div>
        )}

        {step === "paying" && (
          <div className="text-center space-y-4 py-12">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-bold">Sending M-Pesa Prompt...</h2>
            <p className="text-muted-foreground">
              Please wait while we send the STK push to your phone.
            </p>
          </div>
        )}

        {step === "waiting" && (
          <div className="text-center space-y-6 py-8">
            <div className="relative inline-block">
              <Smartphone className="w-16 h-16 text-primary mx-auto animate-pulse" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {formatTime(elapsedTime)}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold">Check Your Phone</h2>
              <p className="text-muted-foreground">
                An M-Pesa prompt has been sent to <strong>{phone}</strong>.
                <br />
                Enter your PIN to complete the payment.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-4 text-left text-sm space-y-2">
              <p className="font-medium">What to do:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open M-Pesa on your phone</li>
                <li>You should see an STK push notification</li>
                <li>Enter your M-Pesa PIN</li>
                <li>Wait for confirmation here</li>
              </ol>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Waiting for payment confirmation...</span>
            </div>

            {canRetry && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the prompt? You can try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    stopPolling();
                    handleRetryPayment();
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Resend M-Pesa Prompt
                </Button>
                <p className="text-xs text-muted-foreground">
                  If you already paid and got an M-Pesa confirmation message,{" "}
                  <button
                    className="text-primary underline hover:no-underline"
                    onClick={() => setManualConfirmOpen(true)}
                  >
                    confirm payment manually
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-4 py-8">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-success">
                Payment Successful!
              </h2>
              <p className="text-muted-foreground">
                Your payment has been confirmed and your order is being
                processed.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-5 text-left space-y-3">
              <h3 className="font-bold">Payment Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono font-medium">{orderId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">M-Pesa Receipt</p>
                  <p className="font-mono font-medium text-success">
                    {paymentResult?.mpesaReceiptNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-medium">KSh {total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{phone}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={() => navigate("/orders")}>
                View My Orders
              </Button>
              <Button variant="outline" onClick={() => navigate("/products")}>
                Continue Shopping
              </Button>
            </div>
          </div>
        )}

        {step === "failed" && (
          <div className="text-center space-y-4 py-8">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">
                Payment Failed
              </h2>
              <p className="text-muted-foreground">
                {failureReason || error || "The payment could not be completed."}
              </p>
            </div>

            {orderId && (
              <div className="bg-card border rounded-lg p-4 text-left text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Order ID: </span>
                  <span className="font-mono">{orderId}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This order has been saved. You can retry payment from your
                  orders page or click the button below.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {orderId && (
                <Button onClick={() => handleRetryPayment()} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Retry Payment
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  stopPolling();
                  setStep("form");
                  setError("");
                  setFailureReason("");
                }}
              >
                Go Back
              </Button>
              <Button variant="ghost" onClick={() => navigate("/orders")}>
                View Orders
              </Button>
            </div>
          </div>
        )}

        {/* Manual Confirm Modal */}
        {manualConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border rounded-lg p-6 max-w-sm w-full space-y-4">
              <h3 className="font-bold text-lg">Confirm Payment Manually</h3>
              <p className="text-sm text-muted-foreground">
                Enter the M-Pesa confirmation code (e.g., SHK4X7Y9Z2) from your phone's M-Pesa message.
              </p>
              {error && (
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </p>
              )}
              <Input
                placeholder="e.g., SHK4X7Y9Z2"
                value={receiptInput}
                onChange={(e) => {
                  setError("");
                  setReceiptInput(e.target.value.toUpperCase());
                }}
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={!receiptInput || confirming}
                  onClick={handleManualConfirm}
                >
                  {confirming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setManualConfirmOpen(false);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CheckoutPage;