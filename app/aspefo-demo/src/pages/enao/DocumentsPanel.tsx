import React, { useCallback, useEffect, useState } from 'react';
import { FileUp, Download, Trash2, Loader2, AlertCircle, ShieldCheck, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { documentApi } from '../../services/api';
import type { ApplicantDocumentResponse } from '../../types/enao';

const DOC_TYPES = ['DNI', 'CERTIFICADO', 'RECEIPT', 'OTRO'];
const MAX_FILE_MB = 10;

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'PENDIENTE DE VALIDACIÓN', cls: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'VALIDADO', cls: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'RECHAZADO', cls: 'bg-rose-100 text-rose-800' },
};

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

export default function DocumentsPanel() {
  const [list, setList] = useState<ApplicantDocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [comment, setComment] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await documentApi.list());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Selecciona un archivo para subir.'); return; }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`El archivo supera el máximo de ${MAX_FILE_MB} MB.`);
      return;
    }
    setBusy(true); setError(''); setInfo('');
    try {
      const created = await documentApi.upload(file, docType, comment || undefined);
      setInfo(`Documento ${created.originalName} recibido (estado PENDING).`);
      setFile(null); setComment('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el documento.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async (id: number) => {
    setError(''); setInfo('');
    try { await documentApi.download(id); } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el documento.');
    }
  };

  const handleDelete = async (id: number) => {
    setBusy(true); setError(''); setInfo('');
    try {
      await documentApi.remove(id);
      setInfo('Documento eliminado.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el documento.');
    } finally { setBusy(false); }
  };

  const totalBytes = list.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="text-2xl font-black uppercase tracking-wide text-aspefo-navy">
          Documentos de la postulación
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Adjunta los documentos exigidos para tu inscripción. El backend valida el tamaño
          real del archivo y su tipo por contenido, no por la extensión.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={16} className="mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <ShieldCheck size={16} className="mt-0.5" />
            <span>{info}</span>
          </div>
        )}

        {/* ------- formulario de subida ------- */}
        <form
          onSubmit={handleUpload}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3 className="text-sm font-black uppercase tracking-[2px] text-aspefo-navy">
            Subir documento
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Tipo</span>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-aspefo-accent focus:outline-none"
              >
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Comentario (opcional)</span>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Por ejemplo: DNI escaneado por ambos lados"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-aspefo-accent focus:outline-none"
              />
            </label>
          </div>

          <label
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.length) setFile(e.dataTransfer.files[0]);
            }}
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
              dragActive ? 'border-aspefo-accent bg-aspefo-accent/5' : 'border-slate-300 hover:border-aspefo-accent'
            }`}
          >
            <FileUp size={26} className="text-aspefo-accent" />
            <span className="mt-2 text-sm font-semibold text-slate-700">
              {file ? file.name : 'Arrastrar un archivo o hacer clic para elegir'}
            </span>
            <span className="mt-1 text-xs text-slate-500">
              hasta {MAX_FILE_MB} MB por archivo · PDF, PNG o JPG
            </span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {list.length} documento(s) · {fmtSize(totalBytes)} en total
            </p>
            <button
              type="submit"
              disabled={busy || !file}
              className="inline-flex items-center gap-2 rounded-lg bg-aspefo-navy px-4 py-2 text-xs font-black uppercase tracking-[2px] text-white transition hover:bg-aspefo-accent disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              Subir documento
            </button>
          </div>
        </form>

        {/* ------- listado ------- */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-[10px] font-black uppercase tracking-[2px] text-slate-500">
              <tr>
                <th className="px-4 py-3">Archivo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Subido</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Cargando…</td></tr>
              )}
              {!loading && list.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Aún no hay documentos.</td></tr>
              )}
              {!loading && list.map((d) => {
                const meta = STATUS_META[d.status] ?? STATUS_META.PENDING;
                const deletable = d.status === 'PENDING';
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <FileText size={14} className="text-aspefo-accent" />
                        {d.originalName}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {d.sha256.slice(0, 12)}… · detectado: {d.detectedContentType}
                      </div>
                      {d.reviewComment && (
                        <div className="mt-1 text-xs italic text-slate-500">
                          Revisión: {d.reviewComment}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{d.documentType}</td>
                    <td className="px-4 py-3">{fmtSize(d.sizeBytes)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(d.uploadedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDownload(d.id)} title="Descargar"
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-aspefo-accent">
                          <Download size={16} />
                        </button>
                        {deletable && (
                          <button onClick={() => handleDelete(d.id)} disabled={busy} title="Eliminar"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}