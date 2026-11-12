import { Redirect } from 'expo-router';

// Entrada do grupo de autenticação (o guard do layout raiz cai aqui quando deslogado)
export default function AuthIndex() {
  return <Redirect href="/login" />;
}
