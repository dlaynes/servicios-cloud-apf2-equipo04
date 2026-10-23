import React, { useState, useEffect } from 'react';
import { ArrowRight, Award, GraduationCap, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const slides = [
  {
    image: "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?auto=format&fit=crop&q=80&w=2070",
    title: "Excelencia en la Educación Odontológica del Perú",
    desc: "Consolidando la excelencia académica y clínica de las facultades de odontología a nivel nacional.",
    tag: "Bienvenidos"
  },
  {
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000",
    title: "Congreso Nacional ASPEFO 2024",
    desc: "Únase al evento académico más importante del año para la comunidad odontológica peruana.",
    tag: "Próximos Eventos"
  },
  {
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000",
    title: "Cooperación Internacional Estratégica",
    desc: "Fortaleciendo lazos con instituciones líderes en el mundo para el desarrollo dental.",
    tag: "Institucional"
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto font-sans">
      {/* Main Grid Layout Inspired by Geometric Balance */}
      <div className="grid grid-cols-12 auto-rows-min gap-4">
        
        {/* HERO CAROUSEL (Col 1-8) */}
        <section className="col-span-12 lg:col-span-8 bg-aspefo-navy rounded-lg overflow-hidden relative group h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-aspefo-navy via-aspefo-navy/70 to-transparent z-10" />
              <img 
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 z-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <span className="text-aspefo-accent font-bold uppercase tracking-[4px] text-[10px] mb-3 block">
                    {slides[currentSlide].tag}
                  </span>
                  <h1 className="text-white text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tighter">
                    {slides[currentSlide].title}
                  </h1>
                  <p className="text-slate-300 max-w-md text-sm md:text-base leading-relaxed mb-8 opacity-80 uppercase font-medium">
                    {slides[currentSlide].desc}
                  </p>
                  <Link to="/institucion" className="bg-aspefo-accent text-white px-10 py-4 font-black uppercase tracking-widest hover:bg-blue-400 transition-colors inline-block rounded-sm text-xs">
                    Ver Programas
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Controls */}
          <div className="absolute bottom-8 right-8 z-30 flex gap-2">
            <button 
              onClick={prevSlide}
              className="w-10 h-10 border border-white/20 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors rounded-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={nextSlide}
              className="w-10 h-10 border border-white/20 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors rounded-sm"
              aria-label="Next slide"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Indicators */}
          <div className="absolute bottom-8 left-8 md:left-16 z-30 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1 transition-all duration-300 rounded-full ${idx === currentSlide ? 'w-8 bg-aspefo-accent' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Geometric Accent */}
          <div className="absolute top-10 right-10 w-64 h-64 opacity-5 pointer-events-none z-0">
             <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                <path d="M50 5 L95 25 L95 75 L50 95 L5 75 L5 25 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
             </svg>
          </div>
        </section>

        {/* NEWS PREVIEW / SIDEBAR (Col 9-12) */}
        <section className="col-span-12 lg:col-span-4 bg-white border border-aspefo-border rounded-lg p-8 flex flex-col h-[500px]">
          <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800">Últimas Noticias</h2>
            <Link to="/noticias" className="text-aspefo-accent text-[10px] font-bold uppercase tracking-widest hover:underline">Ver Todo</Link>
          </div>
          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {[
              { d: '24', m: 'MAY', title: 'Asamblea General Ordinaria ASPEFO 2024', desc: 'Representantes de las principales facultades se reunieron.' },
              { d: '18', m: 'MAY', title: 'Convenio Interinstitucional de Investigación', desc: 'Nueva alianza estratégica con centros de investigación.' },
              { d: '05', m: 'MAY', title: 'Publicación de Estándares de Acreditación', desc: 'Guía oficial para los procesos de calidad educativa.' },
            ].map((news, idx) => (
              <div key={idx} className="flex gap-4 group cursor-pointer">
                <div className="min-w-[60px] h-[60px] bg-slate-50 rounded flex flex-col items-center justify-center border-l-4 border-aspefo-blue group-hover:bg-slate-100 transition-colors">
                  <span className="text-lg font-bold leading-none">{news.d}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{news.m}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-700 leading-tight mb-1 group-hover:text-aspefo-blue transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {news.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* INSTITUTION SNAPSHOT (Col 1-8) */}
        <section className="col-span-12 lg:col-span-8 bg-slate-800 text-slate-300 rounded-lg p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/3 flex flex-col">
            <h2 className="text-white text-2xl font-bold mb-3 tracking-tight">La Institución</h2>
            <div className="h-1 w-12 bg-aspefo-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          </div>
          <div className="md:w-2/3 border-l border-slate-700 md:pl-10 text-center md:text-left">
            <p className="text-sm italic leading-relaxed text-slate-400">
              "Promovemos la integración de las facultades de odontología del Perú, velando por la calidad de la enseñanza, la investigación y el servicio social en beneficio de la salud bucal de nuestra población."
            </p>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[2px] text-slate-500">
              Dr. Ricardo Mendoza — Presidente ASPEFO
            </p>
          </div>
        </section>

        {/* CONTACT BANNER (Col 9-12) */}
        <section className="col-span-12 lg:col-span-4 bg-aspefo-blue rounded-lg p-8 flex flex-col justify-between h-auto min-h-[220px]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold tracking-tight">Contacto</h2>
              <p className="text-blue-200 text-[10px] mt-1 uppercase tracking-[2px] font-bold">Estamos para servirle</p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <Link to="/contacto" className="text-white hover:scale-110 transition-transform">
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-300/60 block mb-1">Teléfono</span>
              <span className="text-xs font-semibold text-white">+51 (01) 422-3030</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-300/60 block mb-1">Ubicación</span>
              <span className="text-xs font-semibold text-white">Lima, Perú</span>
            </div>
          </div>
          <Link to="/contacto" className="mt-8 bg-white text-aspefo-blue font-bold py-3 rounded-sm shadow-lg hover:bg-slate-100 text-xs uppercase tracking-widest text-center transition-all">
            Enviar Mensaje
          </Link>
        </section>
      </div>
    </div>
  );
}
