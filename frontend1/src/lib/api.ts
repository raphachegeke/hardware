const BASE = "https://generalhardware.onrender.com/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Auth
export const authApi = {
  register: (body: { name: string; email: string; phone: string; password: string; address: string }) =>
    request<any>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<any>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  profile: (token: string) =>
    request<any>("/auth/profile", { headers: authHeaders(token) }),
};

// Categories
export const categoriesApi = {
  getAll: () => request<any[]>("/categories"),
  create: (token: string, body: { name: string; description: string; image: string }) =>
    request<any>("/categories", { method: "POST", headers: authHeaders(token), body: JSON.stringify(body) }),
};

// Products
export const productsApi = {
  getAll: () => request<any[]>("/products"),
  getOne: (id: string) => request<any>(`/products/${id}`),
  create: (token: string, body: any) =>
    request<any>("/products", { method: "POST", headers: authHeaders(token), body: JSON.stringify(body) }),
  update: (token: string, id: string, body: any) =>
    request<any>(`/products/${id}`, { method: "PUT", headers: authHeaders(token), body: JSON.stringify(body) }),
  delete: (token: string, id: string) =>
    request<any>(`/products/${id}`, { method: "DELETE", headers: authHeaders(token) }),
};

// Orders
export const ordersApi = {
  create: (token: string, body: { items: { product: string; quantity: number }[]; phone: string; deliveryAddress: string }) =>
    request<any>("/orders", { method: "POST", headers: authHeaders(token), body: JSON.stringify(body) }),
  getMy: (token: string) => request<any[]>("/orders/my", { headers: authHeaders(token) }),
  getAll: (token: string) => request<any[]>("/orders", { headers: authHeaders(token) }),
};

// M-Pesa
export const mpesaApi = {
  stkPush: (token: string, body: { orderId: string; phone: string }) =>
    request<any>("/mpesa/stkpush", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }),

  retryStkPush: (token: string, orderId: string) =>
    request<any>(`/mpesa/retry/${orderId}`, {
      method: "POST",
      headers: authHeaders(token),
    }),

  checkPaymentStatus: (token: string, orderId: string) =>
    request<any>(`/mpesa/status/${orderId}`, {
      headers: authHeaders(token),
    }),
};
