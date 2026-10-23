import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import News from './pages/News';
import Institution from './pages/Institution';
import Contact from './pages/Contact';

// ENAO Module
import ENAOLayout from './pages/enao/ENAOLayout';
import ENAOWelcome from './pages/enao/ENAOWelcome';
import ENAOPanel from './pages/enao/ENAOPanel';
import ENAORegistration from './pages/enao/ENAORegistration';
import ENAOLogin from './pages/enao/ENAOLogin';
import AdminPanel from './pages/enao/AdminPanel';
import { useAuth } from './contexts/AuthContext';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isStaff } = useAuth();
  return isStaff ? <>{children}</> : <Navigate to="/enao/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="noticias" element={<News />} />
          <Route path="institucion" element={<Institution />} />
          <Route path="contacto" element={<Contact />} />
        </Route>
        
        {/* ENAO Module with its own layout nested for sub-navigation */}
        <Route path="/enao" element={<Layout />}>
          <Route element={<ENAOLayout />}>
            <Route index element={<ENAOWelcome />} />
            <Route path="login" element={<ENAOLogin />} />
            <Route path="panel" element={<ENAOPanel />} />
            <Route path="registro" element={<ENAORegistration />} />
            <Route
              path="admin"
              element={
                <AdminGuard>
                  <AdminPanel />
                </AdminGuard>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
