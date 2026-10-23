import React, { useState } from 'react';
import { ReceiptText, Download, Loader2, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { comprobanteApi } from '../../services/api';
import type { ComprobanteVerification } from '../../types/enao';

export default function ComprobantePanel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [serial, setSerial] = useState('');
  const [result, setResult] = useState<ComprobanteVerification | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleDownload = async () => {
    setBusy(true); setError('');
    try { await comprobanteApi.downloadForMe(); } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el comprobante.');
    } finally { setBusy(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true); setError(''); setResult(null);
    try {
      setResult(await comprobanteApi.verify(serial.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comprobante no encontrado.');
    } finally { setVerifying(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h2 className="text-2xl font-black uppercase tracking-wide text-aspefo-navy">
          Comprobante de inscripción
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          El PDF se genera en el backend con un número de serie y un hash SHA-256; se puede
          verificar después sin acceso al sistema, por el serial.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle size={16} className="mt-0.5" /><span>{error}</span>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-aspefo-accent/10 p-3">
              <ReceiptText size={22} className="text-aspefo-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-black uppercase tracking-[2px] text-aspefo-navy">Descargar</h3>
              <p className="mt-1 text-sm text-slate-600">
                Solo se emite cuando la inscripción está en estado <strong>VALIDADO</strong>.
              </p>
              <button onClick={handleDownload} disabled={busy}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-aspefo-navy px-4 py-2 text-xs font-black uppercase tracking-[2px] text-white transition hover:bg-aspefo-accent disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Descargar comprobante (PDF)
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleVerify} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-[2px] text-aspefo-navy">
            Verificar un comprobante
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Pega el número de serie impreso en el PDF. La verificación es pública y no expone datos personales.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input type="text" value={serial} onChange={(e) => setSerial(e.target.value)}
              placeholder="a1b2c3d4-e5f6-7890-1234-567890abcdef"
              className="min-w-[260px] flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-aspefo-accent focus:outline-none" />
            <button type="submit" disabled={verifying || !serial.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-aspefo-navy px-4 py-2 text-xs font-black uppercase tracking-[2px] text-white transition hover:bg-aspefo-accent disabled:opacity-50">
              {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Verificar
            </button>
          </div>

          {result && (
            <div className={`mt-5 rounded-lg border px-4 py-4 text-sm ${
              result.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                           : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              <div className="flex items-center gap-2 font-black uppercase tracking-wide">
                {result.valid
                  ? <><ShieldCheck size={16} /> Comprobante vigente</>
                  : <><ShieldAlert size={16} /> Comprobante anulado</>}
              </div>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div><dt className="text-xs uppercase tracking-wide text-slate-500">Serial</dt>
                  <dd className="font-mono text-xs">{result.serial}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-slate-500">Generado</dt>
                  <dd className="font-mono text-xs">{new Date(result.generatedAt).toLocaleString()}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-slate-500">Periodo / Sede</dt>
                  <dd className="font-mono text-xs">{result.period} / {result.campus}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-slate-500">Institución</dt>
                  <dd className="font-mono text-xs">{result.institution}</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-slate-500">Hash (prefijo)</dt>
                  <dd className="font-mono text-xs">{result.sha256Prefix}…</dd></div>
                <div><dt className="text-xs uppercase tracking-wide text-slate-500">Estado</dt>
                  <dd className="font-mono text-xs">{result.state}</dd></div>
              </dl>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}