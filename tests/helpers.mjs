/**
 * A lógica de revisão espaçada vive em src/services (TypeScript, consumido pelo
 * app). Este helper reimplementa o cálculo de datas em JS puro para que o teste
 * do pipeline de conteúdo não dependa do bundler — e serve de verificação
 * cruzada: se as duas implementações divergirem, o teste quebra.
 */
export const INTERVALOS_DIAS = [1, 7, 21, 30];

export function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function bucketReviewsShim(base) {
  return INTERVALOS_DIAS.map((dias) => addDays(base, dias));
}
