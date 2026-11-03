# Deploy — Vinicius Almeida

Este projeto é um servidor Node/Express com persistência em arquivo
(`data/db.json`), uploads em disco e sessão assinada. Por isso ele **não roda no
Netlify como está**: Netlify hospeda sites estáticos e funções sem servidor, mas
não oferece um processo Node contínuo nem um disco gravável.

Resumo das opções:

| Plataforma | Custo aproximado | Mantém o projeto como está? | Dados persistem? |
| --- | --- | --- | --- |
| Render Free + Postgres externo | US$ 0 | Sim | Sim |
| Render com disco | ~US$ 7,25/mês | Sim | Sim |
| Railway Hobby | US$ 5/mês | Sim | Sim (volume) |
| VPS + Docker | ~US$ 4–6/mês | Sim | Sim (volume) |
| Netlify Free | US$ 0 | Não | Exigiria refatoração |

> Preços consultados em novembro de 2026. Confirme no site de cada plataforma
> antes de contratar.

---

## Antes de qualquer deploy

Gere os segredos (não use os exemplos):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Você vai precisar de:

- `ADMIN_PASSWORD` — senha forte do painel `/admin`.
- `SESSION_SECRET` — o valor aleatório gerado acima.
- `SITE_URL` — URL final do site, com `https://` e sem barra no final.
- `DATABASE_URL` — connection string de um Postgres externo (grátis no Neon).
- `DATA_DIR` / `UPLOAD_DIR` — apenas se você usar um disco persistente.

Nunca comite `.env`, `data/db.json`, `data/*.txt` ou imagens enviadas. O
`.gitignore` já cobre esses arquivos.

> **Se o repositório já foi público:** os arquivos `data/admin-password.txt` e
> `data/password.txt` foram removidos do Git, mas a senha antiga deve ser
> considerada vazada. Troque `ADMIN_PASSWORD` em todas as plataformas.

---

## Opção 1 — Render Free + Postgres externo (recomendado para custo zero)

O plano Free do Render **não tem disco persistente**: a cada deploy, restart ou
spin-down após 15 minutos ocioso, o container é recriado e você perde `db.json`
e os uploads. A solução é guardar os dados fora do Render, em um Postgres
gratuito.

