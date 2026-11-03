# Deploy — Vinicius Almeida

Este projeto é um servidor Node/Express com persistência em arquivo
(`data/db.json`), uploads em disco e sessão assinada. Por isso ele **não roda no
Netlify como está**: Netlify hospeda sites estáticos e funções sem servidor, mas
não oferece um processo Node contínuo nem um disco gravável.

Resumo das opções:

| Plataforma | Custo aproximado | Mantém o projeto como está? | Dados persistem? |
| --- | --- | --- | --- |
| Render com disco | ~US$ 7,25/mês | Sim | Sim |
| Render Free | US$ 0 | Sim, com ressalvas | **Não** |
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
- `DATA_DIR` / `UPLOAD_DIR` — pastas do disco persistente.

Nunca comite `.env`, `data/db.json`, `data/*.txt` ou imagens enviadas. O
`.gitignore` já cobre esses arquivos.

---

## Opção 1 — Render com disco persistente (recomendado)

O repositório já inclui `render.yaml` com disco de 1 GB em `/var/data`.

1. Suba o código para o GitHub (veja o fim deste arquivo).
2. No Render, escolha **New → Blueprint** e conecte o repositório.
3. O Render lê o `render.yaml` e pede os valores de `ADMIN_PASSWORD` e
   `SITE_URL`. Se ainda não tiver domínio, use a URL provisória
   `https://<nome-do-servico>.onrender.com` e atualize depois.
4. Confirme o disco `portfolio-data` montado em `/var/data`.
5. Faça o primeiro deploy e acompanhe os logs até a mensagem
   `Vinicius Almeida — portfólio`.

O `render.yaml` usa `plan: starter` (serviço pago). Disco persistente **não
existe no plano Free**.

Depois do deploy:

- Abra `https://seu-site/healthz` e confirme `{"ok":true}`.
- Entre em `/admin` com a senha definida.
- Faça um upload de teste e um redeploy. A imagem e os dados devem continuar lá.

---

## Opção 2 — Render Free (somente demonstração)

Serve para mostrar o site, mas **não para uso real**: o sistema de arquivos é
efêmero. A cada deploy, restart ou spin-down após 15 minutos ocioso, o Render
recria o container e você perde `db.json` e os uploads.

1. Render → **New → Web Service** → conecte o repositório.
2. Runtime: **Node**. Build: `npm ci`. Start: `node server.js`.
3. Health check: `/healthz`.
4. Variáveis: `NODE_ENV=production`, `ADMIN_PASSWORD`, `SESSION_SECRET`,
   `SITE_URL`. **Não** defina `DATA_DIR` nem `UPLOAD_DIR`.
5. Não crie disco.

Se quiser manter um backup antes de cada deploy, use **Exportar backup** no
painel. As imagens enviadas continuam sendo perdidas; capas de exemplo são
regeneradas no próximo start.

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
| Dados voltam ao estado inicial | Sem disco persistente ou `DATA_DIR` fora do volume | Monte o disco e aponte `DATA_DIR`/`UPLOAD_DIR` para ele |
| Imagens somem após deploy | `UPLOAD_DIR` em pasta efêmera | Mova para o volume persistente |
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
