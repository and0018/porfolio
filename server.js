import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "./src/store.js";
import { PostgresStore } from "./src/pg-store.js";
import { buildSeed, CATEGORIES } from "./src/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const VIEWS_DIR = path.join(__dirname, "views");

// No Render, discos persistentes costumam ser montados em /var/data. Se o
// serviço tiver um disco mas as variáveis não estiverem definidas, usa o disco.
const DETECTED_DISK = (() => {
  if (process.platform === "win32") return "";
  try {
    return fs.statSync("/var/data").isDirectory() ? "/var/data" : "";
  } catch {
    return "";
  }
})();

const DATA_DIR = path.resolve(
  process.env.DATA_DIR || (DETECTED_DISK || path.join(__dirname, "data"))
);
const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR ||
    (DETECTED_DISK ? path.join(DETECTED_DISK, "uploads") : path.join(PUBLIC_DIR, "uploads"))
);
const SESSION_COOKIE = "va_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const seedFactory = () => buildSeed(UPLOAD_DIR);
let store;
let storeWarning = "";

if (process.env.DATABASE_URL) {
  const pgStore = new PostgresStore({
    connectionString: process.env.DATABASE_URL,
    localFile: path.join(DATA_DIR, "db.json"),
    seedFactory,
    uploadDir: UPLOAD_DIR,
  });

  try {
    await pgStore.load();
    store = pgStore;
  } catch (error) {
    console.error("Não foi possível usar o Postgres:", error.message);
    storeWarning =
      "A conexão com o banco (DATABASE_URL) falhou. Os dados estão no disco temporário e podem sumir.";
    await pgStore.close().catch(() => {});
    store = new Store(path.join(DATA_DIR, "db.json"), seedFactory);
    await store.load();
  }
} else {
  store = new Store(path.join(DATA_DIR, "db.json"), seedFactory);
  await store.load();

  if (process.env.RENDER === "true") {
    storeWarning =
      "Este serviço está no Render Free, que apaga o disco a cada restart. Configure DATABASE_URL para manter os projetos e imagens.";
  }
}

/* -------------------------------------------------------------------------- */
/*  Segredos e sessão                                                          */
/* -------------------------------------------------------------------------- */

function readOrCreateSecret(file, factory) {
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  const value = factory();
  fs.writeFileSync(file, value, { mode: 0o600 });
  return value;
}

const sessionSecret = process.env.SESSION_SECRET
  ? process.env.SESSION_SECRET
  : readOrCreateSecret(path.join(DATA_DIR, "session-secret.txt"), () =>
      crypto.randomBytes(32).toString("hex")
    );

const adminPassword = process.env.ADMIN_PASSWORD
  ? process.env.ADMIN_PASSWORD
  : readOrCreateSecret(path.join(DATA_DIR, "admin-password.txt"), () =>
      IS_PROD ? crypto.randomBytes(9).toString("base64url") : "admin123"
    );

const usingDefaultPassword = !process.env.ADMIN_PASSWORD && adminPassword === "admin123";

function signSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE })).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySession(token) {
  if (!token || typeof token !== "string") return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

function parseCookies(header = "") {
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

function isAuthenticated(req) {
  return verifySession(parseCookies(req.headers.cookie || "")[SESSION_COOKIE]);
}

function sessionCookie(req, token, maxAge) {
  const secure = req.secure || (req.headers["x-forwarded-proto"] || "").includes("https");
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function requireAdmin(req, res, next) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: "Sessão expirada. Entre novamente." });
  }
  if (req.method !== "GET" && req.method !== "HEAD" && req.get("x-admin-request") !== "1") {
    return res.status(403).json({ error: "Requisição não autorizada." });
  }
  next();
}

/* -------------------------------------------------------------------------- */
/*  Helpers de conteúdo                                                        */
/* -------------------------------------------------------------------------- */

function cleanText(value, max) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function cleanUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.length > 900) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function cleanDigits(value, max = 15) {
  return String(value ?? "").replace(/\D/g, "").slice(0, max);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function serializeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

async function removeUpload(publicPath) {
  if (!publicPath || !String(publicPath).startsWith("/uploads/")) return;
  const filename = path.basename(String(publicPath));
  const target = path.join(UPLOAD_DIR, filename);
  if (!target.startsWith(UPLOAD_DIR)) return;
  try {
    fs.rmSync(target, { force: true });
  } catch (error) {
    console.warn("Não foi possível remover o arquivo:", target, error.message);
  }
  try {
    await store.deleteFile(filename);
  } catch (error) {
    console.warn("Não foi possível remover o arquivo do banco:", filename, error.message);
  }
}

const TIKTOK_ID_RE = /\/(?:video|photo)\/(\d{8,25})/;

async function resolveTikTokId(url) {
  if (!url) return "";
  const direct = url.match(TIKTOK_ID_RE);
  if (direct) return direct[1];

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    return "";
  }
  const isTikTok = hostname === "tiktok.com" || hostname.endsWith(".tiktok.com");
  if (!isTikTok) return "";

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    const match = response.url.match(TIKTOK_ID_RE);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/*  Uploads                                                                    */
/* -------------------------------------------------------------------------- */

const ALLOWED_MIME = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
]);

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME.get(file.mimetype) || ".bin";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Formato não aceito. Use JPG, PNG, WEBP, AVIF ou GIF."));
    }
    cb(null, true);
  },
});

