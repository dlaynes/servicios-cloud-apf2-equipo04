import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12">
      {/* Pre-footer Info */}
      <div className="bg-white border-t border-aspefo-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-aspefo-bg rounded-lg flex items-center justify-center text-aspefo-blue border border-aspefo-border">
              <MapPin size={20} />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Sede</span>
              <span className="text-sm font-semibold">Lince, Lima - Perú</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-aspefo-bg rounded-lg flex items-center justify-center text-aspefo-blue border border-aspefo-border">
              <Phone size={20} />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Atención</span>
              <span className="text-sm font-semibold">+51 (01) 422-3030</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-aspefo-bg rounded-lg flex items-center justify-center text-aspefo-blue border border-aspefo-border">
              <Mail size={20} />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Correo</span>
              <span className="text-sm font-semibold">contacto@aspefo.org.pe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Geometric Sub-footer Bar */}
      <div className="bg-slate-100 border-t border-aspefo-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">
          <span>© {new Date().getFullYear()} Asociación Peruana de Facultades de Odontología</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-aspefo-blue transition-colors">Políticas de Privacidad</a>
            <a href="#" className="hover:text-aspefo-blue transition-colors">Transparencia</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
