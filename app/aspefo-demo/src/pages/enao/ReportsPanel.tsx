import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Loader2, AlertCircle, Download, RefreshCw, Users, FileCheck2, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { reportsApi } from '../../services/api';
import type { ReportResponse, SummaryReport } from '../../types/enao';

const DIMENSIONS: { value: string; label: string }[] = [
  { value: 'status', label: 'Estado de la inscripción' },
  { value: 'period', label: 'Periodo' },
  { value: 'campus', label: 'Sede' },
  { value: 'university', label: 'Institución' },
];

const STATUS_OPTIONS = ['PENDING', 'VALIDATED', 'REJECTED'];

export default function ReportsPanel() {
  const [dimension, setDimension] = useState(DIMENSIONS[0].value);
  const [status, setStatus] = useState('');
  const [campus, setCampus] = useState('');
  const [university, setUniversity] = useState('');
  const [period, setPeriod] = useState('');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const params = { groupBy: dimension, status: status || undefined, campus: campus || undefined,
        university: university || undefined, period: period || undefined };
      const [rep, sum] = await Promise.all([reportsApi.applicants(params), reportsApi.summary()]);
      setReport(rep);
      setSummary(sum);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el reporte.');
    } finally { setBusy(false); }
  }, [dimension, status, campus, university, period]);

  useEffect(() => { run(); }, [run]);

  const exportAs = async (format: 'csv' | 'pdf') => {
    setBusy(true); setError('');
    try {
      const params = { groupBy: dimension, status: status || undefined, campus: campus || undefined,
        university: university || undefined, period: period || undefined };
      await reportsApi.downloadApplicants(params, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar el reporte.');
    } finally { setBusy(false); }
  };

  const card = (label: string, value: string | number, icon: React.ReactNode) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-aspefo-navy">{value}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h2 className="text-2xl font-black uppercase tracking-wide text-aspefo-navy">Reportes agregados</h2>
        <p className="mt-2 text-sm text-slate-600">
          Reportes por periodo, sede, institución y estado de la inscripción. Las cifras son
          agregados: no exponen datos personales (Ley N.o 29733).
        </p>

        {error && <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5" /><span>{error}</span></div>}

        {/* ------- resumen ------- */}
        {summary && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {card('Postulantes', summary.totalApplicants, <Users size={16} className="text-slate-400" />)}
            {card('Validados', summary.totalVerified, <FileCheck2 size={16} className="text-emerald-400" />)}
            {card('Documentos', summary.totalDocuments, <FileText size={16} className="text-slate-400" />)}
            {card('Comprobantes activos', summary.totalActive, <BarChart3 size={16} className="text-aspefo-accent" />)}
          </div>
        )}

        {/* ------- filtros ------- */}
        <form onSubmit={(e) => { e.preventDefault(); run(); }}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[2px] text-aspefo-navy">Filtros</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Agrupar por</span>
              <select value={dimension} onChange={(e) => setDimension(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-aspefo-accent focus:outline-none">
                {DIMENSIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Estado</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-aspefo-accent focus:outline-none">
                <option value="">Todos</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Sede</span>
              <input value={campus} onChange={(e) => setCampus(e.target.value)} placeholder="todas"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-aspefo-accent focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Institución</span>
              <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="todas"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-aspefo-accent focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Periodo</span>
              <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="todos"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-aspefo-accent focus:outline-none" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-aspefo-navy px-4 py-2 text-xs font-black uppercase tracking-[2px] text-white hover:bg-aspefo-accent disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Generar
            </button>
            <button type="button" onClick={() => exportAs('csv')} disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <Download size={14} /> CSV
            </button>
            <button type="button" onClick={() => exportAs('pdf')} disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <Download size={14} /> PDF
            </button>
          </div>
        </form>

        {/* ------- tabla ------- */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-[10px] font-black uppercase tracking-[2px] text-slate-500">
              <tr>
                <th className="px-4 py-3">{DIMENSIONS.find((d) => d.value === dimension)?.label ?? dimension}</th>
                <th className="px-4 py-3 text-right">Inscritos</th>
                <th className="px-4 py-3 text-right">Participación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {busy && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Calculando…</td></tr>
              )}
              {!busy && report && report.rows.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No hay datos para los filtros aplicados.</td></tr>
              )}
              {!busy && report?.rows.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">{row.label}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.count}</td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {report.totalCount > 0
                      ? `${((row.count / report.totalCount) * 100).toFixed(1)} %`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            {report && (
              <tfoot className="bg-slate-50 text-sm font-bold">
                <tr>
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-right font-mono">{report.totalCount}</td>
                  <td className="px-4 py-3 text-right text-slate-500">100,0 %</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {report?.averageScore != null && (
          <p className="mt-3 text-sm text-slate-600">
            Promedio de notas (resultados publicados): <strong>{report.averageScore.toFixed(2)}</strong>
          </p>
        )}
      </motion.div>
    </div>
  );
}