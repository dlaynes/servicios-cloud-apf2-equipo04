import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Download, Loader2, AlertCircle, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { documentApi } from '../../services/api';
import type { ApplicantDocumentResponse } from '../../types/enao';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'PENDIENTE', cls: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'VALIDADO', cls: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'RECHAZADO', cls: 'bg-rose-100 text-rose-800' },
};

export default function DocumentReviewPanel() {
  const [pending, setPending] = useState<ApplicantDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [comments, setComments] = useState<Record<number, string>>({});
  const [applicantId, setApplicantId] = useState('');
  const [others, setOthers] = useState<ApplicantDocumentResponse[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPending(await documentApi.listPending());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos pendientes.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setBusyId(id); setError(''); setInfo('');
    try {
      await documentApi.review(id, { status, comment: comments[id] || undefined });
      setInfo(`Documento ${id} ${status === 'APPROVED' ? 'validado' : 'rechazado'}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la revisión.');
    } finally { setBusyId(null); }
  };

  const download = async (id: number) => {
    setError('');
    try { await documentApi.downloadAdmin(id); } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el documento.');
    }
  };

  const searchApplicant = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setOthers(null); setInfo('');
    const id = Number(applicantId.trim());
    if (!Number.isFinite(id) || id <= 0) { setError('Ingresa un id de postulante válido.'); return; }
    try { setOthers(await documentApi.listForAdmin(id)); } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos.');
    }
  };

  const tableFor = (rows: ApplicantDocumentResponse[], withActions: boolean, showApplicant: boolean) => (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left text-[10px] font-black uppercase tracking-[2px] text-slate-500">
          <tr>
            <th className="px-4 py-3">Documento</th>
            {showApplicant && <th className="px-4 py-3">Postulante</th>}
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Estado</th>
            {withActions && <th className="px-4 py-3">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr><td colSpan={withActions ? (showApplicant ? 5 : 4) : (showApplicant ? 4 : 3)}
              className="px-4 py-6 text-center text-slate-400">Sin registros.</td></tr>
          )}
          {rows.map((d) => {
            const meta = STATUS_META[d.status] ?? STATUS_META.PENDING;
            return (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">{d.originalName}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {d.documentType} · {d.detectedContentType}
                  </div>
                  {d.uploadComment && (
                    <div className="mt-1 text-xs italic text-slate-500">Nota: {d.uploadComment}</div>
                  )}
                </td>
                {showApplicant && (
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-700">{d.applicantName ?? '-'}</div>
                    <div className="text-xs text-slate-400">id {d.applicantId ?? '-'}</div>
                  </td>
                )}
                <td className="px-4 py-3 text-xs">{d.documentType}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.cls}`}>
                    {meta.label}
                  </span>
                </td>
                {withActions && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="text" value={comments[d.id] || ''}
                        onChange={(e) => setComments((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        placeholder="Comentario"
                        className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-aspefo-accent focus:outline-none" />
                      <button onClick={() => review(d.id, 'APPROVED')} disabled={busyId === d.id} title="Validar"
                        className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40">
                        {busyId === d.id ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                      </button>
                      <button onClick={() => review(d.id, 'REJECTED')} disabled={busyId === d.id} title="Rechazar"
                        className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-40">
                        <ThumbsDown size={16} />
                      </button>
                      <button onClick={() => download(d.id)} title="Descargar"
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-aspefo-accent">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h2 className="text-2xl font-black uppercase tracking-wide text-aspefo-navy">Revisión de documentos</h2>
        <p className="mt-2 text-sm text-slate-600">
          Valida o rechaza los documentos cargados por los postulantes. Queda registro del
          revisor, del comentario y de la fecha.
        </p>

        {error && <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5" /><span>{error}</span></div>}
        {info && <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <ClipboardCheck size={16} className="mt-0.5" /><span>{info}</span></div>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} /> Refrescar
          </button>
          <form onSubmit={searchApplicant} className="flex items-center gap-2">
            <input type="text" value={applicantId} onChange={(e) => setApplicantId(e.target.value)}
              placeholder="id de postulante"
              className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-aspefo-accent focus:outline-none" />
            <button type="submit" className="rounded-md bg-aspefo-navy px-3 py-2 text-xs font-bold uppercase text-white hover:bg-aspefo-accent">
              Ver documentos
            </button>
          </form>
        </div>

        <h3 className="mt-6 text-sm font-black uppercase tracking-[2px] text-aspefo-navy">Pendientes</h3>
        {loading
          ? <div className="mt-4 text-sm text-slate-400">Cargando…</div>
          : tableFor(pending, true, true)}

        {others && (
          <>
            <h3 className="mt-8 text-sm font-black uppercase tracking-[2px] text-aspefo-navy">
              Documentos del postulante seleccionado
            </h3>
            {tableFor(others, true, false)}
          </>
        )}
      </motion.div>
    </div>
  );
}