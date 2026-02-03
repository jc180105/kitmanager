import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const HistoryPage = lazy(() => import('./pages/History'));
const MenuPage = lazy(() => import('./pages/Menu'));
const KitnetDetails = lazy(() => import('./pages/KitnetDetails'));
const KitnetTenant = lazy(() => import('./pages/KitnetTenant'));
const KitnetEdit = lazy(() => import('./pages/KitnetEdit'));
const Configuration = lazy(() => import('./pages/Configuration'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="kitnet/:id" element={<KitnetDetails />} />
            <Route path="kitnet/:id/inquilino" element={<KitnetTenant />} />
            <Route path="kitnet/:id/editar" element={<KitnetEdit />} />
            <Route path="config" element={<Configuration />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
