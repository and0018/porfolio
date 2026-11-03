# Vinicius Almeida — Designer & Motion

Portfólio público com vitrine de projetos, player de TikTok integrado e um painel
administrativo para publicar e editar o conteúdo — sem banco de dados externo.

- **Site:** apresenta os projetos publicados em uma galeria filtrável.
- **Modal:** cada trabalho abre com descrição, metadados, link e CTA de contato.
- **Vídeos:** links do TikTok viram player dentro do site.
- **Instagram/artes:** capas de imagem com upload direto pelo painel.
- **CTA:** botão flutuante e chamadas para o WhatsApp configurado.
- **Admin:** cria, edita, publica, reordena e exclui projetos; edita todos os textos
  institucionais e exporta um backup em JSON.

---

## Rodando localmente

Requisitos: **Node.js 20 ou superior**.

```bash
npm install
npm start
```

- Site: <http://localhost:3000>
- Painel: <http://localhost:3000/admin>

Em desenvolvimento, sem `ADMIN_PASSWORD` definida, a senha do painel é
**`admin123`**. Para desenvolver com recarga automática:

```bash
npm run dev
```

O projeto **não carrega `.env` automaticamente**. Consulte `.env.example` como
referência e exporte as variáveis no shell (ou use `docker run --env-file .env`).
Exemplo no PowerShell:

```powershell
$env:ADMIN_PASSWORD = "uma-senha-longa"
$env:SESSION_SECRET = "um-segredo-aleatorio"
npm start
```

> Variáveis definidas no ambiente têm prioridade sobre os segredos gerados
> automaticamente em `data/`.

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `PORT` | não | Porta do servidor. Padrão: `3000`. |
| `ADMIN_PASSWORD` | em produção | Senha do painel. Sem ela, o servidor gera uma senha aleatória em produção (`data/admin-password.txt`). |
| `SESSION_SECRET` | recomendada | Segredo HMAC da sessão. Sem ela, é gerado em `data/session-secret.txt`. |
| `SITE_URL` | recomendada | URL pública (ex.: `https://viniciusalmeida.com`), usada em metatags, Open Graph, JSON-LD e sitemap. |
| `DATA_DIR` | não | Pasta do `db.json` e dos segredos. Padrão: `./data`. |
| `UPLOAD_DIR` | não | Pasta das imagens enviadas. Padrão: `./public/uploads`. |
| `NODE_ENV` | não | Use `production` em produção. |

Em produção com disco persistente, aponte as duas pastas para o disco:

```bash
DATA_DIR=/var/data
UPLOAD_DIR=/var/data/uploads
```

Sem disco persistente (ex.: plano gratuito do Render/Railway), **os projetos e
as imagens enviadas são perdidos a cada deploy/restart**. Nesse caso, use o
botão **Exportar backup** antes de publicar uma nova versão.

---

## Usando o painel

1. Acesse `/admin` e entre com a senha administrativa.
2. Em **Projetos**, clique em **Novo projeto**.
3. Preencha título, categoria, ano, descrição e cliente.
4. Adicione uma capa (JPG, PNG, WEBP, AVIF ou GIF, até 12 MB) e/ou cole o link
   de um vídeo do TikTok.
5. Marque **Publicado** para exibir na vitrine; use **Destaque** para o projeto
   aparecer no topo.
6. Em **Configurações**, edite nome, bio, serviços, CTAs, WhatsApp, redes e SEO.
7. A mesma tela permite **Exportar backup** e remover os projetos de exemplo
   (`demo: true`) de uma só vez.

### TikTok

Cole a URL completa do vídeo, por exemplo:

```text
https://www.tiktok.com/@usuario/video/7106594312292453675
```

O servidor extrai o ID e monta o embed `https://www.tiktok.com/embed/v2/{id}`.
Links curtos (`vm.tiktok.com`, `vt.tiktok.com`) são resolvidos no servidor.
O player só carrega depois do clique em **Reproduzir no site**, o que mantém a
página leve e evita cookies de terceiros antes da interação.