function uploadError(error) {
  if (error.code === "LIMIT_FILE_SIZE") return "A imagem é muito grande. O limite é de 12 MB.";
  return error.message || "Não foi possível enviar a imagem.";
}

function singleUpload(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (error) => {
      if (error) return res.status(400).json({ error: uploadError(error) });
      next();
    });
  };
}

const uploadCover = singleUpload("cover");
const uploadAboutPhoto = singleUpload("aboutPhoto");

/* -------------------------------------------------------------------------- */
/*  Normalização de obras e configurações                                      */
/* -------------------------------------------------------------------------- */

function isTruthy(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

async function buildWork(req, existing = null) {
  const uploadedCover = req.file ? `/uploads/${req.file.filename}` : "";

  try {
    const title = cleanText(req.body.title, 110);
    if (!title) throw new Error("Dê um nome ao projeto.");

    const category = Object.prototype.hasOwnProperty.call(CATEGORIES, req.body.category)
      ? req.body.category
      : "outro";

    const tiktokUrl = cleanUrl(req.body.tiktokUrl);
    const tiktokId = tiktokUrl ? await resolveTikTokId(tiktokUrl) : "";

    let cover = existing?.cover || "";
    if (uploadedCover) {
      if (cover) await removeUpload(cover);
      cover = uploadedCover;
    } else if (isTruthy(req.body.removeCover) && cover) {
      await removeUpload(cover);
      cover = "";
    }

    if (req.file) await store.persistFile(req.file);

    return {
      title,
      category,
      description: cleanText(req.body.description, 2200),
      cover,
      tiktokUrl,
      tiktokId,
      externalUrl: cleanUrl(req.body.externalUrl),
      instagramUrl: cleanUrl(req.body.instagramUrl),
      client: cleanText(req.body.client, 70),
      year: cleanText(req.body.year, 12),
      featured: isTruthy(req.body.featured),
      published: isTruthy(req.body.published),
    };
  } catch (error) {
    if (uploadedCover) await removeUpload(uploadedCover);
    throw error;
  }
}

async function buildSettings(req, existing) {
  const limits = {
    siteName: 80,
    role: 50,
    monogram: 3,
    availability: 90,
    location: 90,
    heroTitleLead: 120,
    heroTitleAccent: 120,
    heroSubtitle: 500,
    heroPrimaryCta: 48,
    heroSecondaryCta: 48,
    aboutQuote: 160,
    aboutQuoteAccent: 160,
    aboutText: 4500,
    ctaTitle: 120,
    ctaAccent: 120,
    ctaText: 500,
    ctaNote: 90,
    footerNote: 260,
    seoDescription: 220,
    whatsappMessage: 320,
    whatsappDisplay: 40,
    email: 140,
  };

  const patch = {};
  for (const [key, max] of Object.entries(limits)) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      patch[key] = cleanText(req.body[key], max);
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "whatsapp")) {
    const number = cleanDigits(req.body.whatsapp);
    patch.whatsapp = number.length >= 10 ? number : "";
  }

  for (const key of ["tiktok", "instagram"]) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      patch[key] = cleanUrl(req.body[key]);
    }
  }

  if (typeof req.body.services === "string") {
    try {
      const parsed = JSON.parse(req.body.services);
      if (Array.isArray(parsed)) {
        patch.services = parsed
          .slice(0, 6)
          .map((service) => ({
            title: cleanText(service?.title, 70),
            description: cleanText(service?.description, 260),
          }))
          .filter((service) => service.title);
      }
    } catch {
      /* mantém os serviços atuais */
    }
  }

  let aboutPhoto = existing.aboutPhoto || "";
  if (req.file) {
    if (aboutPhoto) await removeUpload(aboutPhoto);
    aboutPhoto = `/uploads/${req.file.filename}`;
    await store.persistFile(req.file);
  } else if (isTruthy(req.body.removeAboutPhoto) && aboutPhoto) {
    await removeUpload(aboutPhoto);
    aboutPhoto = "";
  }
  patch.aboutPhoto = aboutPhoto;

  return patch;
}

/* -------------------------------------------------------------------------- */
/*  App                                                                        */
/* -------------------------------------------------------------------------- */

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/index.html", (_req, res) => res.redirect(301, "/"));

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    index: false,
    dotfiles: "deny",
    maxAge: "30d",
    immutable: true,
  })
);

