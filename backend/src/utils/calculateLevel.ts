export const calcularNivel = (xp: number): number => {
  return Math.floor(xp / 500) + 1;
};