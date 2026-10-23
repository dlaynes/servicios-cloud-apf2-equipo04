import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ClipboardList, LayoutDashboard, Shield, FileUp, ReceiptText, ClipboardCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  name: string;
  path: string;
  end?: boolean;
  icon: typeof Home;
}

export default function ENAOLayout() {
  const { isStaff, isAuthenticated, role } = useAuth();

  const items: NavItem[] = [
    { name: 'Portada Principal', path: '/', icon: Home },
    { name: 'Inicio ENAO', path: '/enao', end: true, icon: ClipboardList },
    { name: 'Acceso Intranet', path: '/enao/login', icon: LayoutDashboard },
  ];

  // RF-03 y RF-04: solo el postulante autenticado usa los endpoints /api/me/*
  if (isAuthenticated && !isStaff) {
    items.push({ name: 'Documentos', path: '/enao/documentos', icon: FileUp });
    items.push({ name: 'Comprobante', path: '/enao/comprobante', icon: ReceiptText });
  }

  // Revision y reportes: solo personal ADMIN / MAINTAINER
  if (isStaff) {
    items.push({ name: 'Admin', path: '/enao/admin', icon: Shield });
    items.push({ name: 'Revision', path: '/enao/documentos-admin', icon: ClipboardCheck });
    items.push({ name: 'Reportes', path: '/enao/reportes', icon: BarChart3 });
  }

  void role; // se conserva por si se restringe el acceso por seccion

  return (
    <div className="bg-slate-50 min-h-screen">
      <nav className="bg-aspefo-navy text-white border-b border-white/10 sticky top-20 z-40 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12">
          <div className="flex space-x-1 h-full">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 h-full text-[10px] font-black uppercase tracking-[2px] transition-all border-b-2 ${
                    isActive
                      ? 'bg-white/10 border-aspefo-accent text-white'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <item.icon size={14} />
                <span className="hidden sm:inline">{item.name}</span>
              </NavLink>
            ))}
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] font-black uppercase tracking-[3px] text-blue-300">
              Ciclo 2024-II
            </span>
          </div>
        </div>
      </nav>

      <main className="py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}