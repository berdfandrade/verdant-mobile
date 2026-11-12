<p align="center">
  <img src="assets/images/logo.png" alt="Verdant" width="220" />
</p>

<p align="center">
  App mobile do <strong>Verdant</strong>: feed por proximidade com swipe, matches e chat em tempo real.<br/>
  Cliente da API <a href="https://github.com/berdfandrade/verdant-nest">verdant-nest</a>.
</p>

---

## Funcionalidades

- 🔐 **Cadastro e login** com validação no app (e-mail, celular, data de nascimento, 18+) e sessão salva com segurança (Keychain/Keystore via `expo-secure-store`)
- ♻️ **Renovação automática do token**: quando o access token expira, o app troca o refresh token por um novo par e repete a requisição, sem deslogar
- 🧭 **Descobrir**: cards com gesto de arrastar (direita curte, esquerda passa) ou botões, distância e idade de cada perfil
- 💚 **Match**: modal "É um match!" com atalho para a conversa
- 💬 **Chat em tempo real** (Socket.IO): histórico paginado, entrega instantânea, reconexão automática e envio via HTTP quando o socket cai
- ❤️ **Matches** e **quem curtiu você**
- ⚙️ **Perfil**: preferências do feed (distância e faixa etária), localização e logout
- 🌗 Tema claro/escuro automático

## Stack

| | |
| --- | --- |
| Framework | [Expo SDK 58](https://docs.expo.dev) + React Native 0.88 + TypeScript |
| Navegação | [Expo Router](https://docs.expo.dev/router/introduction/) (rotas por arquivo em `src/app`) |
| Dados | [TanStack Query](https://tanstack.com/query) (cache, paginação infinita do chat) + axios |
| Sessão | [Zustand](https://zustand.docs.pmnd.rs) + `expo-secure-store` |
| Tempo real | `socket.io-client` |
| Gestos/animação | `react-native-gesture-handler` 3 + `react-native-reanimated` 4 |
| Testes | Jest (`jest-expo`) |

## Como rodar

**Pré-requisitos:** Node 20+ e a [API verdant-nest](https://github.com/berdfandrade/verdant-nest) rodando (por padrão em `http://localhost:3000`).

```bash
npm install
cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL
npm start              # abre o Expo (QR code, Android, iOS ou web)
```

| Onde roda o app | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Navegador / simulador iOS | `http://localhost:3000` |
| Emulador Android | `http://10.0.2.2:3000` |
| Celular físico (Expo Go ou dev build) | `http://<IP-da-sua-máquina>:3000` (mesma rede Wi-Fi) |

> Sem a variável, o app usa `10.0.2.2` no Android e `localhost` no resto.

### Scripts

| Script | O que faz |
| --- | --- |
| `npm start` | Servidor do Expo |
| `npm run android` / `ios` / `web` | Abre direto na plataforma |
| `npm test` | Testes (Jest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (config do Expo) |

## Estrutura

```
src/
├── app/                    # Rotas (Expo Router)
│   ├── _layout.tsx         # Providers + guard de autenticação (Stack.Protected)
│   ├── (auth)/             # login, cadastro
│   ├── (tabs)/             # Descobrir, Matches, Conversas, Perfil
│   └── chat/[id].tsx       # Conversa
├── api/
│   ├── client.ts           # axios + refresh automático + mensagens de erro em PT
│   ├── endpoints.ts        # Uma função por rota da API
│   └── types.ts            # Tipos das respostas (espelham a API)
├── components/             # UI compartilhada, card de swipe
├── hooks/                  # use-chat, use-realtime, use-sync-location, use-me...
├── lib/                    # socket, query client, validações, formatação
└── store/auth.ts           # Sessão (Zustand)
```

**Tipos da API:** `src/api/types.ts` espelha os schemas/DTOs do `verdant-nest`. Quando um contrato mudar na API, atualize aqui também.

## Como funciona

- **Autenticação:** o layout raiz usa `Stack.Protected`. Sem sessão só existem as rotas de `(auth)`; logado, só as abas e o chat. No logout, o app avisa a API (`POST /login/logout`), apaga os tokens e limpa o cache.
- **Refresh:** em um `401`, o cliente chama `POST /login/refresh` **uma única vez**, mesmo com várias requisições falhando juntas, e repete todas. Se o refresh falhar, a sessão é encerrada.
- **Socket:** uma conexão por sessão, autenticada com o token atual a cada (re)conexão. Se o servidor recusar o token (`auth_error`), o app renova o token e reconecta.
- **Chat:** mensagens novas (evento `new_message`) entram direto no cache do React Query, sem duplicar (o mesmo `_id` pode chegar pelo socket e pela resposta HTTP).
- **Localização:** pedida ao abrir o app e enviada para `PUT /profile/location`. Sem localização salva, o feed mostra um aviso para permitir o acesso.

## Testes

```bash
npm test
```

Cobrem o cliente HTTP (token, refresh único, logout quando o refresh falha), a sessão, o cache do chat, as validações do cadastro e a formatação de idade, distância e horário. Inclui o caso de datas UTC da API, que mostravam a idade errada no fuso do Brasil.

## Próximos passos

- [ ] Upload de fotos (a API ainda só aceita URLs)
- [ ] Notificações push (`expo-notifications`) para matches e mensagens
- [ ] Editar o perfil completo (bio, interesses, "sobre mim")
- [ ] Indicador de "digitando" e confirmação de leitura
- [ ] Build com EAS (`npx eas-cli@latest build`)