1. Crie uma conta grátis no [Neon](https://neon.tech) (ou use Supabase/Railway).
2. Crie um projeto/banco e copie a connection string, no formato
   `postgresql://usuario:senha@host/banco?sslmode=require`.
3. No Render, abra o serviço → **Environment** e adicione:
   - `DATABASE_URL` = connection string do Neon;
   - `ADMIN_PASSWORD` = senha forte do painel;
   - `SESSION_SECRET` = o valor aleatório gerado acima;
   - `SITE_URL` = URL pública, ex.: `https://seu-site.onrender.com`.
4. Faça o redeploy. No primeiro start o app cria as tabelas
   `portfolio_state` e `portfolio_files` automaticamente.
5. Entre em `/admin`, crie um projeto e faça um restart do serviço. O projeto e
   a imagem devem continuar lá.

O `render.yaml` do repositório já está configurado para esse caminho
(`plan: free` + `DATABASE_URL`). Se você estiver usando um serviço já criado,
basta adicionar a variável no painel e fazer o redeploy.

> O app também funciona com disco persistente (opção 2). Se `DATABASE_URL`
> estiver definida, o Postgres tem prioridade.

---

## Opção 2 — Render com disco persistente (pago)

Use o plano Starter e monte um disco em `/var/data`. O app detecta o disco
automaticamente, mesmo sem `DATA_DIR`/`UPLOAD_DIR`, mas definir as variáveis é
mais explícito:

1. Render → serviço → **Settings → Disks** → crie um disco de 1 GB em
   `/var/data`.
2. Em **Environment**, defina `DATA_DIR=/var/data` e
   `UPLOAD_DIR=/var/data/uploads`. Remova `DATABASE_URL` se ela existir.
3. Faça o redeploy e teste um upload + restart.

Com disco, os dados ficam no próprio Render e não dependem de um banco externo.

---

## Opção 3 — Railway

O Railway detecta Node automaticamente.

1. **New Project → Deploy from GitHub repo**.
2. Em **Variables**, defina:
   - `NODE_ENV=production`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `SITE_URL`
   - `DATA_DIR=/var/data`
   - `UPLOAD_DIR=/var/data/uploads`
3. Em **Volumes**, crie um volume montado em `/var/data`.
4. Em **Settings → Networking**, gere o domínio público.
5. Faça o deploy e teste `/healthz`, login e upload.

O plano Free tem US$ 1 de crédito mensal e volume pequeno; para um site em uso,
o plano Hobby (US$ 5/mês) é o mínimo realista.

---

## Opção 4 — VPS com Docker Compose

Requisitos: Docker e Docker Compose instalados, domínio apontando para o IP da
VPS (para HTTPS automático).

```bash
git clone <url-do-repositorio> portfolio
cd portfolio
cp .env.example .env
```

Edite `.env` e preencha pelo menos:

```dotenv
ADMIN_PASSWORD=uma-senha-forte
SESSION_SECRET=o-valor-aleatorio-gerado
SITE_URL=https://seudominio.com
SITE_DOMAIN=seudominio.com
```

O `docker-compose.yml` monta um volume persistente em `/var/data` e publica a
aplicação apenas em `127.0.0.1:3000` (não exposta diretamente à internet).

Somente a aplicação:

```bash
docker compose up -d --build
```

Com HTTPS automático via Caddy:

```bash
docker compose --profile proxy up -d --build
```

O Caddy usa o `Caddyfile` do repositório e emite o certificado assim que o DNS
do domínio apontar para a VPS. As portas 80 e 443 precisam estar liberadas.

Comandos úteis:

```bash
docker compose logs -f app
docker compose restart app
docker compose down
```

### Backup manual (VPS)

```bash
docker compose stop app
docker run --rm -v portfolio_portfolio-data:/data -v "$PWD:/backup" alpine \
  tar czf /backup/portfolio-backup-$(date +%F).tar.gz -C /data .
docker compose start app
```

Guarde também o backup JSON exportado pelo painel.

---

## Pós-deploy (vale para qualquer plataforma)

- [ ] `/healthz` responde `{"ok":true}`.
- [ ] A home abre com o conteúdo e as fontes corretas.
- [ ] Login em `/admin` funciona e a senha não é a de desenvolvimento.
- [ ] Criar, editar, publicar, reordenar e excluir um projeto.
- [ ] Enviar uma imagem e confirmar que ela aparece após recarregar.
- [ ] Salvar configurações (WhatsApp, redes, SEO).
- [ ] Abrir um projeto com TikTok e testar o player.
- [ ] Testar o site em celular (390 px) e desktop.
- [ ] Fazer um redeploy e confirmar que dados e uploads continuam.
- [ ] Exportar um backup JSON.
- [ ] Conferir `robots.txt`, `sitemap.xml` e as metatags com `SITE_URL` correto.

---

## Restaurar backup

1. Pare a aplicação.
2. Substitua `db.json` no disco persistente (`DATA_DIR/db.json`) pelo arquivo
   exportado. Se o backup vier do botão **Exportar backup**, ele contém
   `settings` e `works`; o formato é compatível com o `db.json`.
3. Copie a pasta de imagens para `UPLOAD_DIR`.
4. Inicie a aplicação e confira o painel.

Mantenha `SESSION_SECRET` estável. Se ele mudar, todas as sessões são
invalidadas (basta entrar novamente).

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| Dados voltam ao estado inicial | Sem disco persistente ou `DATA_DIR` fora do volume | No Free, configure `DATABASE_URL`; com disco, aponte `DATA_DIR`/`UPLOAD_DIR` para ele |
| Imagens somem após deploy | `UPLOAD_DIR` em pasta efêmera | No Free, configure `DATABASE_URL`; com disco, mova para o volume persistente |
| Login entra e volta para a tela de senha | Cookies `Secure` sem HTTPS ou proxy mal configurado | Acesse via HTTPS e mantenha `app.set("trust proxy", 1)` |
| Erro 413 no upload | Proxy limitando o corpo da requisição | Aumente o limite no proxy (o app aceita 12 MB) |
| Serviço reinicia sem parar | Porta errada ou falta de memória | Use `PORT` fornecida pela plataforma e confira os logs |
| `db.json` corrompido | Escrita interrompida | O app salva um `.broken-*`; restaure o backup JSON |

---

## Netlify

Não é possível publicar este projeto no Netlify sem reescrever a arquitetura:

- Express precisa virar Netlify Functions (ou outro backend).
- `data/db.json` precisa virar Netlify Database ou banco externo.
- Uploads precisam ir para Netlify Blob (ou S3/R2).
- O limite de payload das Functions é menor que os 12 MB aceitos hoje.
- Sessão e rate limit de login precisam de armazenamento compartilhado.

Se isso for desejado, trate como um projeto de migração separado, não como um
deploy do código atual. Para publicar agora, use Render, Railway ou VPS.

---

## Subir para o GitHub

```bash
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin master
```

Se o repositório já existir e estiver vazio, o comando acima funciona. Se você
preferir a branch `main`:

```bash
git branch -M main
git push -u origin main
```
