import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Layout>
      <div className="container max-w-md py-16 animate-fade-in">
        <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border">
          {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>}
          <div className="space-y-2"><Label>Full Name</Label><Input value={form.name} onChange={set("name")} required /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={set("email")} required /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={set("phone")} placeholder="07XXXXXXXX" required /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={set("address")} required /></div>
          <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={set("password")} required minLength={6} /></div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Register
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterPage;
