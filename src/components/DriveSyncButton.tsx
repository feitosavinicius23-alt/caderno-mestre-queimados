import { useState } from 'react';

type CheckResult = { ok: boolean; atualizado?: boolean; message: string };

export function DriveSyncButton() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function verificar() {
    setChecking(true);
    setResult(null);
    try {
      const response = await fetch('/api/check-caderno', { cache: 'no-store' });
      setResult(await response.json() as CheckResult);
    } catch {
      setResult({ ok: false, message: 'Não foi possível consultar o documento do Drive agora.' });
    } finally {
      setChecking(false);
    }
  }

  const classe = result?.ok && result.atualizado
    ? 'sync-drive__resultado--ok'
    : result?.ok ? 'sync-drive__resultado--aviso' : 'sync-drive__resultado--erro';

  return (
    <div className="sync-drive">
      <button type="button" className="botao botao--secundario botao--sync" onClick={verificar} disabled={checking} title="Verificar atualizações no Caderno Mestre do Google Drive">
        <span aria-hidden="true">↻</span>
        <span className="sync-drive__label">{checking ? 'Verificando…' : 'Atualizar caderno'}</span>
      </button>
      {result ? <span className={`sync-drive__resultado ${classe}`} role="status">{result.message}</span> : null}
    </div>
  );
}
