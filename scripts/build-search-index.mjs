#!/usr/bin/env node
/**
 * npm run build:search-index
 * Regenera apenas o índice de busca a partir das aulas em disco.
 * (O sync-content já faz isso; este script existe para uso isolado.)
 */
import { loadLessons, readJson, writeJsonIfChanged } from '../lib/content-sync/io.mjs';
import { MANIFEST_PATH, SEARCH_INDEX_PATH } from '../lib/content-sync/paths.mjs';
import { buildManifest, buildSearchIndex } from '../lib/content-sync/manifest.mjs';
import { computeContentHash } from '../lib/content-sync/utils.mjs';

const { lessons } = loadLessons();
const withHash = lessons.map((l) => ({ ...l, contentHash: computeContentHash(l) }));
const previous = readJson(MANIFEST_PATH, null);
const manifest = previous ?? buildManifest(withHash, null);
const index = buildSearchIndex(withHash, manifest);

const changed = writeJsonIfChanged(SEARCH_INDEX_PATH, index);
console.log(`Search index: ${index.total} documentos — ${changed ? 'atualizado' : 'sem alterações'}`);
