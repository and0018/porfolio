import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { DEFAULT_SETTINGS } from "./seed.js";

const { Pool } = pg;

const CREATE_STATE = `
  CREATE TABLE IF NOT EXISTS portfolio_state (
    id integer PRIMARY KEY,
    data jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`;

const CREATE_FILES = `
  CREATE TABLE IF NOT EXISTS portfolio_files (
    name text PRIMARY KEY,
    mime text NOT NULL,
    data bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

const MIME_BY_EXT = new Map([
  [".svg", "image/svg+xml"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".gif", "image/gif"],
]);

function poolConfig(connectionString) {
  let local = false;
  try {
    const host = new URL(connectionString).hostname;
    local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    /* deixa o pg validar a URL */
  }

  return {
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ssl: local ? false : { rejectUnauthorized: false },
  };
}

/**
 * Persistência externa opcional para o Render Free.
 *
 * O plano Free do Render apaga o disco a cada restart/spin-down. Quando
 * DATABASE_URL está definida, o banco guarda o JSON do site e as imagens.
 * Sem ela, o app continua usando o arquivo local (src/store.js).
 */
export class PostgresStore {
  constructor({ connectionString, localFile, seedFactory, uploadDir }) {
    this.connectionString = connectionString;
    this.localFile = localFile;
    this.seedFactory = seedFactory;
    this.uploadDir = uploadDir;
    this.db = null;
    this.pool = null;
    this.kind = "postgres";
  }

  async load() {
    this.pool = new Pool(poolConfig(this.connectionString));
    this.pool.on("error", (error) => {
      console.error("Erro na conexão com o Postgres:", error.message);
    });

    await this.pool.query(CREATE_STATE);
    await this.pool.query(CREATE_FILES);

    const result = await this.pool.query("SELECT data FROM portfolio_state WHERE id = 1");
    const hasRemoteState = result.rows.length > 0;

    let db;
    if (hasRemoteState) {
      db = result.rows[0].data;
    } else if (fs.existsSync(this.localFile)) {
      try {
        db = JSON.parse(fs.readFileSync(this.localFile, "utf8"));
      } catch {
        db = this.seedFactory();
      }
      this.db = db;
      await this.syncLocalFiles();
    } else {
      db = this.seedFactory();
      this.db = db;
      await this.syncLocalFiles();
    }

    this.db = db;
    this.ensureShape();

    if (!hasRemoteState) await this.save();
    return this.db;
  }

  ensureShape() {
    this.db.settings = { ...DEFAULT_SETTINGS, ...(this.db.settings || {}) };
    if (!Array.isArray(this.db.works)) this.db.works = [];
    if (!Array.isArray(this.db.settings.services)) {
      this.db.settings.services = DEFAULT_SETTINGS.services.map((service) => ({ ...service }));
    }
  }

  async syncLocalFiles() {
    if (!fs.existsSync(this.uploadDir)) return;

    for (const name of fs.readdirSync(this.uploadDir)) {
      const file = path.join(this.uploadDir, name);
      let stat;
      try {
        stat = fs.statSync(file);
      } catch {
        continue;
      }
      if (!stat.isFile()) continue;

      const mime = MIME_BY_EXT.get(path.extname(name).toLowerCase()) || "application/octet-stream";
      await this.saveFile(name, fs.readFileSync(file), mime);
    }
  }

  async save() {
    if (!this.db) throw new Error("Banco de dados ainda não foi carregado.");
    await this.pool.query(
      `INSERT INTO portfolio_state (id, data, updated_at)
       VALUES (1, $1, now())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [this.db]
    );
    return this.db;
  }

  get settings() {
    return this.db.settings;
  }

  get works() {
    return this.db.works;
  }

  sortedWorks() {
    return [...this.works].sort(
      (a, b) =>
        (Number(a.order) || 0) - (Number(b.order) || 0) ||
        String(a.createdAt).localeCompare(String(b.createdAt))
    );
  }

  published() {
    return this.sortedWorks().filter((work) => work.published);
  }

  getWork(id) {
    return this.works.find((work) => work.id === id) || null;
  }

  async addWork(work) {
    this.db.works.push(work);
    await this.save();
    return work;
  }

  async updateWork(id, patch) {
    const index = this.works.findIndex((work) => work.id === id);
    if (index === -1) return null;
    this.db.works[index] = { ...this.db.works[index], ...patch };
    await this.save();
    return this.db.works[index];
  }

  async removeWork(id) {
    const index = this.works.findIndex((work) => work.id === id);
    if (index === -1) return null;
    const [removed] = this.db.works.splice(index, 1);
    await this.save();
    return removed;
  }

  async updateSettings(patch) {
    this.db.settings = { ...this.db.settings, ...patch };
    await this.save();
    return this.db.settings;
  }

  nextOrder() {
    return this.works.reduce((max, work) => Math.max(max, Number(work.order) || 0), 0) + 1;
  }

  async reorder(ids) {
    const positions = new Map(ids.map((id, index) => [id, index + 1]));
    this.db.works = this.works.map((work) => ({
      ...work,
      order: positions.has(work.id) ? positions.get(work.id) : work.order,
    }));
    await this.save();
    return this.sortedWorks();
  }

  async persistFile(file) {
    if (!file) return;
    const buffer = await fs.promises.readFile(file.path);
    await this.saveFile(file.filename, buffer, file.mimetype);
  }

  async saveFile(name, data, mime) {
    await this.pool.query(
      `INSERT INTO portfolio_files (name, mime, data)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data`,
      [name, mime || "application/octet-stream", data]
    );
  }

  async getFile(name) {
    const result = await this.pool.query(
      "SELECT mime, data FROM portfolio_files WHERE name = $1 LIMIT 1",
      [name]
    );
    if (!result.rows.length) return null;
    return { mime: result.rows[0].mime, data: result.rows[0].data };
  }

  async deleteFile(name) {
    await this.pool.query("DELETE FROM portfolio_files WHERE name = $1", [name]);
  }

  async close() {
    if (this.pool) await this.pool.end();
  }
}
