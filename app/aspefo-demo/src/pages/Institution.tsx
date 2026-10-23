import { ShieldCheck, Target, Eye, BookOpen, Layers, Landmark } from 'lucide-react';
import { motion } from 'motion/react';

export default function Institution() {
  return (
    <div className="bg-aspefo-bg pb-12">
      {/* Refined Geometric Hero */}
      <section className="relative bg-aspefo-navy py-20 lg:py-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-aspefo-accent/10 -skew-x-12 translate-x-1/4" />
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=2070" 
            alt="Medical Research" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-aspefo-navy/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="col-span-12 lg:col-span-7"
            >
              <span className="text-aspefo-accent font-black uppercase tracking-[6px] text-[10px] mb-4 block">Trayectoria Institucional</span>
              <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8">
                Forjando <br/>
                <span className="text-aspefo-accent">Excelencia</span>
              </h1>
              <p className="text-slate-300 max-w-xl text-lg font-medium leading-relaxed opacity-80">
                La Asociación Peruana de Facultades de Odontología busca la transformación educativa y científica en salud bucal desde hace décadas.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block lg:col-span-5"
            >
              <div className="relative p-4 border border-white/10 rounded-sm">
                <div className="aspect-square bg-white/5 backdrop-blur-sm flex items-center justify-center relative overflow-hidden group">
                  <Landmark size={200} className="text-aspefo-accent/20 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 border-[16px] border-aspefo-navy" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white border border-aspefo-border rounded-lg shadow-2xl shadow-blue-900/10 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
          {[
            { label: 'Universidades', value: '25+' },
            { label: 'Inscritos', value: '6000' },
            { label: 'Años de Historia', value: '9' },
            { label: 'Regiones', value: '24' },
          ].map((stat, idx) => (
            <div key={idx} className="p-8 text-center group">
              <span className="block text-3xl font-black text-aspefo-navy tracking-tighter mb-1 group-hover:text-aspefo-accent transition-colors">{stat.value}</span>
              <span className="block text-[9px] font-black uppercase tracking-[2px] text-slate-400">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Refined Who We Are Block */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-aspefo-border rounded-lg overflow-hidden flex flex-col md:flex-row shadow-sm">
          <div className="md:w-1/2 p-12 lg:p-20 border-b md:border-b-0 md:border-r border-aspefo-border">
            <h2 className="text-[10px] font-black uppercase tracking-[4px] text-aspefo-accent mb-6">Nuestra Identidad</h2>
            <h3 className="text-4xl font-extrabold text-aspefo-navy tracking-tighter mb-8 italic">¿Quiénes Somos?</h3>
            <div className="space-y-6 text-slate-600 leading-relaxed font-medium text-sm">
              <p>
                La **Asociación Peruana de Facultades de Odontología (ASPEFO)** representamos la máxima instancia de coordinación académica dental en el país. 
              </p>
              <p>
                Nuestra labor institucional se centra en estandarizar la calidad educativa, promover la investigación de alto impacto y asesorar a los estamentos gubernamentales en políticas de salud pública bucal.
              </p>
            </div>
          </div>
          <div className="md:w-1/2 bg-slate-50 p-12 lg:p-20 flex flex-col justify-center">
            <div className="space-y-12">
              <div className="flex gap-6 group">
                <div className="w-12 h-12 bg-aspefo-navy text-white rounded flex items-center justify-center shrink-0 group-hover:bg-aspefo-accent transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[2px] text-aspefo-navy mb-2">Respaldo Académico</h4>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">Garantizamos que cada título otorgado por nuestras asociadas cumpla con los estándares internacionales.</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="w-12 h-12 bg-aspefo-navy text-white rounded flex items-center justify-center shrink-0 group-hover:bg-aspefo-accent transition-colors">
                  <Layers size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[2px] text-aspefo-navy mb-2">Cooperación Regional</h4>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">Unificamos criterios académicos desde Tumbes hasta Tacna, integrando realidades regionales.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission/Vision System */}
      <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6 bg-slate-800 p-12 rounded-lg text-white group hover:bg-slate-700 transition-colors">
            <h3 className="text-xs font-black uppercase tracking-[4px] text-aspefo-accent mb-6">Misión</h3>
            <p className="text-lg font-bold leading-tight tracking-tight opacity-90 group-hover:opacity-100 italic">
               "Promover el desarrollo integral de la educación odontológica académica en el Perú, mediante la integración y el impulso de la investigación científica."
            </p>
          </div>
          <div className="col-span-12 lg:col-span-6 bg-aspefo-blue p-12 rounded-lg text-white group hover:bg-blue-700 transition-colors">
            <h3 className="text-xs font-black uppercase tracking-[4px] text-blue-300 mb-6">Visión</h3>
            <p className="text-lg font-bold leading-tight tracking-tight opacity-90 group-hover:opacity-100 italic">
               "Ser reconocida como la institución líder en el aseguramiento de la calidad de la formación odontológica peruana y referente internacional."
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
