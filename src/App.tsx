import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Container } from './components/Container';
import { Layout } from './components/Layout';
import { ProductProvider } from './context/ProductContext';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails').then((module) => ({ default: module.ProductDetails })));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const PageLoadingFallback = () => (
  <Container className="section-shell-tight">
    <div className="surface-card-strong premium-reveal overflow-hidden p-6 md:p-8">
      <div className="animate-pulse space-y-5">
        <div className="h-3 w-28 rounded-full bg-gray-200" />
        <div className="h-10 w-64 rounded-xl bg-gray-200" />
        <div className="h-5 w-full max-w-2xl rounded-lg bg-gray-100" />
        <div className="h-5 w-4/5 rounded-lg bg-gray-100" />
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <div className="h-52 rounded-2xl bg-gray-100" />
          <div className="h-52 rounded-2xl bg-gray-100" />
          <div className="h-52 rounded-2xl bg-gray-100" />
        </div>
      </div>
    </div>
  </Container>
);

export default function App() {
  return (
    <ProductProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/produto/:id" element={<ProductDetails />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/contato" element={<Contact />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ProductProvider>
  );
}

