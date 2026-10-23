import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { name: 'Portada', path: '/' },
    { name: 'Noticias', path: '/noticias' },
    { name: 'La Institución', path: '/institucion' },
    { name: 'ENAO', path: '/enao' },
    { name: 'Contacto', path: '/contacto' },
  ];

  return (
    <header className="bg-white border-b border-aspefo-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-aspefo-blue rounded-sm flex items-center justify-center text-white font-bold text-xl uppercase">
              A
            </div>
            <div>
              <h1 className="text-2xl font-bold text-aspefo-blue leading-none tracking-tighter">ASPEFO</h1>
              <p className="text-[10px] uppercase tracking-[2px] text-slate-500 font-bold hidden sm:block mt-1">
                Asociación Peruana de Facultades de Odontología
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-10 text-sm font-bold uppercase tracking-widest">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `transition-all hover:text-aspefo-accent pb-1 ${
                    isActive ? 'text-aspefo-blue border-b-2 border-aspefo-blue' : 'text-slate-500'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-aspefo-blue focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-4 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-aspefo-blue/5 text-aspefo-blue'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-aspefo-blue'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
