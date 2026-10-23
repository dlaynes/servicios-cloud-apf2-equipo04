import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Users, 
  Award, 
  Save, 
  Search,
  AlertCircle,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../services/api';
import type { ApplicantFullResponse, ExamResult } from '../../types/enao';

export default function AdminPanel() {
  const { isStaff, logout } = useAuth();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<ApplicantFullResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ApplicantFullResponse | null>(null);

  useEffect(() => {
    if (!isStaff) {
      navigate('/enao/login');
      return;
    }
    loadApplicants();
  }, [isStaff, navigate]);

  const loadApplicants = async () => {
    try {
      setLoading(true);
      const data = await adminApi.listApplicants();
      setApplicants(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar los postulantes.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const updated = await adminApi.updateApplicantStatus(id, { status });
      setApplicants(prev => prev.map(a => a.id === id ? updated : a));
      if (selected?.id === id) setSelected(updated);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el estado.');
    }
  };

  const handleUpdateResult = async (id: number, score: number, maximumScore: number, status: string) => {
    try {
      await adminApi.updateResult(id, { score, maximumScore, status });
      setError('');
      alert('Resultado actualizado correctamente');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el resultado.');
    }
  };

  const filtered = applicants.filter(a =>
    a.fullName.toLowerCase().includes(search.toLowerCase()) ||
    a.docNumber.includes(search)
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">Cargando administración...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-aspefo-navy rounded flex items-center justify-center text-white">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-aspefo-navy tracking-tighter uppercase">Panel de Administración</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">Gestión de postulantes y resultados ENAO</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/enao/login'); }}
          className="text-[10px] font-black uppercase tracking-[2px] text-red-500 hover:text-red-700 flex items-center gap-2"
        >
          <LogOut size={16} /> Salir
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="bg-white border border-aspefo-border rounded-lg p-6 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o DNI"
            className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 pl-10 pr-4 text-[11px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white border border-aspefo-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <Users size={18} className="text-aspefo-blue" />
              <span className="text-xs font-black uppercase tracking-[2px] text-aspefo-navy">Postulantes ({filtered.length})</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`w-full text-left p-4 border-b border-slate-50 transition-colors ${
                    selected?.id === a.id ? 'bg-aspefo-bg' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-black text-aspefo-navy uppercase tracking-widest">{a.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{a.docType}: {a.docNumber}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[2px] px-2 py-1 rounded ${
                      a.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-600' :
                      a.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {{PENDING:'PENDIENTE',VALIDATED:'VALIDADO',REJECTED:'RECHAZADO'}[a.status || ''] || a.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          {selected ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-aspefo-border rounded-lg p-6 md:p-8"
            >
              <h2 className="text-lg font-black text-aspefo-navy tracking-tighter uppercase mb-6">{selected.fullName}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Field label="Documento" value={`${selected.docType}: ${selected.docNumber}`} />
                <Field label="Email" value={selected.email} />
                <Field label="Teléfono" value={selected.phone || 'N/A'} />
                <Field label="Dirección" value={selected.address || 'N/A'} />
                <Field label="Universidad" value={selected.university || selected.otherUniversity || 'N/A'} />
                <Field label="Organización" value={selected.organization || 'N/A'} />
                <Field label="Banco" value={selected.bank || 'N/A'} />
                <Field label="Recibo" value={selected.receiptCode || 'N/A'} />
              </div>

              <div className="border-t border-slate-100 pt-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={18} className="text-aspefo-accent" />
                  <span className="text-xs font-black uppercase tracking-[2px] text-aspefo-navy">Resultado del Examen</span>
                </div>
                <ResultEditor applicantId={selected.id} onSave={handleUpdateResult} />
              </div>

              <div className="border-t border-slate-100 pt-6">
                <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 block mb-3">Estado de Inscripción</span>
                <div className="flex gap-3">
                  {['PENDING', 'VALIDATED', 'REJECTED'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selected.id, status)}
                      disabled={selected.status === status}
                      className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-[2px] transition-all disabled:opacity-50 ${
                        selected.status === status
                        ? 'bg-aspefo-navy text-white'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {{PENDING:'PENDIENTE',VALIDATED:'VALIDADO',REJECTED:'RECHAZADO'}[status] || status}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white border border-aspefo-border rounded-lg p-12 text-center">
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Seleccione un postulante para gestionar su información.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{label}</span>
      <span className="text-[11px] font-bold text-aspefo-navy">{value}</span>
    </div>
  );
}

function ResultEditor({ applicantId, onSave }: { applicantId: number; onSave: (id: number, score: number, max: number, status: string) => void }) {
  const [score, setScore] = useState('');
  const [maximumScore, setMaximumScore] = useState('100');
  const [status, setStatus] = useState('PUBLISHED');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(applicantId, parseFloat(score), parseFloat(maximumScore), status);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[2px]">Puntaje</label>
          <input
            required
            type="number"
            step="0.1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-[11px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[2px]">Puntaje Máximo</label>
          <input
            required
            type="number"
            step="0.1"
            value={maximumScore}
            onChange={(e) => setMaximumScore(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-[11px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[2px]">Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 px-3 text-[11px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors appearance-none"
          >
            <option value="NOT_AVAILABLE">No disponible</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="ANNULLED">Anulado</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="bg-aspefo-blue text-white px-6 py-3 rounded-sm font-black text-[10px] uppercase tracking-[2px] flex items-center gap-2 hover:bg-aspefo-navy transition-all disabled:opacity-70"
      >
        {saving ? 'GUARDANDO...' : 'Actualizar Resultado'} <ArrowRight size={14} />
      </button>
    </form>
  );
}
