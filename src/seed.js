import fs from "node:fs";
import path from "node:path";

export const CATEGORIES = {
  video: "Vídeo",
  arte: "Arte",
  post: "Conteúdo",
  identidade: "Identidade",
  campanha: "Campanha",
  outro: "Projeto",
};

export const DEFAULT_SETTINGS = {
  siteName: "Vinicius Almeida",
  role: "Designer & Motion",
  monogram: "VA",
  availability: "Disponível para novos projetos",
  location: "Brasil · projetos remotos",

  heroTitleLead: "Design que prende o olhar.",
  heroTitleAccent: "Movimento que fica.",
  heroSubtitle:
    "Sou Vinicius Almeida, designer e motion. Crio identidades, campanhas e conteúdo em movimento para marcas que querem ser vistas — e lembradas.",
  heroPrimaryCta: "Ver a vitrine",
  heroSecondaryCta: "Falar no WhatsApp",

  aboutQuote: "Bom design não grita.",
  aboutQuoteAccent: "Ele faz você olhar de novo.",
  aboutText:
    "Designer e motion designer. Transformo ideias em imagens, peças e vídeos que as pessoas param para ver — do conceito ao frame final.\n\nTrabalho com identidade visual, direção de arte e conteúdo para redes. Gosto de processo, de referência boa e de acertar no detalhe que ninguém vê, mas todo mundo sente.\n\nSe você tem uma marca para posicionar ou uma ideia para tirar do papel, a gente pode começar com uma conversa.",
  aboutPhoto: "",

  services: [
    {
      title: "Identidade visual",
      description:
        "Marcas com repertório: logo, paleta, tipografia e um sistema visual que aguenta o dia a dia.",
    },
    {
      title: "Motion & vídeo",
      description:
        "Reels, TikToks e peças em movimento com ritmo, intenção e acabamento de estúdio.",
    },
    {
      title: "Conteúdo para redes",
      description:
        "Direção de arte e peças prontas para publicar, com consistência de feed e personalidade.",
    },
  ],

  whatsapp: "5595984130864",
  whatsappDisplay: "+55 95 98413-0864",
  whatsappMessage: "Oi, Vinicius! Vi seu portfólio e quero conversar sobre um projeto.",
  tiktok: "",
  instagram: "",
  email: "",

  ctaTitle: "Tem uma ideia que ainda",
  ctaAccent: "não tem forma?",
  ctaText:
    "Me conta o que você quer construir. Eu ajudo a transformar em identidade, campanha ou conteúdo que as pessoas param para ver.",
  ctaNote: "Resposta em até 1 dia útil",
  footerNote:
    "Design, arte e movimento para marcas que querem ser vistas — e lembradas.",
  seoDescription:
    "Portfólio de Vinicius Almeida — designer e motion. Identidade visual, direção de arte e conteúdo em movimento para marcas que querem ser vistas.",
};

const INK = "#17140F";
const PAPER = "#F4EFE4";
const SAND = "#E7DDCA";
const CLAY = "#CF5730";
const OLIVE = "#6E7157";
const CREAM = "#FBF8F1";

function grain(id) {
  return `
    <filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>`;
}

function grainRect(id) {
  return `<rect width="100%" height="100%" filter="url(#${id})" opacity="0.12" style="mix-blend-mode:multiply"/>`;
}

function poster01() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>${grain("g1")}</defs>
  <rect width="1200" height="1500" fill="${SAND}"/>
  <g stroke="${INK}" stroke-opacity=".14" fill="none">
    <path d="M0 96h1200M0 1404h1200M96 0v1500M1104 0v1500"/>
  </g>
  <circle cx="1010" cy="1030" r="430" fill="${CLAY}"/>
  <circle cx="1010" cy="1030" r="300" fill="none" stroke="${INK}" stroke-width="2" opacity=".55"/>
  <path d="M96 96h190" stroke="${INK}" stroke-width="3"/>
  <text x="96" y="158" font-family="'Courier New',monospace" font-size="25" letter-spacing="6" fill="${INK}">ARQUIVO / 01</text>
  <text x="1000" y="430" text-anchor="end" font-family="Georgia,'Times New Roman',serif" font-size="330" fill="none" stroke="${INK}" stroke-width="2" opacity=".75">01</text>
  <text x="88" y="1130" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="208" fill="${INK}">Tipografia</text>
  <text x="88" y="1310" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="208" fill="${INK}">quente.</text>
  <text x="96" y="1458" font-family="'Courier New',monospace" font-size="22" letter-spacing="5" fill="${INK}" opacity=".7">ESTUDO AUTORAL — 2026</text>
  ${grainRect("g1")}
