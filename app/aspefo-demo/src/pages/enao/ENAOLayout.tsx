import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ClipboardList, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ENAOLayout() {
  const { isStaff } = useAuth();

  const enaoNavItems = [
    { name: 'Portada Principal', path: '/', icon: Home },
    { name: 'Inicio ENAO', path: '/enao', end: true, icon: ClipboardList },
    { name: 'Acceso Intranet', path: '/enao/login', icon: LayoutDashboard },
  ];

  if (isStaff) {
    enaoNavItems.push({ name: 'Admin', path: '/enao/admin', icon: Shield });
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <nav className="bg-aspefo-navy text-white border-b border-white/10 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12">
          <div className="flex space-x-1 h-full">
            {enaoNavItems.map((item) => (
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
