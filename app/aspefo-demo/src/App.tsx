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
import DocumentsPanel from './pages/enao/DocumentsPanel';
import ComprobantePanel from './pages/enao/ComprobantePanel';
import DocumentReviewPanel from './pages/enao/DocumentReviewPanel';
import ReportsPanel from './pages/enao/ReportsPanel';
import { useAuth } from './contexts/AuthContext';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isStaff } = useAuth();
  return isStaff ? <>{children}</> : <Navigate to="/enao/login" replace />;
}

/** Guardia para los endpooints del propio postulante (RF-03 / RF-04). */
function ApplicantGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isStaff } = useAuth();
  return isAuthenticated && !isStaff ? <>{children}</> : <Navigate to="/enao/login" replace />;
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
              element={(
                <AdminGuard>
                  <AdminPanel />
                </AdminGuard>
              )}
            />
            {/* RF-03: documentos adjuntos del propio postulante */}
            <Route
              path="documentos"
              element={(
                <ApplicantGuard>
                  <DocumentsPanel />
                </ApplicantGuard>
              )}
            />
            {/* RF-04: comprobante de inscripcion descargable */}
            <Route
              path="comprobante"
              element={(
                <ApplicantGuard>
                  <ComprobantePanel />
                </ApplicantGuard>
              )}
            />
            {/* RF-03: revision de documentos por el administrador */}
            <Route
              path="documentos-admin"
              element={(
                <AdminGuard>
                  <DocumentReviewPanel />
                </AdminGuard>
              )}
            />
            {/* RF-08: reportes agregados */}
            <Route
              path="reportes"
              element={(
                <AdminGuard>
                  <ReportsPanel />
                </AdminGuard>
              )}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}