</svg>`;
}

function poster02() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>${grain("g2")}</defs>
  <rect width="1200" height="1500" fill="${PAPER}"/>
  <path d="M270 1320V690a330 330 0 0 1 660 0v630Z" fill="${INK}"/>
  <circle cx="1010" cy="250" r="92" fill="${CLAY}"/>
  <text x="96" y="158" font-family="'Courier New',monospace" font-size="25" letter-spacing="6" fill="${INK}">CONTEÚDO / 02</text>
  <text x="350" y="900" font-family="Georgia,'Times New Roman',serif" font-size="250" fill="${CREAM}">Feed</text>
  <text x="354" y="1010" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="96" fill="${CREAM}">em construção</text>
  <g fill="none" stroke="${INK}" stroke-width="2" opacity=".4">
    <rect x="96" y="1150" width="70" height="70"/>
    <rect x="186" y="1150" width="70" height="70"/>
    <rect x="276" y="1150" width="70" height="70"/>
  </g>
  <text x="96" y="1424" font-family="'Courier New',monospace" font-size="22" letter-spacing="5" fill="${INK}" opacity=".7">SÉRIE PARA REDES — 2026</text>
  ${grainRect("g2")}
</svg>`;
}

function poster03() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
  <defs>${grain("g3")}</defs>
  <rect width="1200" height="1200" fill="${PAPER}"/>
  <g fill="none" stroke="${INK}" stroke-width="2" opacity=".35">
    <circle cx="600" cy="600" r="150"/>
    <circle cx="600" cy="600" r="300"/>
    <circle cx="600" cy="600" r="430"/>
    <path d="M600 120v60M600 1020v60M120 600h60M1020 600h60"/>
  </g>
  <rect x="392" y="392" width="416" height="416" fill="${CLAY}" transform="rotate(12 600 600)"/>
  <text x="600" y="658" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="190" fill="${CREAM}">VA</text>
  <text x="96" y="140" font-family="'Courier New',monospace" font-size="24" letter-spacing="6" fill="${INK}">IDENTIDADE VISUAL</text>
  <text x="1104" y="1092" text-anchor="end" font-family="'Courier New',monospace" font-size="22" letter-spacing="5" fill="${INK}" opacity=".65">PROJETO EM ABERTO / 2026</text>
  <path d="M0 1100h260" stroke="${OLIVE}" stroke-width="14"/>
  ${grainRect("g3")}
</svg>`;
}

function poster04() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>${grain("g4")}</defs>
  <rect width="1080" height="1920" fill="${INK}"/>
  <circle cx="540" cy="720" r="350" fill="${CLAY}"/>
  <circle cx="540" cy="720" r="425" fill="none" stroke="${CREAM}" stroke-width="2" opacity=".45"/>
  <path d="M490 650l120 70-120 70Z" fill="none" stroke="${CREAM}" stroke-width="8" stroke-linejoin="round"/>
  <text x="540" y="1270" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="250" fill="${CREAM}">Reel</text>
  <text x="540" y="1370" text-anchor="middle" font-family="'Courier New',monospace" font-size="24" letter-spacing="9" fill="${CREAM}" opacity=".65">MOTION / 01</text>
  <text x="72" y="110" font-family="'Courier New',monospace" font-size="22" letter-spacing="6" fill="${CREAM}" opacity=".7">ESTUDO EM MOVIMENTO</text>
  <path d="M72 1680h936" stroke="${CREAM}" stroke-opacity=".3"/>
  <text x="72" y="1770" font-family="'Courier New',monospace" font-size="22" letter-spacing="5" fill="${CREAM}" opacity=".6">9:16 — 00:15</text>
  <text x="1008" y="1770" text-anchor="end" font-family="'Courier New',monospace" font-size="22" letter-spacing="5" fill="${CREAM}" opacity=".6">2026</text>
  ${grainRect("g4")}
</svg>`;
}

function poster05() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>${grain("g5")}</defs>
  <rect width="1200" height="1500" fill="${CLAY}"/>
  <rect x="64" y="64" width="1072" height="1372" fill="none" stroke="${CREAM}" stroke-opacity=".55" stroke-width="2"/>
  <circle cx="1000" cy="340" r="180" fill="${INK}"/>
  <circle cx="1000" cy="340" r="230" fill="none" stroke="${CREAM}" stroke-opacity=".35" stroke-width="2"/>
  <text x="120" y="720" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="330" fill="${CREAM}">Noite</text>
  <text x="126" y="880" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="170" fill="${CREAM}">de cinema</text>
  <text x="120" y="180" font-family="'Courier New',monospace" font-size="24" letter-spacing="6" fill="${CREAM}" opacity=".8">CARTAZ / 05</text>
  <path d="M120 1240h420" stroke="${CREAM}" stroke-width="2" opacity=".6"/>
  <text x="120" y="1310" font-family="'Courier New',monospace" font-size="22" letter-spacing="5" fill="${CREAM}" opacity=".75">DIREÇÃO DE ARTE — 2026</text>
  ${grainRect("g5")}