### WhatsApp

O número e a mensagem padrão ficam em **Configurações**. O valor inicial é
`5595984130864` (somente dígitos, com DDI + DDD). Todos os botões de contato do
site usam esse número.

---

## Estrutura do projeto

```text
server.js               Express, autenticação, uploads, APIs e SEO
src/store.js            Persistência em JSON e ordenação dos projetos
src/seed.js             Conteúdo inicial, categorias e capas SVG de exemplo
public/index.html       Shell da página pública
public/assets/          CSS e JavaScript do site
views/                  Páginas do admin e 404
data/                   db.json + segredos (gerado em runtime, não versionado)
public/uploads/         Imagens enviadas e capas de exemplo
```

### Endpoints úteis

| Rota | Descrição |
| --- | --- |
| `GET /api/site` | Conteúdo público (configurações + projetos publicados). |
| `GET /sitemap.xml` | Sitemap gerado a partir de `SITE_URL`. |
| `GET /healthz` | Verificação de saúde (`{ "ok": true }`). |
| `GET /api/admin/export` | Backup JSON (requer sessão). |

---

## Deploy

### Docker

```bash
docker build -t vinicius-portfolio .
docker run -p 3000:3000 \
  -e ADMIN_PASSWORD="troque-esta-senha" \
  -e SESSION_SECRET="um-segredo-longo-e-aleatorio" \
  -e SITE_URL="https://seudominio.com" \
  -v portfolio-data:/app/data \
  -v portfolio-uploads:/app/public/uploads \
  vinicius-portfolio
```

### Render

O arquivo `render.yaml` descreve o serviço com disco persistente em `/var/data`.
No Render:

1. Crie um **Blueprint** a partir do repositório.
2. Defina `ADMIN_PASSWORD` e `SITE_URL` quando solicitado.
3. Confirme o disco de 1 GB (necessário para manter dados e uploads).

O plano gratuito não inclui disco persistente; nesse caso, remova o bloco
`disk` e as variáveis `DATA_DIR`/`UPLOAD_DIR` do blueprint, sabendo que os dados
serão efêmeros.

### Railway / VPS

Use `npm ci --omit=dev` como build e `node server.js` como start. Monte um volume
persistente e aponte `DATA_DIR`/`UPLOAD_DIR` para ele (`/var/data` e
`/var/data/uploads`, por exemplo).

---

## Checklist antes de publicar

- [ ] Definir `ADMIN_PASSWORD` forte e `SESSION_SECRET` aleatório.
- [ ] Definir `SITE_URL` com o domínio final.
- [ ] Trocar ou remover os projetos marcados como exemplo no painel.
- [ ] Publicar o link do TikTok e o Instagram em **Configurações**.
- [ ] Revisar WhatsApp, textos, serviços e SEO.
- [ ] Testar login, upload, publicação e abertura de um vídeo no site.
- [ ] Configurar disco persistente e testar um redeploy.

---

## Segurança e limites

- Sessão assinada com HMAC-SHA256 em cookie `HttpOnly`, `SameSite=Lax` e
  `Secure` quando a requisição é HTTPS.
- Login com limite de tentativas por IP.
- Requisições de escrita do admin exigem o cabeçalho `x-admin-request: 1`
  (proteção simples contra CSRF).
- Uploads aceitam apenas imagens, com limite de 12 MB por arquivo.
- Cabeçalhos de segurança, `robots.txt` e página 404 personalizada inclusos.

---

## Notas

- As capas de exemplo são SVGs gerados no primeiro start e marcados com
  `demo: true`; ao editar um projeto de exemplo, a marcação é removida.
- O conteúdo é salvo em `data/db.json` de forma atômica. Faça backups
  periódicos do arquivo e da pasta de uploads.
- Se alterar CSS/JS, atualize o parâmetro `?v=` nas páginas para invalidar o
  cache dos navegadores.
