export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const range = (a, b) => Array.from({ length: Math.max(b - a + 1, 0) }, (_, i) => a + i);
export const randomArray = (n, max = 60) => Array.from({ length: n }, () => randInt(3, max));
