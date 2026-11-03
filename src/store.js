import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS } from "./seed.js";

export class Store {
  constructor(file, seedFactory) {
    this.file = file;
    this.seedFactory = seedFactory;
    this.db = null;
  }

  load() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });

    if (fs.existsSync(this.file)) {
      try {
        this.db = JSON.parse(fs.readFileSync(this.file, "utf8"));
      } catch (error) {
        const backup = `${this.file}.broken-${Date.now()}`;
        fs.copyFileSync(this.file, backup);
        console.error(`Banco de dados inválido. Backup salvo em ${backup}`);
        this.db = this.seedFactory();
        this.save();
      }
    } else {
      this.db = this.seedFactory();
      this.save();
    }

    // Compatibilidade com versões futuras: garante que novas chaves existam.
    this.db.settings = { ...DEFAULT_SETTINGS, ...(this.db.settings || {}) };
    if (!Array.isArray(this.db.works)) this.db.works = [];
    if (!Array.isArray(this.db.settings.services)) {
      this.db.settings.services = DEFAULT_SETTINGS.services.map((s) => ({ ...s }));
    }
    return this.db;
  }

  get data() {
    if (!this.db) this.load();
    return this.db;
  }

  save() {
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2), "utf8");
    fs.renameSync(tmp, this.file);
  }

  get settings() {
    return this.data.settings;
  }

  get works() {
    return this.data.works;
  }

  sortedWorks() {
    return [...this.works].sort(
      (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.createdAt).localeCompare(String(b.createdAt))
    );
  }

  published() {
    return this.sortedWorks().filter((work) => work.published);
  }

  getWork(id) {
    return this.works.find((work) => work.id === id) || null;
  }

  addWork(work) {
    this.data.works.push(work);
    this.save();
    return work;
  }

  updateWork(id, patch) {
    const index = this.works.findIndex((work) => work.id === id);
    if (index === -1) return null;
    this.data.works[index] = { ...this.data.works[index], ...patch };
    this.save();
    return this.data.works[index];
  }

  removeWork(id) {
    const index = this.works.findIndex((work) => work.id === id);
    if (index === -1) return null;
    const [removed] = this.data.works.splice(index, 1);
    this.save();
    return removed;
  }

  updateSettings(patch) {
    this.data.settings = { ...this.data.settings, ...patch };
    this.save();
    return this.data.settings;
  }

  nextOrder() {
    return this.works.reduce((max, work) => Math.max(max, Number(work.order) || 0), 0) + 1;
  }

  reorder(ids) {
    const positions = new Map(ids.map((id, index) => [id, index + 1]));
    this.data.works = this.works.map((work) => ({
      ...work,
      order: positions.has(work.id) ? positions.get(work.id) : work.order,
    }));
    this.save();
    return this.sortedWorks();
  }
}
