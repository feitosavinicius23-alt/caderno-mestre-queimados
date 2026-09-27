const DOC_ID = '17hPAJuQovOshYQGlzFF9-dzUl8kcbqvSD82L-KJPDRY';
const DOC_URL = `https://docs.google.com/document/d/${DOC_ID}/export?format=txt`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });
}

async function hashText(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export const onRequestGet = async ({ request }: { request: Request }) => {
  try {
    const [documentResponse, deployedResponse] = await Promise.all([
      fetch(DOC_URL),
      fetch(new URL('/sync-source.json', request.url), { cache: 'no-store' }),
    ]);

    if (!documentResponse.ok) {
      return json({ ok: false, message: `O Google Drive respondeu HTTP ${documentResponse.status}.` }, 502);
    }
    if (!deployedResponse.ok) {
      return json({ ok: false, message: 'O site ainda não possui o registro da última sincronização.' }, 503);
    }

    const text = await documentResponse.text();
    if (text.trimStart().startsWith('<')) {
      return json({ ok: false, message: 'O documento do Drive não está público para leitura.' }, 502);
    }

    const deployed = await deployedResponse.json() as { hash?: string; verificadoEm?: string };
    const driveHash = await hashText(text);
    const atualizado = Boolean(deployed.hash && deployed.hash === driveHash);

    return json({
      ok: true,
      atualizado,
      driveHash,
      ultimaVerificacao: deployed.verificadoEm ?? null,
      message: atualizado
        ? 'O site já está atualizado com o documento do Drive.'
        : 'Há uma atualização no documento do Drive. Ela será processada pela próxima sincronização automática.',
    });
  } catch (error) {
    return json({ ok: false, message: error instanceof Error ? error.message : 'Não foi possível consultar o Drive.' }, 502);
  }
};
