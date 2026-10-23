import { Calendar, Tag, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function News() {
  const newsItems = [
    {
      id: 1,
      title: "XXIV Congreso Nacional de Estudiantes de Odontología - CONAEO 2024",
      excerpt: "Un encuentro académico sin precedentes que reunirá a los mejores especialistas y estudiantes del país.",
      date: "15 Mayo, 2024",
      category: "Eventos",
      image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1000"
    },
    // ... rest of items kept ...
  ];

  return (
    <div className="min-h-screen py-12 bg-aspefo-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 border-b border-aspefo-border pb-8">
          <span className="text-aspefo-accent font-bold uppercase tracking-[4px] text-[10px] mb-2 block">Actualidad</span>
          <h1 className="text-4xl font-extrabold text-aspefo-navy tracking-tighter">Sala de Prensa</h1>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {newsItems.map((news, idx) => (
              <motion.article 
                key={news.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group bg-white rounded-lg overflow-hidden border border-aspefo-border flex flex-col md:flex-row"
              >
                <div className="md:w-1/3 relative overflow-hidden bg-slate-100">
                  <img src={news.image} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 aspect-video md:aspect-auto opacity-90" />
                </div>
                <div className="p-8 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-aspefo-blue/5 text-aspefo-blue text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border border-aspefo-blue/10">
                        {news.category}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                        <Calendar size={12} />
                        {news.date}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-aspefo-blue transition-colors mb-3 leading-tight">
                      {news.title}
                    </h2>
                    <p className="text-slate-500 text-xs leading-relaxed mb-6 line-clamp-2 uppercase font-medium">
                      {news.excerpt}
                    </p>
                  </div>
                  <button className="flex items-center gap-2 text-aspefo-accent font-black text-[10px] uppercase tracking-[2px] group-hover:gap-3 transition-all w-fit">
                    Continuar leyendo <ChevronRight size={14} />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white p-8 rounded-lg border border-aspefo-border">
              <h3 className="text-xs font-black uppercase tracking-[3px] text-aspefo-navy mb-8 flex items-center gap-2">
                 Categorías
              </h3>
              <ul className="space-y-4">
                {['Institucional', 'Eventos', 'Capacitación', 'Investigación', 'Evaluación'].map(cat => (
                  <li key={cat}>
                    <a href="#" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-aspefo-blue flex justify-between items-center group transition-colors">
                      {cat}
                      <span className="bg-aspefo-bg px-2 py-0.5 rounded text-[10px] group-hover:bg-aspefo-blue text-white transition-colors">12</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-aspefo-navy text-white p-8 rounded-lg relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2 tracking-tight">Boletín Mensual</h3>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-6 leading-relaxed">Suscríbase para recibir actualizaciones académicas.</p>
                <input 
                  type="email" 
                  placeholder="CORREO ELECTRÓNICO" 
                  className="w-full bg-white/5 border border-white/10 rounded-sm py-3 px-4 text-[10px] font-bold tracking-widest mb-3 focus:outline-none focus:border-aspefo-accent transition-colors"
                />
                <button className="w-full bg-aspefo-accent text-white py-3 rounded-sm text-[10px] font-black uppercase tracking-[2px] hover:bg-blue-400 transition-colors">
                  Suscribirme
                </button>
              </div>
              {/* Geometric pattern background element */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
