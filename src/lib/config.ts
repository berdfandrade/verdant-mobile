/*
  URL da API (verdant-nest), usada pelo HTTP e pelo socket.
  Por padrão é a API no Railway, que funciona em qualquer rede, emulador ou build.
  Para usar a API local, defina EXPO_PUBLIC_API_URL no .env (veja .env.example).
*/
const RAILWAY_API_URL = 'https://verdant-nest-production.up.railway.app';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || RAILWAY_API_URL).replace(/\/$/, '');