// Depois de um restart do Render Free o arquivo local some, mas a imagem
// continua no Postgres. Este fallback serve a versão persistida.
app.get("/uploads/:name", async (req, res, next) => {
  try {
    const name = path.basename(req.params.name);
    if (!name || name !== req.params.name) return next();
    const file = await store.getFile(name);
    if (!file) return next();
    res.setHeader("Content-Type", file.mime || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    res.send(file.data);
  } catch (error) {
    next(error);
  }
});

app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    dotfiles: "deny",
    maxAge: 0,
    etag: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

/* ------------------------------- Autenticação ----------------------------- */

const loginAttempts = new Map();

function loginKey(req) {
  return req.ip || "desconhecido";
}

function isLoginBlocked(key) {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (entry.until && entry.until > Date.now()) return true;
  if (entry.until && entry.until <= Date.now()) {
    loginAttempts.delete(key);
    return false;
  }
  return false;
}

function registerFailure(key) {
  const entry = loginAttempts.get(key) || { count: 0, until: 0 };
  entry.count += 1;
  if (entry.count >= 6) {
    entry.until = Date.now() + 15 * 60 * 1000;
    entry.count = 0;
  }
  loginAttempts.set(key, entry);
}

app.post("/api/admin/login", (req, res) => {
  const key = loginKey(req);
  if (isLoginBlocked(key)) {
    return res.status(429).json({
      error: "Muitas tentativas. Aguarde 15 minutos e tente novamente.",
    });
  }

  const given = Buffer.from(String(req.body?.password ?? ""));
  const expected = Buffer.from(adminPassword);
  const ok = given.length === expected.length && crypto.timingSafeEqual(given, expected);

  if (!ok) {
    registerFailure(key);
    return res.status(401).json({ error: "Senha incorreta. Tente novamente." });
  }

  loginAttempts.delete(key);
  res.setHeader("Set-Cookie", sessionCookie(req, signSession(), SESSION_MAX_AGE / 1000));
  res.json({ ok: true });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  res.setHeader("Set-Cookie", sessionCookie(req, "", 0));
  res.json({ ok: true });
});

/* --------------------------------- Público -------------------------------- */

function publicPayload() {
  return {
    settings: store.settings,
    works: store.published(),
    categories: CATEGORIES,
  };
}

app.get("/api/site", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(publicPayload());
});

