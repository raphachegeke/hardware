import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, User, LogOut, Menu, X, Shield, Package, Home, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/categories", label: "Categories", icon: LayoutGrid },
    { to: "/products", label: "Products", icon: Package },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-primary">
            Wara<span className="text-foreground">tech</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Button>
            {user ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-1" /> {user.name.split(" ")[0]}
                </Button>
                <Button variant="ghost" size="icon" onClick={logout}><LogOut className="w-4 h-4" /></Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => navigate("/login")}>Sign In</Button>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-card p-4 space-y-2 animate-fade-in">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
                <l.icon className="w-4 h-4" /> {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium text-primary">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium w-full text-left">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium justify-center">
                Sign In
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p className="font-display font-bold text-foreground mb-1">Waratech Hardware</p>
          <p>Nairobi's trusted hardware supplier • © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
