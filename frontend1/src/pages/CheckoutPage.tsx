import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ordersApi, mpesaApi } from "@/lib/api";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "paying" | "success" | "failed">("form");
  const [orderId, setOrderId] = useState("");
  const [paymentResult, setPaymentResult] = useState<any>(null);

  if (!token) {
    navigate("/login");
    return null;
  }

  if (items.length === 0 && step === "form") {
    navigate("/cart");
    return null;
  }

  const handleCheckout = async () => {
    setError("");
    setLoading(true);
    try {
      // Format phone for M-Pesa (254...)
      let mpesaPhone = phone.replace(/\s/g, "");
      if (mpesaPhone.startsWith("0")) mpesaPhone = "254" + mpesaPhone.slice(1);
      if (!mpesaPhone.startsWith("254")) mpesaPhone = "254" + mpesaPhone;

      // Create order
      const order = await ordersApi.create(token!, {
        items: items.map((i) => ({ product: i.productId, quantity: i.quantity })),
        phone: mpesaPhone,
        deliveryAddress: address,
      });

      const oid = order._id || order.order?._id;
      setOrderId(oid);
      setStep("paying");

      // Trigger STK Push
      const result = await mpesaApi.stkPush(token!, { orderId: oid, phone: mpesaPhone });
      setPaymentResult(result);
      setStep("success");
      clearCart();
    } catch (err: any) {
      setError(err.message);
      setStep("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-lg py-16 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {step === "form" && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold">Delivery Details</h2>
              <div className="space-y-2">
                <Label>M-Pesa Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" required />
              </div>
              <div className="space-y-2">
                <Label>Delivery Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nairobi CBD" required />
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 space-y-3">
              <h2 className="font-display font-bold">Order Summary</h2>
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-medium">KSh {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">KSh {total.toLocaleString()}</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}

            <Button className="w-full" size="lg" disabled={loading || !phone || !address} onClick={handleCheckout}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Pay with M-Pesa
            </Button>
          </div>
        )}

        {step === "paying" && (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-bold">Processing Payment</h2>
            <p className="text-muted-foreground">Check your phone for the M-Pesa STK prompt and enter your PIN.</p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="w-16 h-16 text-success mx-auto" />
            <h2 className="text-xl font-bold">Payment Initiated!</h2>
            <p className="text-muted-foreground">An M-Pesa STK push has been sent to your phone. Enter your PIN to complete payment.</p>
            {paymentResult && (
              <div className="bg-card border rounded-lg p-4 text-left text-sm space-y-1 mt-4">
                <p><strong>Order ID:</strong> {orderId}</p>
                {paymentResult.CheckoutRequestID && <p><strong>Checkout Request:</strong> {paymentResult.CheckoutRequestID}</p>}
                {paymentResult.ResponseDescription && <p><strong>Status:</strong> {paymentResult.ResponseDescription}</p>}
              </div>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <Button onClick={() => navigate("/orders")}>View My Orders</Button>
              <Button variant="outline" onClick={() => navigate("/products")}>Continue Shopping</Button>
            </div>
          </div>
        )}

        {step === "failed" && (
          <div className="text-center space-y-4 py-8">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Payment Failed</h2>
            <p className="text-destructive">{error}</p>
            <Button onClick={() => { setStep("form"); setError(""); }}>Try Again</Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CheckoutPage;
