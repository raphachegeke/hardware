import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { User, Mail, Phone, MapPin, Shield } from "lucide-react";

const ProfilePage = () => {
  const { user, loading, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !token) navigate("/login");
  }, [loading, token]);

  if (loading || !user) return <Layout><div className="container py-16 text-center text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container max-w-lg py-16 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3"><User className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{user.name}</p></div></div>
          <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{user.email}</p></div></div>
          <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{user.phone}</p></div></div>
          <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Address</p><p className="font-medium">{user.address}</p></div></div>
          <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Role</p><p className="font-medium capitalize">{user.role}</p></div></div>
        </div>
        <Button variant="outline" className="mt-6" onClick={() => navigate("/orders")}>My Orders</Button>
      </div>
    </Layout>
  );
};

export default ProfilePage;
