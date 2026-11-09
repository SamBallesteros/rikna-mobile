export const TOKENS_PER_PESO = 10;
export const tokensFromPesos = (pesos: number) => pesos * TOKENS_PER_PESO;
export const tokenMinorFromPesoMinor = (pesoMinor: number) => pesoMinor * TOKENS_PER_PESO;
export const pesoMinorFromTokenMinor = (tokenMinor: number) => tokenMinor / TOKENS_PER_PESO;