</svg>`;
}

function poster06() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>${grain("g6")}</defs>
  <rect width="1200" height="1500" fill="${PAPER}"/>
  <text x="96" y="180" font-family="'Courier New',monospace" font-size="25" letter-spacing="6" fill="${INK}">CAMPANHA / 06</text>
  <text x="90" y="330" font-family="Georgia,'Times New Roman',serif" font-size="150" fill="${INK}">três</text>
  <text x="96" y="430" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="110" fill="${INK}">tempos.</text>
  <g>
    <rect x="96" y="560" width="300" height="790" fill="${OLIVE}"/>
    <rect x="450" y="560" width="300" height="790" fill="${CLAY}"/>
    <rect x="804" y="560" width="300" height="790" fill="${INK}"/>
    <text x="246" y="1260" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="150" fill="${CREAM}">01</text>
    <text x="600" y="1260" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="150" fill="${CREAM}">02</text>
    <text x="954" y="1260" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="150" fill="${CREAM}">03</text>
  </g>
  <text x="96" y="1440" font-family="'Courier New',monospace" font-size="22" letter-spacing="5" fill="${INK}" opacity=".65">SISTEMA VISUAL EM TRÊS ATOS</text>
  ${grainRect("g6")}
</svg>`;
}

const COVERS = [
  ["seed-01.svg", poster01],
  ["seed-02.svg", poster02],
  ["seed-03.svg", poster03],
  ["seed-04.svg", poster04],
  ["seed-05.svg", poster05],
  ["seed-06.svg", poster06],
];

const SEED_WORKS = [
  {
    id: "seed-video-01",
    title: "Estudo em movimento n.º 01",
    category: "video",
    description:
      "Um exercício de ritmo e tipografia em movimento. Corte seco, respiro e uma paleta quente para testar como uma marca se comporta em vídeo.\n\nEste é um projeto de exemplo: troque a capa e cole o link de um vídeo do seu TikTok no painel para ver o player funcionando aqui.",
    client: "Estudo autoral",
    year: "2026",
    cover: "/uploads/seed-04.svg",
    tiktokUrl: "",
    tiktokId: "",
    externalUrl: "",
    instagramUrl: "",
    featured: true,
    published: true,
    demo: true,
  },
  {
    id: "seed-arte-02",
    title: "Tipografia quente",
    category: "arte",
    description:
      "Estudo de composição com tipografia serifada, formas orgânicas e uma paleta de terra. A ideia era criar uma peça que funcionasse tanto no feed quanto impressa.\n\nProjeto de exemplo — edite ou exclua no painel.",
    client: "Estudo autoral",
    year: "2026",
    cover: "/uploads/seed-01.svg",
    tiktokUrl: "",
    tiktokId: "",
    externalUrl: "",
    instagramUrl: "",
    featured: false,
    published: true,
    demo: true,
  },
  {
    id: "seed-post-03",
    title: "Feed em construção",
    category: "post",
    description:
      "Série de peças para redes com um sistema simples: um arquétipo forte, tipografia grande e espaço para a mensagem respirar.\n\nProjeto de exemplo — edite ou exclua no painel.",
    client: "Projeto conceito",
    year: "2026",
    cover: "/uploads/seed-02.svg",
    tiktokUrl: "",
    tiktokId: "",
    externalUrl: "",
    instagramUrl: "",
    featured: false,
    published: true,
    demo: true,
  },
  {
    id: "seed-identidade-04",
    title: "Identidade em aberto",
    category: "identidade",
    description:
      "Um sistema visual em construção: marca central, grades circulares e um contraste entre o gesto orgânico e a precisão da tipografia.\n\nProjeto de exemplo — edite ou exclua no painel.",
    client: "Projeto conceito",
    year: "2026",
    cover: "/uploads/seed-03.svg",
    tiktokUrl: "",
    tiktokId: "",
    externalUrl: "",
    instagramUrl: "",
    featured: true,
    published: true,
    demo: true,
  },
  {
    id: "seed-arte-05",
    title: "Noite de cinema",
    category: "arte",
    description:
      "Cartaz autoral para uma sessão imaginária. Cor saturada, tipografia em itálico e um ritmo de elementos que remete ao cartaz impresso.\n\nProjeto de exemplo — edite ou exclua no painel.",
    client: "Estudo autoral",
    year: "2026",
    cover: "/uploads/seed-05.svg",
    tiktokUrl: "",
    tiktokId: "",
    externalUrl: "",
    instagramUrl: "",
    featured: false,
    published: true,
    demo: true,
  },
  {
    id: "seed-campanha-06",
    title: "Campanha em três tempos",
    category: "campanha",
    description:
      "Desdobramento de campanha em três atos visuais, com uma paleta contida e hierarquia clara entre marca, mensagem e chamada.\n\nProjeto de exemplo — edite ou exclua no painel.",
    client: "Projeto conceito",
    year: "2026",
    cover: "/uploads/seed-06.svg",
    tiktokUrl: "",
    tiktokId: "",
    externalUrl: "",
    instagramUrl: "",
    featured: false,
    published: true,
    demo: true,
  },
];

export function buildSeed(uploadDir) {
  fs.mkdirSync(uploadDir, { recursive: true });
  for (const [name, make] of COVERS) {
    const file = path.join(uploadDir, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, make(), "utf8");
  }

  const now = new Date().toISOString();
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS, services: DEFAULT_SETTINGS.services.map((s) => ({ ...s })) },
    works: SEED_WORKS.map((work, index) => ({
      ...work,
      order: index + 1,
      createdAt: now,
      updatedAt: now,
    })),
  };
}
