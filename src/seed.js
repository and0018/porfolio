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
  location: "Brasil, trabalho remoto",

  heroTitleLead: "Design que prende o olhar.",
  heroTitleAccent: "Movimento que fica.",
  heroSubtitle:
    "Sou Vinicius Almeida, designer e motion. Crio identidades, campanhas e conteúdo em movimento para marcas que querem ser vistas e lembradas.",
  heroPrimaryCta: "Ver a vitrine",
  heroSecondaryCta: "Falar no WhatsApp",

  aboutQuote: "Bom design não grita.",
  aboutQuoteAccent: "Ele faz você olhar de novo.",
  aboutText:
    "Designer e motion designer. Transformo ideias em imagens, peças e vídeos que as pessoas param para ver, do conceito ao frame final.\n\nTrabalho com identidade visual, direção de arte e conteúdo para redes. Gosto de processo, de referência boa e de acertar no detalhe que ninguém vê, mas todo mundo sente.\n\nSe você tem uma marca para posicionar ou uma ideia para tirar do papel, a gente pode começar com uma conversa.",
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
    "Design, arte e movimento para marcas que querem ser vistas e lembradas.",
  seoDescription:
    "Portfólio de Vinicius Almeida, designer e motion. Identidade visual, direção de arte e conteúdo em movimento para marcas que querem ser vistas.",
};

const INK = "#15170F";
const PAPER = "#F2F1E9";
const SAND = "#E7E6DA";
const OLIVE = "#5E6547";
const MILITARY = "#2F3A2B";
const CREAM = "#FAF9F3";
const SAGE = "#DCE1CF";
const SANS = "'Archivo','Helvetica Neue',Arial,sans-serif";

function cropMarks(w, h, color = INK, opacity = ".35") {
  const m = 44;
  const l = 34;
  return `<g stroke="${color}" stroke-opacity="${opacity}" stroke-width="2" fill="none">
    <path d="M${m} ${m}h${l}M${m} ${m}v${l}M${w - m} ${m}h-${l}M${w - m} ${m}v${l}M${m} ${h - m}h${l}M${m} ${h - m}v-${l}M${w - m} ${h - m}h-${l}M${w - m} ${h - m}v-${l}"/>
  </g>`;
}

function poster01() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <rect width="1200" height="1500" fill="${SAND}"/>
  <rect x="96" y="236" width="1008" height="536" fill="${OLIVE}"/>
  <rect x="812" y="96" width="292" height="292" fill="${MILITARY}"/>
  <circle cx="220" cy="612" r="96" fill="${CREAM}"/>
  <text x="96" y="158" font-family="${SANS}" font-size="24" font-weight="500" letter-spacing="7" fill="${INK}">ARQUIVO / 01</text>
  <text x="812" y="286" font-family="${SANS}" font-size="150" font-weight="700" letter-spacing="-10" fill="${CREAM}">01</text>
  <text x="140" y="620" font-family="${SANS}" font-size="226" font-weight="700" letter-spacing="-12" fill="${CREAM}">Tipo</text>
  <text x="140" y="744" font-family="${SANS}" font-size="226" font-weight="700" letter-spacing="-12" fill="${CREAM}">grafia</text>
  <text x="96" y="1000" font-family="${SANS}" font-size="26" letter-spacing="1" fill="${INK}">Contraste, ritmo e espaço.</text>
  <path d="M96 1080h1008" stroke="${INK}" stroke-opacity=".22" stroke-width="2"/>
  <text x="96" y="1404" font-family="${SANS}" font-size="22" font-weight="500" letter-spacing="6" fill="${INK}" opacity=".7">ESTUDO AUTORAL — 2026</text>
  ${cropMarks(1200, 1500)}