app.get("/", (req, res) => {
  const settings = store.settings;
  const works = store.published();
  const base = (process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
  const featured = works.find((work) => work.featured) || works[0];
  const ogImage = featured?.cover
    ? featured.cover.startsWith("http")
      ? featured.cover
      : `${base}${featured.cover}`
    : `${base}/favicon.svg`;

  const title = `${settings.siteName} — ${settings.role}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.siteName,
    jobTitle: settings.role,
    description: settings.seoDescription,
    url: base,
    sameAs: [settings.tiktok, settings.instagram].filter(Boolean),
    ...(settings.whatsapp ? { telephone: `+${settings.whatsapp}` } : {}),
  };

  let html;
  try {
    html = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"), "utf8");
  } catch {
    return res.status(500).send("Template da página inicial não encontrado.");
  }

  html = html
    .replaceAll("__SITE_TITLE__", escapeHtml(title))
    .replaceAll("__SITE_DESC__", escapeHtml(settings.seoDescription))
    .replaceAll("__SITE_URL__", escapeHtml(base))
    .replaceAll("__OG_IMAGE__", escapeHtml(ogImage))
    .replaceAll("__BOOTSTRAP__", serializeJson(publicPayload()))
    .replaceAll("__JSON_LD__", serializeJson(jsonLd))
    .replaceAll("__YEAR__", String(new Date().getFullYear()))
    .replaceAll(
      "__ADMIN_LINK__",
      isAuthenticated(req) ? '<a class="footer-admin" href="/admin">Painel do estúdio</a>' : ""
    );

  res.setHeader("Cache-Control", "no-store");
  res.type("html").send(html);
});

app.get("/sitemap.xml", (req, res) => {
  const base = (process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
  const urls = [
    `${base}/`,
    `${base}/#vitrine`,
    `${base}/#sobre`,
    `${base}/#servicos`,
    `${base}/#contato`,
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}
</urlset>`;
  res.type("application/xml").send(xml);
});

/* ---------------------------------- Admin --------------------------------- */

app.get("/admin", (req, res) => {
  const page = isAuthenticated(req) ? "admin.html" : "admin-login.html";
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(VIEWS_DIR, page));
});

app.get("/api/admin/data", requireAdmin, (_req, res) => {
  const works = store.sortedWorks();
  res.setHeader("Cache-Control", "no-store");
  res.json({
    settings: store.settings,
    works,
    categories: CATEGORIES,
    usingDefaultPassword,
    demoCount: works.filter((work) => work.demo).length,
    storage: {
      mode: store.kind,
      persistent: store.kind === "postgres",
      warning: storeWarning,
    },
  });
});

app.post("/api/admin/works", requireAdmin, uploadCover, async (req, res) => {
  try {
    const data = await buildWork(req);
    const now = new Date().toISOString();
    const work = {
      id: crypto.randomUUID(),
      ...data,
      order: store.nextOrder(),
      createdAt: now,
      updatedAt: now,
    };
    await store.addWork(work);
    res.status(201).json({ work });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível salvar o projeto." });
  }
});

app.put("/api/admin/works/:id", requireAdmin, uploadCover, async (req, res) => {
  const existing = store.getWork(req.params.id);
  if (!existing) return res.status(404).json({ error: "Projeto não encontrado." });

  try {
    const data = await buildWork(req, existing);
    const work = await store.updateWork(existing.id, {
      ...data,
      ...(existing.demo ? { demo: false } : {}),
      updatedAt: new Date().toISOString(),
    });
    res.json({ work });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível salvar o projeto." });
  }
});

app.post("/api/admin/works/:id/status", requireAdmin, async (req, res) => {
  try {
    const existing = store.getWork(req.params.id);
    if (!existing) return res.status(404).json({ error: "Projeto não encontrado." });
    const work = await store.updateWork(existing.id, {
      published: isTruthy(req.body?.published),
      ...(existing.demo ? { demo: false } : {}),
      updatedAt: new Date().toISOString(),
    });
    res.json({ work });
  } catch (error) {
    res.status(500).json({ error: error.message || "Não foi possível atualizar o projeto." });
  }
});

app.delete("/api/admin/works/:id", requireAdmin, async (req, res) => {
  try {
    const removed = await store.removeWork(req.params.id);
    if (!removed) return res.status(404).json({ error: "Projeto não encontrado." });
    await removeUpload(removed.cover);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "Não foi possível excluir o projeto." });
  }
});

app.post("/api/admin/works/reorder", requireAdmin, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
  if (!ids.length) return res.status(400).json({ error: "Ordem inválida." });
  try {
    res.json({ works: await store.reorder(ids) });
  } catch (error) {
    res.status(500).json({ error: error.message || "Não foi possível reordenar os projetos." });
  }
});

app.post("/api/admin/works/clear-demo", requireAdmin, async (req, res) => {
  try {
    const demos = store.works.filter((work) => work.demo);
    for (const work of demos) {
      await store.removeWork(work.id);
      await removeUpload(work.cover);
    }
    res.json({ ok: true, removed: demos.length });
  } catch (error) {
    res.status(500).json({ error: error.message || "Não foi possível remover os exemplos." });
  }
});

app.put("/api/admin/settings", requireAdmin, uploadAboutPhoto, async (req, res) => {
  try {
    const patch = await buildSettings(req, store.settings);
    const settings = await store.updateSettings(patch);
    res.json({ settings });
  } catch (error) {
    res.status(400).json({ error: error.message || "Não foi possível salvar as configurações." });
  }
});

app.get("/api/admin/export", requireAdmin, (_req, res) => {
  const payload = { exportedAt: new Date().toISOString(), settings: store.settings, works: store.sortedWorks() };
  res.setHeader("Content-Disposition", `attachment; filename="portfolio-${new Date().toISOString().slice(0, 10)}.json"`);
  res.type("application/json").send(JSON.stringify(payload, null, 2));
});

/* ---------------------------------- 404 ----------------------------------- */

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Recurso não encontrado." });
  }
  res.status(404).sendFile(path.join(VIEWS_DIR, "404.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (res.headersSent) return;
  res.status(500).json({ error: "Erro interno. Tente novamente." });
});

app.listen(PORT, () => {
  console.log("");
  console.log("  Vinicius Almeida — portfólio");
  console.log(`  Site:  http://localhost:${PORT}`);
  console.log(`  Admin: http://localhost:${PORT}/admin`);
  console.log(
    `  Dados: ${store.kind === "postgres" ? "Postgres (persistente)" : DATA_DIR}`
  );
  if (storeWarning) console.log(`  ⚠ ${storeWarning}`);
  if (usingDefaultPassword) {
    console.log(`  Senha padrão do admin: ${adminPassword}`);
    console.log("  ⚠ Defina ADMIN_PASSWORD antes de publicar o site.");
  } else if (!process.env.ADMIN_PASSWORD) {
    console.log(`  Senha do admin salva em: ${path.join(DATA_DIR, "admin-password.txt")}`);
  } else {
    console.log("  Senha do admin definida por ADMIN_PASSWORD.");
  }
  console.log("");
});
