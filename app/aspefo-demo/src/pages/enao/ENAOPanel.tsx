import React, { useEffect, useState } from 'react';
import {
  User,
  Edit3,
  Award,
  Download,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'PENDIENTE',
  VALIDATED: 'VALIDADO',
  REJECTED: 'RECHAZADO',
  NOT_AVAILABLE: 'NO DISPONIBLE',
  PUBLISHED: 'PUBLICADO',
  ANNULLED: 'ANULADO',
};
import { applicantApi, resultApi } from '../../services/api';
import type { Applicant, ExamResult } from '../../types/enao';

type Tab = 'data' | 'edit' | 'results';

export default function ENAOPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [applicantData, setApplicantData] = useState<Applicant | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { applicant: cachedApplicant, logout } = useAuth();

  const [editForm, setEditForm] = useState({
    organization: '',
    bank: '',
    receiptCode: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [profile, examResult] = await Promise.all([
          applicantApi.getMe(),
          resultApi.getMe(),
        ]);
        setApplicantData(profile);
        setResult(examResult);
        setEditForm({
          organization: profile.organization || '',
          bank: profile.bank || '',
          receiptCode: profile.receiptCode || '',
        });
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar la información.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/enao/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await applicantApi.updateMe(editForm);
      setApplicantData(updated);
      setActiveTab('data');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const displayData = applicantData || cachedApplicant;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">Cargando información...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">

        {/* Sidebar Navigation */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white border border-aspefo-border rounded-lg p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-aspefo-bg rounded-full border border-aspefo-border flex items-center justify-center text-aspefo-blue mb-4">
              <User size={40} />
            </div>
            <h3 className="text-sm font-black text-aspefo-navy tracking-tight leading-tight mb-2">
              {displayData?.fullName || 'Postulante'}
            </h3>
            <span className="text-[9px] font-black uppercase tracking-[2px] text-emerald-500 bg-emerald-50 px-3 py-1 rounded">
              {STATUS_LABELS[displayData?.status || ''] || displayData?.status || 'Inscrito / Validado'}
            </span>
          </div>

          <nav className="bg-white border border-aspefo-border rounded-lg overflow-hidden">
            {[
              { id: 'data', name: 'Mis Datos', icon: User },
              { id: 'edit', name: 'Editar Postulación', icon: Edit3 },
              { id: 'results', name: 'Resultados del Examen', icon: Award },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-all border-l-4 ${
                  activeTab === item.id
                  ? 'bg-aspefo-bg border-aspefo-accent text-aspefo-blue'
                  : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <item.icon size={18} />
                <span className="text-[10px] font-black uppercase tracking-[3px]">{item.name}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-8 text-left text-red-400 hover:text-red-600 hover:bg-red-50/30 transition-all border-l-4 border-transparent mt-4 opacity-70"
            >
              <LogOut size={18} />
              <span className="text-[10px] font-black uppercase tracking-[3px]">Cerrar Sesión</span>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="col-span-12 lg:col-span-9 bg-white border border-aspefo-border rounded-lg p-8 md:p-12 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'data' && displayData && (
              <motion.div
                key="data"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <header className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-aspefo-navy tracking-tighter uppercase">Información de Postulante</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-1">Gestión de Perfil Académico</p>
                  </div>
                  <button className="bg-aspefo-blue text-white px-6 py-3 rounded-sm font-black text-[9px] uppercase tracking-[2px] flex items-center gap-2 hover:bg-aspefo-navy transition-all shadow-lg shadow-blue-500/10">
                    <Download size={14} /> Descargar Comprobante
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <DataField label="Nombre Completo" value={displayData.fullName} />
                  <DataField label="Documento de Identidad" value={`${displayData.docType}: ${displayData.docNumber}`} />
                  <DataField label="Email Registrado" value={displayData.email} />
                  <DataField label="Teléfono" value={displayData.phone || 'N/A'} />
                  <DataField label="Institución de Origen" value={displayData.university || 'N/A'} />
                  <DataField label="Organización Auspiciadora" value={displayData.organization || 'N/A'} />
                  <DataField label="Banco" value={displayData.bank || 'N/A'} />
                  <DataField label="Código de Recibo" value={displayData.receiptCode || 'N/A'} />
                  <DataField label="Estado de Validación" value={STATUS_LABELS[displayData.status || ''] || displayData.status || 'N/A'} highlight="text-emerald-500" />
                </div>
              </motion.div>
            )}

            {activeTab === 'edit' && displayData && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <header className="border-b border-slate-100 pb-6">
                  <h2 className="text-2xl font-black text-aspefo-navy tracking-tighter uppercase">Modificar Postulación</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-1">Solo se permiten cambios en datos de pago y organización</p>
                </header>

                <form onSubmit={handleSave} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[3px] text-slate-400">Organización Auspiciadora</label>
                        <select
                          value={editForm.organization}
                          onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 px-4 text-[11px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors appearance-none"
                        >
                          <option value="MINSA">MINSA</option>
                          <option value="GOB_LOCAL">GOB. LOCAL</option>
                          <option value="MIN_INTERIOR">MIN. INTERIOR</option>
                          <option value="ESSALUD">ESSALUD</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[3px] text-slate-400">Banco del Pago</label>
                        <select
                          value={editForm.bank}
                          onChange={(e) => setEditForm({ ...editForm, bank: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 px-4 text-[11px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors appearance-none"
                        >
                          <option>Banco de la Nación</option>
                          <option>BCP</option>
                          <option>BBVA</option>
                          <option>Interbank</option>
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-[3px] text-slate-400">Código de Recibo / Operación</label>
                        <input
                          required
                          type="text"
                          value={editForm.receiptCode}
                          onChange={(e) => setEditForm({ ...editForm, receiptCode: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-sm py-3 px-4 text-[11px] font-bold tracking-widest focus:outline-none focus:border-aspefo-accent transition-colors"
                          placeholder="NÚMERO DE OPERACIÓN"
                        />
                      </div>
                   </div>

                   <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-aspefo-blue text-white px-8 py-3 rounded-sm font-black text-[10px] uppercase tracking-[3px] flex items-center gap-2 hover:bg-aspefo-navy transition-all disabled:opacity-70"
                      >
                        {saving ? 'GUARDANDO...' : 'Guardar Cambios'} <ChevronRight size={16} />
                      </button>
                   </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <header className="border-b border-slate-100 pb-6">
                  <h2 className="text-2xl font-black text-aspefo-navy tracking-tighter uppercase">Resultados del Examen</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mt-1">Consulta de Calificación Nacional</p>
                </header>

                {result?.available ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                      <Award size={32} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-emerald-700 mb-2">{result.message}</p>
                    <div className="text-5xl font-black text-emerald-600 tracking-tighter mb-2">
                      {result.score}
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                      Puntaje máximo: {result.maximumScore}
                    </p>
                    {result.publishedAt && (
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-4">
                        Publicado el: {new Date(result.publishedAt).toLocaleString('es-PE')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-8 flex items-start gap-4">
                    <AlertCircle className="text-amber-500 shrink-0" size={24} />
                    <div>
                      <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-2">{result?.status || 'NO DISPONIBLE'}</h4>
                      <p className="text-amber-700 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        {result?.message || 'Los resultados aún no han sido publicados. Intente más tarde.'}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function DataField({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div>
      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[2px] mb-1">{label}</span>
      <span className={`text-sm font-bold text-aspefo-navy ${highlight || ''}`}>{value}</span>
    </div>
  );
}
