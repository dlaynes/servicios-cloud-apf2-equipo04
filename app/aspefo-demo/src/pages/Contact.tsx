import { Phone, MapPin, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <div className="bg-aspefo-bg min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 border-b border-aspefo-border pb-8">
          <span className="text-aspefo-accent font-bold uppercase tracking-[4px] text-[10px] mb-2 block">Escribe tus consultas</span>
          <h1 className="text-4xl font-extrabold text-aspefo-navy tracking-tighter">Contacto</h1>
        </header>

        <div className="grid grid-cols-12 gap-4">
          
          {/* Main Form Panel */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-aspefo-border rounded-lg p-8 md:p-12">
            <h2 className="text-xl font-bold text-aspefo-navy mb-10 tracking-tight">Formulario de Consulta</h2>
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[3px] text-slate-400">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="NOMBRE" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 px-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-[3px] text-slate-400">Email Institucional</label>
                  <input 
                    type="email" 
                    placeholder="EMAIL" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 px-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[3px] text-slate-400">Asunto Institucional</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 px-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors appearance-none">
                  <option>Consultas Generales</option>
                  <option>Afiliaciones de Facultades</option>
                  <option>Eventos y Congresos</option>
                  <option>Otros</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[3px] text-slate-400">Mensaje</label>
                <textarea 
                  rows={4} 
                  placeholder="SU MENSAJE" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 px-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors resize-none"
                />
              </div>
              <button 
                type="submit" 
                className="bg-aspefo-blue text-white px-10 py-4 font-black text-[10px] uppercase tracking-[3px] hover:bg-aspefo-navy transition-all shadow-lg shadow-blue-900/10 w-full md:w-auto rounded-sm"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>

          {/* Contact Info Sidebar Panel */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
             <div className="bg-aspefo-blue text-white p-8 rounded-lg flex flex-col justify-between min-h-[300px]">
                <div>
                   <h3 className="text-xl font-bold mb-8 tracking-tight">Datos de Sede</h3>
                   <div className="space-y-8">
                      <div className="flex gap-4">
                         <MapPin size={18} className="text-aspefo-accent shrink-0" />
                         <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                            Av. Rivera Navarrete 123<br/>
                            Lince, Lima, Perú
                         </p>
                      </div>
                      <div className="flex gap-4">
                         <Phone size={18} className="text-aspefo-accent shrink-0" />
                         <p className="text-[11px] font-bold uppercase tracking-widest">
                            +51 (01) 422-3030
                         </p>
                      </div>
                   </div>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 opacity-60">
                   <p className="text-[9px] font-black uppercase tracking-[2px]">Atención de Lunes a Viernes<br/>09:00 AM - 05:00 PM</p>
                </div>
             </div>

             <div className="bg-white border border-aspefo-border p-8 rounded-lg flex items-center gap-4">
                <div className="w-12 h-12 bg-aspefo-bg rounded flex items-center justify-center text-aspefo-blue">
                   <MessageSquare size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[2px] leading-tight">Canal Digital</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Respuesta técnica estimada 24h</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