</svg>`;
}

function poster02() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <rect width="1200" height="1500" fill="${PAPER}"/>
  <path d="M270 1320V690a330 330 0 0 1 660 0v630Z" fill="${MILITARY}"/>
  <rect x="96" y="96" width="330" height="96" fill="${OLIVE}"/>
  <text x="120" y="158" font-family="${SANS}" font-size="24" font-weight="500" letter-spacing="7" fill="${CREAM}">CONTEÚDO / 02</text>
  <text x="350" y="900" font-family="${SANS}" font-size="238" font-weight="700" letter-spacing="-11" fill="${CREAM}">Feed</text>
  <text x="354" y="1000" font-family="${SANS}" font-size="72" font-weight="400" letter-spacing="-1" fill="${SAGE}">em série</text>
  <g fill="none" stroke="${INK}" stroke-width="2" opacity=".4">
    <rect x="96" y="1150" width="70" height="70"/>
    <rect x="186" y="1150" width="70" height="70"/>
    <rect x="276" y="1150" width="70" height="70"/>
  </g>
  <text x="96" y="1424" font-family="${SANS}" font-size="22" font-weight="500" letter-spacing="6" fill="${INK}" opacity=".7">SÉRIE PARA REDES — 2026</text>
  ${cropMarks(1200, 1500)}
</svg>`;
}

function poster03() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" width="1200" height="1200">
  <rect width="1200" height="1200" fill="${PAPER}"/>
  <g fill="none" stroke="${OLIVE}" stroke-width="2" opacity=".45">
    <circle cx="600" cy="600" r="150"/>
    <circle cx="600" cy="600" r="300"/>
    <circle cx="600" cy="600" r="430"/>
    <path d="M600 120v60M600 1020v60M120 600h60M1020 600h60"/>
  </g>
  <rect x="392" y="392" width="416" height="416" fill="${MILITARY}" transform="rotate(12 600 600)"/>
  <text x="600" y="666" text-anchor="middle" font-family="${SANS}" font-size="178" font-weight="700" letter-spacing="-9" fill="${CREAM}">VA</text>
  <text x="96" y="140" font-family="${SANS}" font-size="24" font-weight="500" letter-spacing="7" fill="${INK}">IDENTIDADE VISUAL</text>
  <text x="1104" y="1092" text-anchor="end" font-family="${SANS}" font-size="22" font-weight="500" letter-spacing="5" fill="${INK}" opacity=".65">PROJETO EM ABERTO / 2026</text>
  <path d="M0 1100h260" stroke="${OLIVE}" stroke-width="14"/>
  ${cropMarks(1200, 1200)}
</svg>`;
}

function poster04() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <rect width="1080" height="1920" fill="${MILITARY}"/>
  <circle cx="540" cy="720" r="350" fill="${OLIVE}"/>
  <circle cx="540" cy="720" r="425" fill="none" stroke="${CREAM}" stroke-width="2" opacity=".35"/>
  <path d="M490 650l120 70-120 70Z" fill="none" stroke="${CREAM}" stroke-width="8" stroke-linejoin="round"/>
  <text x="540" y="1280" text-anchor="middle" font-family="${SANS}" font-size="226" font-weight="700" letter-spacing="-10" fill="${CREAM}">Reel</text>
  <text x="540" y="1370" text-anchor="middle" font-family="${SANS}" font-size="24" font-weight="500" letter-spacing="9" fill="${SAGE}">MOTION / 01</text>
  <text x="72" y="110" font-family="${SANS}" font-size="22" font-weight="500" letter-spacing="6" fill="${CREAM}" opacity=".7">ESTUDO EM MOVIMENTO</text>
  <path d="M72 1680h936" stroke="${CREAM}" stroke-opacity=".24"/>
  <text x="72" y="1770" font-family="${SANS}" font-size="22" font-weight="500" letter-spacing="5" fill="${CREAM}" opacity=".6">9:16 — 00:15</text>
  <text x="1008" y="1770" text-anchor="end" font-family="${SANS}" font-size="22" font-weight="500" letter-spacing="5" fill="${CREAM}" opacity=".6">2026</text>
  ${cropMarks(1080, 1920, CREAM, ".3")}
</svg>`;
}

