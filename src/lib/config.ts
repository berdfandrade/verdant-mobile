import { Platform } from 'react-native';

/*
  URL da API (verdant-nest).
  Defina EXPO_PUBLIC_API_URL no .env. Sem ela:
  - emulador Android acessa o host por 10.0.2.2
  - iOS simulator / web usam localhost
  Em celular físico use o IP da sua máquina na rede (ex.: http://192.168.0.10:3000).
*/
const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || fallback).replace(/\/$/, '');
