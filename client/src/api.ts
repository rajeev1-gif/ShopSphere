import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5080/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopsphere_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type Product = {
  id: number; name: string; description: string; category: string;
  price: number; stock: number; imageUrl: string;
};
