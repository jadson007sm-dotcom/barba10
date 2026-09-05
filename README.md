# BARBA10

SaaS multi-tenant para barbearias construído com Next.js 14 App Router, TypeScript strict, Tailwind e Supabase.

## Stack
- Next.js 14 + React 18
- TypeScript strict
- Tailwind CSS
- Supabase Auth/PostgreSQL/RLS/Storage-ready
- Vercel

## 1. Instalação
```bash
git clone https://github.com/jadson007sm-dotcom/barba10.git
cd barba10
npm install
cp .env.example .env.local
npm run dev
```

## 2. Supabase
1. Crie um projeto gratuito no Supabase.
2. Em SQL Editor, execute `supabase/schema.sql`.
3. Execute `supabase/public-booking.sql`.
4. Execute `supabase/seed.sql`.
5. Em Authentication, crie o usuário administrador e confirme o e-mail. Não mantenha senhas de produção no GitHub.
6. Copie Project URL e anon/publishable key para `.env.local`.

## 3. Variáveis
`NEXT_PUBLIC_SUPABASE_URL` = Project URL.
`NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave pública anon/publishable.

## 4. Auth
O Supabase Auth é responsável por armazenar e fazer hash das senhas. O requisito de WhatsApp é implementado como segunda etapa de verificação: o código tem 5 números + 1 letra e, inicialmente, o envio é simulado no console.

Para o fluxo funcionar como autenticação por WhatsApp sem confirmação de e-mail, configure o projeto de Auth de acordo com sua política de produção. Nunca coloque `service_role` ou chaves secretas em `NEXT_PUBLIC_*`.

## 5. Rotas
- `/login`, `/register`, `/register/verify`
- `/admin`, `/admin/tenants`
- `/tenant/dashboard`, `/tenant/shops`, `/tenant/staff`, `/tenant/services`, `/tenant/appointments`
- `/shop/dashboard`, `/shop/appointments`, `/shop/cashier`
- `/barber/dashboard`, `/barber/appointments`, `/barber/commissions`
- `/customer/dashboard`, `/customer/history`, `/customer/loyalty`
- `/:slug` e `/:slug/booking`

## 6. Segurança
RLS está habilitado em todas as tabelas. As funções de autorização consultam `auth.uid()` e o tenant do perfil. O middleware atualiza a sessão e bloqueia áreas privadas sem autenticação. Para produção, mantenha também validações de autorização no servidor e use funções RPC/service role apenas em código server-side controlado.

## 7. Deploy Vercel
1. Importe o repositório no Vercel.
2. Framework: Next.js.
3. Adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas variáveis de Production, Preview e Development.
4. Deploy. Cada push na `main` gera novo deployment.

## 8. GitHub
```bash
git add .
git commit -m "feat: BARBA10"
git push origin main
```

## Observações
O sistema-base está organizado para evolução por módulos. Integrações reais de WhatsApp (Twilio/WhatsApp Business API), Storage de logos, CRUD avançado de staff/services/shops, caixa e regras comerciais devem ser adicionados sem expor credenciais administrativas ao navegador.
