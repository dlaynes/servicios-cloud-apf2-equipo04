import { Calendar, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function ENAOWelcome() {
  const norms = [
    "I. DISPOSICIONES GENERALES",
    "1.1 El Examen Nacional de Odontología (ENAO) es un instrumento técnico de evaluación objetiva que mide los conocimientos mínimos que debe poseer el bachiller en odontología para realizar el Servicio Rural y Urbano Marginal de Salud (SERUMS).",
    "1.2 La Asociación Peruana de Facultades de Odontología (ASPEFO) es la responsable directa de la conducción de las actividades operativas antes, durante y después del examen.",
    "II. DEL PROCESO DE INSCRIPCIÓN",
    "2.1 La inscripción se realizará estrictamente a través de la plataforma virtual oficial de ASPEFO durante los plazos establecidos en el cronograma vigente.",
    "2.2 El postulante es responsable de la veracidad de la información registrada durante el proceso de pre-inscripción.",
    "2.3 Son requisitos indispensables: Copia simple del Grado Académico de Bachiller, DNI vigente y comprobante de pago por derecho de examen.",
    "III. NORMAS DEL EXAMEN",
    "3.1 El examen consta de 100 preguntas de selección múltiple sobre las áreas de Ciencias Básicas, Estomatología Clínica y Salud Pública.",
    "3.2 Queda terminantemente prohibido el ingreso al aula de evaluación con dispositivos electrónicos, mochilas, carteras o cualquier material no autorizado.",
    "3.3 El incumplimiento de las normas de conducta resultará en la anulación inmediata del examen y el reporte a las instancias gremiales correspondientes.",
    "IV. DE LOS RESULTADOS",
    "4.1 Los resultados son inapelables y se publicarán en un plazo máximo de 24 horas posteriores a la culminación del examen nacional."
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-12 bg-white border border-aspefo-border rounded-lg overflow-hidden flex flex-col md:flex-row shadow-sm">
        <div className="md:w-1/2 p-8 md:p-12">
          <span className="text-aspefo-accent font-black uppercase tracking-[4px] text-[10px] mb-4 block">Convocatoria Nacional</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-aspefo-navy tracking-tighter leading-none mb-6">
            Bienvenido al ENAO
          </h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 uppercase tracking-wide">
            Inicie su proceso de inscripción para el Examen Nacional de Odontología Ciclo 2024-II. Asegúrese de leer todas las instrucciones antes de proceder.
          </p>
          <div className="flex items-center gap-2 text-aspefo-blue px-3 py-1.5 bg-aspefo-bg rounded border border-aspefo-border w-fit font-black text-[10px] uppercase tracking-widest">
            <CheckCircle2 size={16} /> Certificado por ASPEFO
          </div>
        </div>
        <div className="md:w-1/2 bg-aspefo-navy relative p-8 flex flex-col justify-center border-l md:border-l-aspefo-border">
          <div className="flex items-center gap-4 mb-8">
            <Calendar className="text-aspefo-accent" size={40} />
            <div>
               <h3 className="text-white text-xs font-black uppercase tracking-[3px] mb-1">Periodo de Inscripción</h3>
               <p className="text-blue-300 text-xl font-black tracking-tight">15 MAY — 30 JUN, 2024</p>
            </div>
          </div>
          <p className="text-blue-100/50 text-[10px] uppercase font-bold tracking-widest leading-relaxed">
            * El sistema se cerrará automáticamente al finalizar el plazo establecido sin posibilidad de prórroga alguna.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Norms and Regulations with Scroll */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white border border-aspefo-border rounded-lg p-8 h-full">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
              <FileText className="text-aspefo-blue" size={24} />
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Normativas y Reglamentos</h2>
            </div>
            
            <div className="h-[400px] overflow-y-auto pr-6 custom-scrollbar text-sm font-medium text-slate-600 leading-relaxed space-y-4">
              {norms.map((norm, idx) => (
                <p key={idx} className={norm.startsWith('I') || norm.startsWith('V') ? "font-black text-aspefo-navy pt-2 first:pt-0" : ""}>
                   {norm}
                </p>
              ))}
              <div className="pt-8 p-4 bg-slate-50 border border-slate-100 rounded text-center italic text-xs text-slate-400">
                Al presionar el botón de inscripción, usted declara haber leído y estar de acuerdo con todos los términos aquí expuestos.
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-aspefo-blue text-white p-8 rounded-lg shadow-xl shadow-blue-900/10"
          >
            <h3 className="text-lg font-bold mb-4 tracking-tight">Acceso a Inscripción</h3>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed opacity-70">
              Accede al formulario oficial. Necesitará su número de bachiller y DNI para iniciar sesión.
            </p>
            
            <Link 
              to="/enao/registro"
              className="w-full bg-white text-aspefo-blue px-6 py-4 font-black text-xs uppercase tracking-[3px] rounded-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group"
            >
              Ir al Formulario <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="mt-8 flex items-center gap-4 border-t border-white/10 pt-8 opacity-60">
              <div className="bg-white/10 p-2 rounded">
                 <CheckCircle2 size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[2px]">Plataforma Segura SSL</span>
            </div>
          </motion.div>

          <div className="bg-white border border-aspefo-border p-8 rounded-lg">
             <h4 className="text-xs font-black uppercase tracking-[2px] text-slate-800 mb-6">Asistencia Técnica</h4>
             <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                   <span className="w-1.5 h-1.5 bg-aspefo-accent rounded-full"></span>
                   Guía del Postulante (PDF)
                </li>
                <li className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                   <span className="w-1.5 h-1.5 bg-aspefo-accent rounded-full"></span>
                   Videotutorial de Registro
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