function poster05() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <rect width="1200" height="1500" fill="${OLIVE}"/>
  <rect x="64" y="64" width="1072" height="1372" fill="none" stroke="${CREAM}" stroke-opacity=".45" stroke-width="2"/>
  <circle cx="1000" cy="340" r="180" fill="${MILITARY}"/>
  <circle cx="1000" cy="340" r="230" fill="none" stroke="${CREAM}" stroke-opacity=".3" stroke-width="2"/>
  <text x="120" y="720" font-family="${SANS}" font-size="286" font-weight="700" letter-spacing="-14" fill="${CREAM}">Noite</text>
  <text x="126" y="852" font-family="${SANS}" font-size="126" font-weight="400" letter-spacing="-3" fill="${CREAM}">de cinema</text>
  <text x="120" y="180" font-family="${SANS}" font-size="24" font-weight="500" letter-spacing="7" fill="${CREAM}" opacity=".8">CARTAZ / 05</text>
  <path d="M120 1240h420" stroke="${CREAM}" stroke-width="2" opacity=".5"/>
  <text x="120" y="1310" font-family="${SANS}" font-size="22" font-weight="500" letter-spacing="5" fill="${CREAM}" opacity=".75">DIREÇÃO DE ARTE — 2026</text>
  ${cropMarks(1200, 1500, CREAM, ".35")}
</svg>`;
}

function poster06() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <rect width="1200" height="1500" fill="${PAPER}"/>
  <text x="96" y="180" font-family="${SANS}" font-size="24" font-weight="500" letter-spacing="7" fill="${INK}">CAMPANHA / 06</text>
  <text x="90" y="340" font-family="${SANS}" font-size="150" font-weight="700" letter-spacing="-8" fill="${INK}">três</text>
  <text x="96" y="440" font-family="${SANS}" font-size="104" font-weight="400" letter-spacing="-3" fill="${INK}">tempos.</text>
  <g>
    <rect x="96" y="560" width="300" height="790" fill="${OLIVE}"/>
    <rect x="450" y="560" width="300" height="790" fill="${MILITARY}"/>
    <rect x="804" y="560" width="300" height="790" fill="${SAGE}"/>
    <text x="246" y="1260" text-anchor="middle" font-family="${SANS}" font-size="132" font-weight="700" fill="${CREAM}">01</text>
    <text x="600" y="1260" text-anchor="middle" font-family="${SANS}" font-size="132" font-weight="700" fill="${CREAM}">02</text>
    <text x="954" y="1260" text-anchor="middle" font-family="${SANS}" font-size="132" font-weight="700" fill="${INK}">03</text>
  </g>
  <text x="96" y="1440" font-family="${SANS}" font-size="22" font-weight="500" letter-spacing="5" fill="${INK}" opacity=".65">SISTEMA VISUAL EM TRÊS ATOS</text>
  ${cropMarks(1200, 1500)}
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
      "Um exercício de ritmo e tipografia em movimento. Corte seco, respiro e uma paleta contida para testar como uma marca se comporta em vídeo.\n\nEste é um projeto de exemplo: troque a capa e cole o link de um vídeo do seu TikTok no painel para ver o player funcionando aqui.",
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
    title: "Tipografia em campo",
    category: "arte",
    description:
      "Estudo de composição com tipografia de traço firme, grades e uma paleta contida entre oliva, papel e verde militar. A ideia era criar uma peça que funcionasse tanto no feed quanto impressa.\n\nProjeto de exemplo. Edite ou exclua no painel.",
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
      "Série de peças para redes com um sistema simples: um arquétipo forte, tipografia grande e espaço para a mensagem respirar.\n\nProjeto de exemplo. Edite ou exclua no painel.",
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
      "Um sistema visual em construção: marca central, grades circulares e um contraste entre o gesto orgânico e a precisão da tipografia.\n\nProjeto de exemplo. Edite ou exclua no painel.",
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
      "Cartaz autoral para uma sessão imaginária. Cor saturada, tipografia em itálico e um ritmo de elementos que remete ao cartaz impresso.\n\nProjeto de exemplo. Edite ou exclua no painel.",
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
      "Desdobramento de campanha em três atos visuais, com uma paleta contida e hierarquia clara entre marca, mensagem e chamada.\n\nProjeto de exemplo. Edite ou exclua no painel.",
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
