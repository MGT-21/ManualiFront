"use strict";
/**
 * Fake API — Marketplace Origem
 * Implementa os contratos do PDF "REQ / RES de Cada Rota — Marketplace Origem".
 * Dados em memória (reiniciar o servidor ou chamar POST /__reset restaura o seed).
 */
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "fake-api-origem-secret";
const ACCESS_TTL = 3600; // segundos (expires_in do PDF)
const REFRESH_TTL = 7 * 24 * 3600;

/* ───────────── Utilidades ───────────── */
const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString();
const money = n => Math.round((n + Number.EPSILON) * 100) / 100;
const isStr = (v, min = 1, max = 1000) => typeof v === "string" && v.trim().length >= min && v.length <= max;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CEP = /^\d{5}-?\d{3}$/;
const METODOS_PAGAMENTO = ["pix", "cartao_credito", "cartao_debito", "boleto"];
const STATUS_PEDIDO = ["aguardando_pagamento", "pago", "preparando", "enviado", "entregue", "cancelado"];
const FLUXO_ARTESAO = { pago: ["preparando"], preparando: ["enviado"], enviado: ["entregue"] };
const PAGOS = ["pago", "preparando", "enviado", "entregue"];

class ApiError extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    Object.assign(this, { status, codigo, detalhes });
  }
}
const bad = (detalhes, mensagem = "Dados inválidos.") => new ApiError(400, "validacao", mensagem, detalhes);
const notFound = (what = "Recurso") => new ApiError(404, "nao_encontrado", `${what} não encontrado.`);
const forbidden = (msg = "Sem permissão para esta operação.") => new ApiError(403, "proibido", msg);
const conflict = msg => new ApiError(409, "conflito", msg);

/* ───────────── JWT HS256 (sem dependências) ───────────── */
const b64 = o => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
function signJwt(payload, ttl) {
  const iat = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ ...payload, jti: uuid(), iat, exp: iat + ttl });
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
function verifyJwt(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest();
  const given = Buffer.from(parts[2], "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return p.exp < Math.floor(Date.now() / 1000) ? null : p;
  } catch { return null; }
}

/* ───────────── Banco em memória + seed ───────────── */
const ID = {
  admin: "11111111-1111-4111-8111-111111111111",
  maria: "22222222-2222-4222-8222-222222222222",
  ana: "33333333-3333-4333-8333-333333333333",
  pedro: "44444444-4444-4444-8444-444444444444",
  joao: "55555555-5555-4555-8555-555555555555",
  carla: "66666666-6666-4666-8666-666666666666",
  catCeramica: "c0000000-0000-4000-8000-000000000001",
  catTecelagem: "c0000000-0000-4000-8000-000000000002",
  catFibra: "c0000000-0000-4000-8000-000000000003",
  catBordado: "c0000000-0000-4000-8000-000000000004",
  vaso: "a3f1c2e4-5b6d-4e8a-9c1f-2d7b8e4a1c01",
  bowl: "b7e92d10-8c3a-4f5b-a6d2-3e9c1f7b2d02",
  cesto: "c4d83a7f-1e2b-4a9c-8b5d-4f0a2c8e3b03",
  bonecos: "d5a14b8c-2f3c-4b1d-9e6a-5a1b3d9f4c04",
  prato: "e6b25c9d-3a4d-4c2e-8f7b-6b2c4eaf5d05",
  organizador: "f7c36dae-4b5e-4d3f-9a8c-7c3d5fb06e06",
  vasoMin: "08d47ebf-5c6f-4e40-8b9d-8d4e6ac17f07",
  escultura: "19e58fc0-6d70-4f51-9cae-9e5f7bd28a08",
  manta: "2a0f6ad1-7e81-4a62-8dbf-0f6a8ce39b09",
  tapecaria: "3b1a7be2-8f92-4b73-9ec0-1a7b9df4ac10",
};

let db, pedidoSeq;
const FOTO = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

function seed() {
  db = { users: new Map(), categorias: new Map(), produtos: new Map(), carrinhos: new Map(), pedidos: new Map(), avaliacoes: new Map() };
  pedidoSeq = 0;
  const SENHA = "SenhaForte123";

  const user = u => db.users.set(u.id, { status: "ativo", biografia: null, foto_url: null, contato: null, origem: null, cpf_cnpj: null, senha: SENHA, ...u });
  user({ id: ID.admin, tipo_usuario: "admin", nome: "Admin Origem", email: "admin@exemplo.com", data_cadastro: daysAgo(120) });
  user({ id: ID.maria, tipo_usuario: "artesao", nome: "Maria Silva", email: "maria@exemplo.com", status: "aprovado", cpf_cnpj: "529.982.247-25",
    biografia: "Ceramista pernambucana, trabalho com cerâmica há 15 anos.", foto_url: "https://i.pravatar.cc/300?img=47", contato: "+55 81 99999-0000", origem: "Caruaru, PE", data_cadastro: daysAgo(100) });
  user({ id: ID.ana, tipo_usuario: "artesao", nome: "Ana Costa", email: "ana@exemplo.com", status: "aprovado", cpf_cnpj: "11.222.333/0001-81",
    biografia: "Tecelã de manta e tapeçaria em tear manual.", foto_url: "https://i.pravatar.cc/300?img=32", contato: "+55 81 98888-0000", origem: "Triunfo, PE", data_cadastro: daysAgo(80) });
  user({ id: ID.pedro, tipo_usuario: "artesao", nome: "Pedro Lima", email: "pedro@exemplo.com", status: "pendente", cpf_cnpj: "390.533.447-05",
    biografia: "Bordados à mão.", data_cadastro: daysAgo(2) });
  user({ id: ID.joao, tipo_usuario: "consumidor", nome: "João Souza", email: "joao@exemplo.com", data_cadastro: daysAgo(60) });
  user({ id: ID.carla, tipo_usuario: "consumidor", nome: "Carla Dias", email: "carla@exemplo.com", data_cadastro: daysAgo(1) });

  [[ID.catCeramica, "Cerâmica"], [ID.catTecelagem, "Tecelagem"], [ID.catFibra, "Fibra natural"], [ID.catBordado, "Bordado"]]
    .forEach(([id, nome]) => db.categorias.set(id, { id, nome }));

  const prod = (n, p) => db.produtos.set(p.id, { status: "ativo", fotos: [], historia_peca: null, data_cadastro: daysAgo(40 - n), ...p });
  prod(1, { id: ID.vaso, nome: "Vaso azul", descricao: "Vaso artesanal em cerâmica", historia_peca: "Inspirado no litoral pernambucano", preco: 189.9, quantidade_estoque: 8, categoria_id: ID.catCeramica, artesao_id: ID.maria, fotos: [FOTO("photo-1578749556568-bc2c40e68b61")] });
  prod(2, { id: ID.bowl, nome: "Bowl terracota", descricao: "Bowl feito à mão", historia_peca: "Peça única moldada manualmente", preco: 89.9, quantidade_estoque: 12, categoria_id: ID.catCeramica, artesao_id: ID.maria, fotos: [FOTO("photo-1493106641515-6b5631de4bb9")] });
  prod(3, { id: ID.cesto, nome: "Cesto de palha", descricao: "Cesto artesanal trançado", historia_peca: "Tradição e trabalho manual", preco: 129, quantidade_estoque: 1, categoria_id: ID.catFibra, artesao_id: ID.maria, fotos: [FOTO("photo-1622153093514-4dd0078ac132")] });
  prod(4, { id: ID.bonecos, nome: "Bonecos de barro", descricao: "Escultura artesanal inspirada na cultura nordestina", historia_peca: "Representação da tradição do agreste pernambucano", preco: 180, quantidade_estoque: 6, categoria_id: ID.catCeramica, artesao_id: ID.maria, fotos: [FOTO("photo-1565193566173-7a0ee3dbe261")] });
  prod(5, { id: ID.prato, nome: "Prato decorativo", descricao: "Prato de cerâmica feito e pintado à mão", historia_peca: "Inspirado nas cores e paisagens do Nordeste", preco: 75, quantidade_estoque: 10, categoria_id: ID.catCeramica, artesao_id: ID.maria, fotos: [FOTO("photo-1576021182211-9ea8dced3690")] });
  prod(6, { id: ID.organizador, nome: "Cesto organizador", descricao: "Cesto artesanal produzido com fibras naturais", historia_peca: "Técnicas tradicionais de trançado", preco: 115, quantidade_estoque: 5, categoria_id: ID.catFibra, artesao_id: ID.maria, fotos: [FOTO("photo-1600210492486-724fe5c67fb0")] });
  prod(7, { id: ID.vasoMin, nome: "Vaso minimalista", descricao: "Vaso decorativo de cerâmica com acabamento natural", historia_peca: "Simplicidade e beleza artesanal", preco: 145, quantidade_estoque: 7, categoria_id: ID.catCeramica, artesao_id: ID.maria, fotos: [FOTO("photo-1578500494198-246f612d3b3d")] });
  prod(8, { id: ID.escultura, nome: "Escultura decorativa", descricao: "Peça esculpida manualmente em argila", historia_peca: "Identidade cultural pernambucana", preco: 220, quantidade_estoque: 3, categoria_id: ID.catCeramica, artesao_id: ID.maria, fotos: [FOTO("photo-1579783902614-a3fb3927b6a5")] });
  prod(9, { id: ID.manta, nome: "Manta de tear", descricao: "Manta de algodão tecida em tear manual", historia_peca: "Padrões herdados de três gerações", preco: 260, quantidade_estoque: 4, categoria_id: ID.catTecelagem, artesao_id: ID.ana, fotos: [FOTO("photo-1580301762395-21ce84d00bc6")] });
  prod(10, { id: ID.tapecaria, nome: "Tapeçaria mural", descricao: "Tapeçaria decorativa para parede", historia_peca: "Inspirada no sertão em flor", preco: 340, quantidade_estoque: 2, categoria_id: ID.catTecelagem, artesao_id: ID.ana, fotos: [FOTO("photo-1582582494705-f8ce0b0c24f0")] });

  const END = { logradouro: "Rua das Flores, 123", cidade: "Recife", estado: "PE", cep: "50000-000" };
  const pedido = (usuario_id, itens, status_pedido, dias, metodo = "pix", rastreio = null) => {
    const its = itens.map(([pid, q]) => { const p = db.produtos.get(pid); return { produto_id: pid, nome: p.nome, quantidade: q, preco_unitario: p.preco, artesao_id: p.artesao_id }; });
    return criarPedido({ usuario_id, itens: its, endereco_entrega: END, metodo, status_pedido, data_pedido: daysAgo(dias), codigo_rastreio: rastreio });
  };
  pedido(ID.joao, [[ID.vaso, 2]], "entregue", 20, "pix", "BR123456789");
  pedido(ID.joao, [[ID.bowl, 1], [ID.cesto, 1]], "preparando", 5, "cartao_credito");
  pedido(ID.carla, [[ID.manta, 1]], "entregue", 10, "pix", "BR987654321");
  pedido(ID.carla, [[ID.vaso, 1], [ID.prato, 2]], "entregue", 3, "boleto", "BR555444333");
  pedido(ID.joao, [[ID.prato, 1]], "aguardando_pagamento", 0);

  const av = (produto_id, usuario_id, nota, comentario, dias) => { const id = uuid(); db.avaliacoes.set(id, { id, produto_id, usuario_id, nota, comentario, data_avaliacao: daysAgo(dias) }); };
  av(ID.vaso, ID.joao, 5, "Peça linda, superou expectativas!", 15);
  av(ID.vaso, ID.carla, 4, "Muito bonita, chegou bem embalada.", 2);
  av(ID.manta, ID.carla, 5, "Tecido macio e acabamento impecável.", 8);
}

function criarPedido({ usuario_id, itens, endereco_entrega, metodo, status_pedido = "aguardando_pagamento", data_pedido = now(), codigo_rastreio = null }) {
  const id = uuid();
  const ano = new Date(data_pedido).getUTCFullYear();
  const pago = PAGOS.includes(status_pedido);
  const o = {
    id, numero_pedido: `PED-${ano}-${String(++pedidoSeq).padStart(5, "0")}`, usuario_id, status_pedido,
    valor_total: money(itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0)),
    endereco_entrega, itens, data_pedido, codigo_rastreio,
    pagamento: { metodo, status: pago ? "aprovado" : status_pedido === "cancelado" ? "cancelado" : "pendente" },
  };
  db.pedidos.set(id, o);
  return o;
}

/* ───────────── Auth / helpers ───────────── */
function auth(...tipos) {
  return (req, res, next) => {
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || "");
    if (!m) throw new ApiError(401, "nao_autenticado", "Token de acesso ausente.");
    const p = verifyJwt(m[1]);
    if (!p || p.typ !== "access") throw new ApiError(401, "token_invalido", "Token inválido ou expirado.");
    const u = db.users.get(p.sub);
    if (!u) throw new ApiError(401, "token_invalido", "Usuário do token não existe mais.");
    if (u.status === "bloqueado") throw forbidden("Usuário bloqueado.");
    if (tipos.length && !tipos.includes(u.tipo_usuario)) throw forbidden(`Rota restrita a: ${tipos.join(", ")}.`);
    req.user = u;
    next();
  };
}
const byEmail = e => [...db.users.values()].find(u => u.email.toLowerCase() === String(e).toLowerCase());

function paginate(items, q) {
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
  const total = items.length;
  return { data: items.slice((page - 1) * limit, page * limit), meta: { page, limit, total, total_pages: Math.ceil(total / limit) } };
}

const disponivel = p => p.status === "ativo" && p.quantidade_estoque > 0;
const fotoCapa = p => p.fotos[0] || null;
const avaliacoesDe = pid => [...db.avaliacoes.values()].filter(a => a.produto_id === pid);
const media = pid => { const a = avaliacoesDe(pid); return a.length ? Math.round((a.reduce((s, x) => s + x.nota, 0) / a.length) * 10) / 10 : 0; };
const produtoCriadoDto = p => ({ id: p.id, nome: p.nome, preco: p.preco, quantidade_estoque: p.quantidade_estoque, disponivel: disponivel(p), status: p.status, artesao_id: p.artesao_id, data_cadastro: p.data_cadastro });
const artesaoMeDto = u => ({ id: u.id, nome: u.nome, email: u.email, biografia: u.biografia, foto_url: u.foto_url, contato: u.contato, status: u.status, data_cadastro: u.data_cadastro });

function validateProduto(b, partial) {
  const d = [];
  const has = k => b[k] !== undefined;
  const need = k => { if (!partial && !has(k)) d.push({ campo: k, mensagem: "Campo obrigatório." }); return has(k); };
  if (need("nome") && !isStr(b.nome, 2, 120)) d.push({ campo: "nome", mensagem: "Deve ter entre 2 e 120 caracteres." });
  if (need("descricao") && !isStr(b.descricao, 1, 5000)) d.push({ campo: "descricao", mensagem: "Texto obrigatório." });
  if (need("preco") && !(typeof b.preco === "number" && b.preco > 0)) d.push({ campo: "preco", mensagem: "Deve ser um número maior que zero." });
  if (need("quantidade_estoque") && !(Number.isInteger(b.quantidade_estoque) && b.quantidade_estoque >= 0)) d.push({ campo: "quantidade_estoque", mensagem: "Deve ser inteiro >= 0." });
  if (need("categoria_id") && !db.categorias.has(b.categoria_id)) d.push({ campo: "categoria_id", mensagem: "Categoria inexistente." });
  if (has("historia_peca") && typeof b.historia_peca !== "string") d.push({ campo: "historia_peca", mensagem: "Deve ser texto." });
  if (has("fotos") && !(Array.isArray(b.fotos) && b.fotos.every(f => isStr(f)))) d.push({ campo: "fotos", mensagem: "Deve ser lista de URLs." });
  if (has("status") && !["ativo", "inativo"].includes(b.status)) d.push({ campo: "status", mensagem: "Use ativo ou inativo." });
  if (d.length) throw bad(d);
}

function cartOf(userId) {
  let c = db.carrinhos.get(userId);
  if (!c) { c = { id: uuid(), itens: [] }; db.carrinhos.set(userId, c); }
  c.itens = c.itens.filter(i => db.produtos.has(i.produto_id));
  return c;
}
function cartDto(c) {
  const itens = c.itens.map(i => {
    const p = db.produtos.get(i.produto_id);
    return { id: i.id, produto: { id: p.id, nome: p.nome, preco: p.preco, foto_capa: fotoCapa(p) }, quantidade: i.quantidade, subtotal: money(p.preco * i.quantidade) };
  });
  return { id: c.id, itens, valor_total: money(itens.reduce((s, i) => s + i.subtotal, 0)) };
}

function restock(o) {
  if (["aguardando_pagamento", "pago", "preparando"].includes(o.status_pedido))
    o.itens.forEach(i => { const p = db.produtos.get(i.produto_id); if (p) p.quantidade_estoque += i.quantidade; });
}
const pedidoItensDto = o => o.itens.map(i => ({ produto_id: i.produto_id, nome: i.nome, quantidade: i.quantidade, preco_unitario: i.preco_unitario }));
const entregaStatus = o => o.status_pedido === "entregue" ? "entregue" : o.status_pedido === "enviado" ? "enviado" : o.status_pedido === "cancelado" ? "cancelado" : "pendente";

/** Visão do pedido conforme quem consulta: artesão só enxerga os próprios itens. */
function pedidoView(o, user) {
  if (user.tipo_usuario !== "artesao") return o;
  const itens = o.itens.filter(i => i.artesao_id === user.id);
  return { ...o, itens, valor_total: money(itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0)) };
}
function podeVerPedido(o, u) {
  return u.tipo_usuario === "admin" || (u.tipo_usuario === "consumidor" && o.usuario_id === u.id) || (u.tipo_usuario === "artesao" && o.itens.some(i => i.artesao_id === u.id));
}

/* ───────────── App ───────────── */
const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", timestamp: now() }));
app.post("/__reset", (req, res) => { seed(); res.json({ data: { mensagem: "Seed restaurado." } }); });

/* 1. Autenticação */
function registrar(tipo) {
  return (req, res) => {
    const b = req.body || {}, d = [];
    if (!isStr(b.nome, 2, 120)) d.push({ campo: "nome", mensagem: "Deve ter entre 2 e 120 caracteres." });
    if (!EMAIL.test(String(b.email || ""))) d.push({ campo: "email", mensagem: "E-mail inválido." });
    if (!isStr(b.senha, 8, 100)) d.push({ campo: "senha", mensagem: "Deve ter no mínimo 8 caracteres." });
    let doc = "";
    if (tipo === "artesao") {
      doc = String(b.cpf_cnpj || "").replace(/\D/g, "");
      if (![11, 14].includes(doc.length)) d.push({ campo: "cpf_cnpj", mensagem: "Informe CPF (11 dígitos) ou CNPJ (14 dígitos)." });
      if (b.biografia !== undefined && typeof b.biografia !== "string") d.push({ campo: "biografia", mensagem: "Deve ser texto." });
    }
    if (d.length) throw bad(d);
    if (byEmail(b.email)) throw conflict("E-mail já cadastrado.");
    const u = { id: uuid(), tipo_usuario: tipo, nome: b.nome.trim(), email: b.email, senha: b.senha, status: tipo === "artesao" ? "pendente" : "ativo",
      cpf_cnpj: tipo === "artesao" ? String(b.cpf_cnpj) : null, biografia: b.biografia || null, foto_url: null, contato: null, origem: null, data_cadastro: now() };
    db.users.set(u.id, u);
    const out = { id: u.id, nome: u.nome, email: u.email, ...(tipo === "artesao" ? { status: u.status } : {}), data_cadastro: u.data_cadastro };
    res.status(201).json({ data: out });
  };
}
app.post("/auth/registro/artesao", registrar("artesao"));
app.post("/auth/registro/consumidor", registrar("consumidor"));

app.post("/auth/login", (req, res) => {
  const { email, senha } = req.body || {};
  const d = [];
  if (!isStr(email)) d.push({ campo: "email", mensagem: "Campo obrigatório." });
  if (!isStr(senha)) d.push({ campo: "senha", mensagem: "Campo obrigatório." });
  if (d.length) throw bad(d);
  const u = byEmail(email);
  if (!u || u.senha !== senha) throw new ApiError(401, "credenciais_invalidas", "E-mail ou senha inválidos.");
  if (u.status === "bloqueado") throw forbidden("Usuário bloqueado.");
  res.json({ data: {
    access_token: signJwt({ sub: u.id, tipo: u.tipo_usuario, typ: "access" }, ACCESS_TTL),
    refresh_token: signJwt({ sub: u.id, typ: "refresh" }, REFRESH_TTL),
    expires_in: ACCESS_TTL,
    usuario: { id: u.id, nome: u.nome, tipo_usuario: u.tipo_usuario },
  } });
});

app.post("/auth/refresh-token", (req, res) => {
  const { refresh_token } = req.body || {};
  if (!isStr(refresh_token)) throw bad([{ campo: "refresh_token", mensagem: "Campo obrigatório." }]);
  const p = verifyJwt(refresh_token);
  if (!p || p.typ !== "refresh") throw new ApiError(401, "token_invalido", "Refresh token inválido ou expirado.");
  const u = db.users.get(p.sub);
  if (!u) throw new ApiError(401, "token_invalido", "Usuário do token não existe mais.");
  if (u.status === "bloqueado") throw forbidden("Usuário bloqueado.");
  res.json({ data: { access_token: signJwt({ sub: u.id, tipo: u.tipo_usuario, typ: "access" }, ACCESS_TTL), expires_in: ACCESS_TTL } });
});

/* 2. Artesão (ordem importa: /me antes de /:id) */
app.get("/artesaos/me", auth("artesao"), (req, res) => res.json({ data: artesaoMeDto(req.user) }));

app.put("/artesaos/me", auth("artesao"), (req, res) => {
  const b = req.body || {}, d = [];
  if (b.nome !== undefined && !isStr(b.nome, 2, 120)) d.push({ campo: "nome", mensagem: "Deve ter entre 2 e 120 caracteres." });
  for (const k of ["biografia", "foto_url", "contato", "origem"])
    if (b[k] !== undefined && b[k] !== null && typeof b[k] !== "string") d.push({ campo: k, mensagem: "Deve ser texto." });
  if (d.length) throw bad(d);
  for (const k of ["nome", "biografia", "foto_url", "contato", "origem"]) if (b[k] !== undefined) req.user[k] = b[k];
  res.json({ data: artesaoMeDto(req.user) });
});

app.get("/artesaos/me/pedidos", auth("artesao"), (req, res) => {
  let os = [...db.pedidos.values()].filter(o => o.status_pedido !== "aguardando_pagamento" && o.itens.some(i => i.artesao_id === req.user.id));
  if (req.query.status) os = os.filter(o => o.status_pedido === req.query.status);
  os.sort((a, b) => b.data_pedido.localeCompare(a.data_pedido));
  const r = paginate(os, req.query);
  res.json({ data: r.data.map(o => {
    const v = pedidoView(o, req.user);
    return { id: o.id, numero_pedido: o.numero_pedido, comprador: { nome: db.users.get(o.usuario_id)?.nome ?? "—" },
      itens: v.itens.map(i => ({ produto_id: i.produto_id, nome: i.nome, quantidade: i.quantidade })), valor_total: v.valor_total, status_pedido: o.status_pedido };
  }), meta: r.meta });
});

const artesaoPublico = id => { const u = db.users.get(id); return u && u.tipo_usuario === "artesao" && u.status === "aprovado" ? u : null; };
app.get("/artesaos/:id", (req, res) => {
  const u = artesaoPublico(req.params.id); if (!u) throw notFound("Artesão");
  res.json({ data: { id: u.id, nome: u.nome, biografia: u.biografia, foto_url: u.foto_url, origem: u.origem } });
});
app.get("/artesaos/:id/produtos", (req, res) => {
  const u = artesaoPublico(req.params.id); if (!u) throw notFound("Artesão");
  const ps = [...db.produtos.values()].filter(p => p.artesao_id === u.id && p.status === "ativo").sort((a, b) => b.data_cadastro.localeCompare(a.data_cadastro));
  const r = paginate(ps, req.query);
  res.json({ data: r.data.map(p => ({ id: p.id, nome: p.nome, preco: p.preco, disponivel: disponivel(p), foto_capa: fotoCapa(p) })), meta: r.meta });
});

/* 3. Produto */
const donoDoProduto = (req) => {
  const p = db.produtos.get(req.params.id); if (!p) throw notFound("Produto");
  if (p.artesao_id !== req.user.id) throw forbidden("Você só pode alterar seus próprios produtos.");
  return p;
};
app.post("/produtos", auth("artesao"), (req, res) => {
  if (req.user.status !== "aprovado") throw forbidden("Cadastro de artesão ainda não aprovado.");
  const b = req.body || {}; validateProduto(b, false);
  const p = { id: uuid(), nome: b.nome.trim(), descricao: b.descricao, historia_peca: b.historia_peca ?? null, preco: b.preco, categoria_id: b.categoria_id,
    quantidade_estoque: b.quantidade_estoque, fotos: b.fotos || [], status: b.status || "ativo", artesao_id: req.user.id, data_cadastro: now() };
  db.produtos.set(p.id, p);
  res.status(201).json({ data: produtoCriadoDto(p) });
});

app.get("/produtos", (req, res) => {
  let ps = [...db.produtos.values()].filter(p => p.status === "ativo");
  if (req.query.q) { const q = String(req.query.q).toLowerCase(); ps = ps.filter(p => [p.nome, p.descricao, p.historia_peca].some(t => (t || "").toLowerCase().includes(q))); }
  if (req.query.categoria_id) ps = ps.filter(p => p.categoria_id === req.query.categoria_id);
  ps.sort((a, b) => b.data_cadastro.localeCompare(a.data_cadastro));
  const r = paginate(ps, req.query);
  res.json({ data: r.data.map(p => ({ id: p.id, nome: p.nome, foto_capa: fotoCapa(p), preco: p.preco, disponivel: disponivel(p), categoria: db.categorias.get(p.categoria_id)?.nome ?? null })), meta: r.meta });
});

app.get("/produtos/:id", (req, res) => {
  const p = db.produtos.get(req.params.id); if (!p) throw notFound("Produto");
  const c = db.categorias.get(p.categoria_id), a = db.users.get(p.artesao_id);
  res.json({ data: { id: p.id, nome: p.nome, descricao: p.descricao, historia_peca: p.historia_peca, preco: p.preco, quantidade_estoque: p.quantidade_estoque, disponivel: disponivel(p),
    fotos: p.fotos, categoria: c ? { id: c.id, nome: c.nome } : null, artesao: { id: a.id, nome: a.nome, foto_url: a.foto_url },
    avaliacao_media: media(p.id), total_avaliacoes: avaliacoesDe(p.id).length } });
});

app.put("/produtos/:id", auth("artesao"), (req, res) => {
  const p = donoDoProduto(req); const b = req.body || {}; validateProduto(b, true);
  for (const k of ["nome", "descricao", "historia_peca", "preco", "categoria_id", "quantidade_estoque", "fotos", "status"]) if (b[k] !== undefined) p[k] = b[k];
  res.json({ data: produtoCriadoDto(p) });
});

app.delete("/produtos/:id", auth("artesao"), (req, res) => {
  const p = donoDoProduto(req);
  db.produtos.delete(p.id);
  db.carrinhos.forEach(c => { c.itens = c.itens.filter(i => i.produto_id !== p.id); });
  avaliacoesDe(p.id).forEach(a => db.avaliacoes.delete(a.id));
  res.status(204).end();
});

app.patch("/produtos/:id/disponibilidade", auth("artesao"), (req, res) => {
  const p = donoDoProduto(req); const q = (req.body || {}).quantidade_estoque;
  if (!(Number.isInteger(q) && q >= 0)) throw bad([{ campo: "quantidade_estoque", mensagem: "Deve ser inteiro >= 0." }]);
  p.quantidade_estoque = q;
  res.json({ data: { id: p.id, quantidade_estoque: p.quantidade_estoque, disponivel: disponivel(p) } });
});

/* 4. Categoria */
app.get("/categorias", (req, res) => res.json({ data: [...db.categorias.values()].map(c => ({ id: c.id, nome: c.nome })) }));
app.post("/categorias", auth("admin", "artesao"), (req, res) => {
  const nome = (req.body || {}).nome;
  if (!isStr(nome, 2, 60)) throw bad([{ campo: "nome", mensagem: "Deve ter entre 2 e 60 caracteres." }]);
  if ([...db.categorias.values()].some(c => c.nome.toLowerCase() === nome.trim().toLowerCase())) throw conflict("Categoria já existe.");
  const c = { id: uuid(), nome: nome.trim() }; db.categorias.set(c.id, c);
  res.status(201).json({ data: c });
});

/* 5. Carrinho */
app.get("/carrinho", auth("consumidor"), (req, res) => res.json({ data: cartDto(cartOf(req.user.id)) }));

app.post("/carrinho/itens", auth("consumidor"), (req, res) => {
  const { produto_id, quantidade } = req.body || {}, d = [];
  if (!isStr(produto_id)) d.push({ campo: "produto_id", mensagem: "Campo obrigatório." });
  if (!(Number.isInteger(quantidade) && quantidade >= 1)) d.push({ campo: "quantidade", mensagem: "Deve ser inteiro >= 1." });
  if (d.length) throw bad(d);
  const p = db.produtos.get(produto_id); if (!p) throw notFound("Produto");
  const c = cartOf(req.user.id);
  let item = c.itens.find(i => i.produto_id === p.id);
  const total = (item?.quantidade || 0) + quantidade;
  if (p.status !== "ativo" || total > p.quantidade_estoque) throw conflict("Produto indisponível ou estoque insuficiente.");
  if (item) item.quantidade = total; else { item = { id: uuid(), produto_id: p.id, quantidade }; c.itens.push(item); }
  res.status(201).json({ data: { id: item.id, produto: { id: p.id, nome: p.nome, preco: p.preco }, quantidade: item.quantidade, subtotal: money(p.preco * item.quantidade) } });
});

app.put("/carrinho/itens/:id", auth("consumidor"), (req, res) => {
  const c = cartOf(req.user.id); const item = c.itens.find(i => i.id === req.params.id); if (!item) throw notFound("Item do carrinho");
  const q = (req.body || {}).quantidade;
  if (!(Number.isInteger(q) && q >= 1)) throw bad([{ campo: "quantidade", mensagem: "Deve ser inteiro >= 1." }]);
  const p = db.produtos.get(item.produto_id);
  if (q > p.quantidade_estoque) throw conflict("Estoque insuficiente.");
  item.quantidade = q;
  res.json({ data: { id: item.id, quantidade: q, subtotal: money(p.preco * q) } });
});

app.delete("/carrinho/itens/:id", auth("consumidor"), (req, res) => {
  const c = cartOf(req.user.id); if (!c.itens.some(i => i.id === req.params.id)) throw notFound("Item do carrinho");
  c.itens = c.itens.filter(i => i.id !== req.params.id);
  res.status(204).end();
});

/* 6. Pedido */
app.post("/pedidos", auth("consumidor"), (req, res) => {
  const b = req.body || {}, e = b.endereco_entrega || {}, d = [];
  for (const k of ["logradouro", "cidade"]) if (!isStr(e[k])) d.push({ campo: `endereco_entrega.${k}`, mensagem: "Campo obrigatório." });
  if (!/^[A-Za-z]{2}$/.test(String(e.estado || ""))) d.push({ campo: "endereco_entrega.estado", mensagem: "Use a sigla da UF (ex.: SP)." });
  if (!CEP.test(String(e.cep || ""))) d.push({ campo: "endereco_entrega.cep", mensagem: "CEP inválido (ex.: 01234-000)." });
  if (!METODOS_PAGAMENTO.includes(b.metodo_pagamento)) d.push({ campo: "metodo_pagamento", mensagem: `Use um de: ${METODOS_PAGAMENTO.join(", ")}.` });
  if (d.length) throw bad(d);
  const c = cartOf(req.user.id);
  if (!c.itens.length) throw bad([{ campo: "carrinho", mensagem: "Carrinho vazio." }], "Não é possível criar pedido com carrinho vazio.");
  const itens = c.itens.map(i => {
    const p = db.produtos.get(i.produto_id);
    if (p.status !== "ativo" || p.quantidade_estoque < i.quantidade) throw conflict(`Estoque insuficiente para "${p.nome}".`);
    return { produto_id: p.id, nome: p.nome, quantidade: i.quantidade, preco_unitario: p.preco, artesao_id: p.artesao_id };
  });
  itens.forEach(i => { db.produtos.get(i.produto_id).quantidade_estoque -= i.quantidade; });
  c.itens = [];
  const o = criarPedido({ usuario_id: req.user.id, itens, endereco_entrega: { logradouro: e.logradouro, cidade: e.cidade, estado: e.estado.toUpperCase(), cep: e.cep }, metodo: b.metodo_pagamento });
  res.status(201).json({ data: { id: o.id, numero_pedido: o.numero_pedido, status_pedido: o.status_pedido, valor_total: o.valor_total, itens: pedidoItensDto(o), data_pedido: o.data_pedido } });
});

app.get("/pedidos", auth("consumidor", "admin"), (req, res) => {
  let os = [...db.pedidos.values()];
  if (req.user.tipo_usuario === "consumidor") os = os.filter(o => o.usuario_id === req.user.id);
  if (req.query.status) os = os.filter(o => o.status_pedido === req.query.status);
  os.sort((a, b) => b.data_pedido.localeCompare(a.data_pedido));
  const r = paginate(os, req.query);
  res.json({ data: r.data.map(o => ({ id: o.id, numero_pedido: o.numero_pedido, data_pedido: o.data_pedido, valor_total: o.valor_total, status_pedido: o.status_pedido })), meta: r.meta });
});

app.get("/pedidos/:id", auth(), (req, res) => {
  const o = db.pedidos.get(req.params.id); if (!o) throw notFound("Pedido");
  if (!podeVerPedido(o, req.user)) throw forbidden("Você não tem acesso a este pedido.");
  const v = pedidoView(o, req.user);
  res.json({ data: { id: o.id, numero_pedido: o.numero_pedido, status_pedido: o.status_pedido, valor_total: v.valor_total, data_pedido: o.data_pedido, endereco_entrega: o.endereco_entrega,
    itens: pedidoItensDto(v), pagamento: o.pagamento, entrega: { status: entregaStatus(o), codigo_rastreio: o.codigo_rastreio } } });
});

app.patch("/pedidos/:id/status", auth("artesao", "admin", "consumidor"), (req, res) => {
  const o = db.pedidos.get(req.params.id); if (!o) throw notFound("Pedido");
  if (!podeVerPedido(o, req.user)) throw forbidden("Você não tem acesso a este pedido.");
  const { status_pedido: novo, codigo_rastreio } = req.body || {};
  if (!STATUS_PEDIDO.includes(novo)) throw bad([{ campo: "status_pedido", mensagem: `Use um de: ${STATUS_PEDIDO.join(", ")}.` }]);
  const tipo = req.user.tipo_usuario;
  if (tipo === "consumidor" && !(novo === "cancelado" && o.status_pedido === "aguardando_pagamento"))
    throw forbidden("Consumidor só pode cancelar pedidos que aguardam pagamento.");
  if (tipo === "artesao" && !(FLUXO_ARTESAO[o.status_pedido] || []).includes(novo))
    throw conflict(`Transição inválida: ${o.status_pedido} → ${novo}. Fluxo do artesão: pago → preparando → enviado → entregue.`);
  if (novo === "enviado") {
    if (!isStr(codigo_rastreio, 3, 60)) throw bad([{ campo: "codigo_rastreio", mensagem: "Obrigatório ao marcar como enviado." }]);
    o.codigo_rastreio = codigo_rastreio;
  }
  if (novo === "cancelado") { restock(o); o.pagamento.status = o.pagamento.status === "aprovado" ? "estornado" : "cancelado"; }
  if (novo === "pago") o.pagamento.status = "aprovado";
  o.status_pedido = novo;
  res.json({ data: { id: o.id, status_pedido: o.status_pedido, codigo_rastreio: o.codigo_rastreio } });
});

// EXTRA (fora do PDF): simula a aprovação do pagamento pelo gateway.
app.post("/pedidos/:id/pagamento/aprovar", auth("consumidor"), (req, res) => {
  const o = db.pedidos.get(req.params.id); if (!o || o.usuario_id !== req.user.id) throw notFound("Pedido");
  if (o.status_pedido !== "aguardando_pagamento") throw conflict("Pedido não está aguardando pagamento.");
  o.status_pedido = "pago"; o.pagamento.status = "aprovado";
  res.json({ data: { id: o.id, status_pedido: o.status_pedido, pagamento: o.pagamento } });
});

/* 7. Avaliação */
app.post("/produtos/:id/avaliacoes", auth("consumidor"), (req, res) => {
  const p = db.produtos.get(req.params.id); if (!p) throw notFound("Produto");
  const { nota, comentario } = req.body || {}, d = [];
  if (!(Number.isInteger(nota) && nota >= 1 && nota <= 5)) d.push({ campo: "nota", mensagem: "Deve ser inteiro entre 1 e 5." });
  if (comentario !== undefined && typeof comentario !== "string") d.push({ campo: "comentario", mensagem: "Deve ser texto." });
  if (d.length) throw bad(d);
  const comprou = [...db.pedidos.values()].some(o => o.usuario_id === req.user.id && o.status_pedido === "entregue" && o.itens.some(i => i.produto_id === p.id));
  if (!comprou) throw forbidden("Só é possível avaliar produtos de pedidos já entregues.");
  if (avaliacoesDe(p.id).some(a => a.usuario_id === req.user.id)) throw conflict("Você já avaliou este produto.");
  const a = { id: uuid(), produto_id: p.id, usuario_id: req.user.id, nota, comentario: comentario || "", data_avaliacao: now() };
  db.avaliacoes.set(a.id, a);
  res.status(201).json({ data: { id: a.id, produto_id: a.produto_id, nota: a.nota, comentario: a.comentario, data_avaliacao: a.data_avaliacao } });
});

app.get("/produtos/:id/avaliacoes", (req, res) => {
  if (!db.produtos.has(req.params.id)) throw notFound("Produto");
  const as = avaliacoesDe(req.params.id).sort((a, b) => b.data_avaliacao.localeCompare(a.data_avaliacao));
  const r = paginate(as, req.query);
  res.json({ data: r.data.map(a => ({ id: a.id, comprador: { nome: db.users.get(a.usuario_id)?.nome ?? "—" }, nota: a.nota, comentario: a.comentario, data_avaliacao: a.data_avaliacao })), meta: r.meta });
});

/* 8. Administrador */
const admin = auth("admin");
const pedidosPagos = () => [...db.pedidos.values()].filter(o => PAGOS.includes(o.status_pedido));

app.get("/admin/dashboard", admin, (req, res) => {
  const us = [...db.users.values()];
  res.json({ data: {
    total_vendas: money(pedidosPagos().reduce((s, o) => s + o.valor_total, 0)),
    total_pedidos: db.pedidos.size,
    total_usuarios: { compradores: us.filter(u => u.tipo_usuario === "consumidor").length, artesaos: us.filter(u => u.tipo_usuario === "artesao").length },
    total_produtos_ativos: [...db.produtos.values()].filter(p => p.status === "ativo").length,
  } });
});

function periodo(q) {
  const p = q.periodo || "30d";
  if (p === "custom") {
    const i = new Date(q.data_inicio), f = new Date(q.data_fim);
    if (isNaN(i) || isNaN(f)) throw bad([{ campo: "data_inicio/data_fim", mensagem: "Obrigatórias e válidas (YYYY-MM-DD) quando periodo=custom." }]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(q.data_fim)) f.setUTCHours(23, 59, 59, 999);
    return [i, f];
  }
  const m = /^(7|30|90)d$/.exec(p);
  if (!m) throw bad([{ campo: "periodo", mensagem: "Use 7d, 30d, 90d ou custom." }]);
  return [new Date(Date.now() - Number(m[1]) * 864e5), new Date()];
}

app.get("/admin/indicadores/vendas", admin, (req, res) => {
  const [ini, fim] = periodo(req.query);
  const fin = [...db.pedidos.values()].filter(o => o.status_pedido === "entregue" && new Date(o.data_pedido) >= ini && new Date(o.data_pedido) <= fim);
  const gmv = money(fin.reduce((s, o) => s + o.valor_total, 0));
  res.json({ data: { gmv, total_pedidos_finalizados: fin.length, ticket_medio: fin.length ? money(gmv / fin.length) : 0 } });
});

app.get("/admin/indicadores/produtos", admin, (req, res) => {
  const pagos = pedidosPagos(), vend = new Map(), cats = new Map();
  pagos.forEach(o => {
    o.itens.forEach(i => vend.set(i.produto_id, { nome: i.nome, un: (vend.get(i.produto_id)?.un || 0) + i.quantidade }));
    new Set(o.itens.map(i => db.produtos.get(i.produto_id)?.categoria_id).filter(Boolean)).forEach(cid => cats.set(cid, (cats.get(cid) || 0) + 1));
  });
  res.json({ data: {
    mais_vendidos: [...vend.entries()].sort((a, b) => b[1].un - a[1].un).slice(0, 5).map(([id, v]) => ({ produto_id: id, nome: v.nome, unidades_vendidas: v.un })),
    // taxa_conversao (fake): pedidos pagos que contêm a categoria ÷ total de pedidos criados
    categorias_maior_conversao: [...cats.entries()].sort((a, b) => b[1] - a[1]).map(([cid, n]) => ({ categoria: db.categorias.get(cid).nome, taxa_conversao: Math.round((n / db.pedidos.size) * 100) / 100 })),
  } });
});

app.get("/admin/indicadores/artesaos", admin, (req, res) => {
  const as = [...db.users.values()].filter(u => u.tipo_usuario === "artesao");
  res.json({ data: { total_artesaos: as.length, artesaos_ativos: as.filter(u => u.status === "aprovado").length } });
});

app.get("/admin/indicadores/consumidores", admin, (req, res) => {
  const cs = [...db.users.values()].filter(u => u.tipo_usuario === "consumidor");
  const d = new Date(), mes = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const porUser = new Map(); pedidosPagos().forEach(o => porUser.set(o.usuario_id, (porUser.get(o.usuario_id) || 0) + 1));
  const compradores = [...porUser.values()];
  res.json({ data: {
    novos_cadastros_mes: cs.filter(u => u.data_cadastro.startsWith(mes)).length,
    taxa_recorrencia: compradores.length ? Math.round((compradores.filter(n => n >= 2).length / compradores.length) * 100) / 100 : 0,
  } });
});

app.get("/admin/usuarios", admin, (req, res) => {
  const { tipo, status, q } = req.query;
  if (tipo && !["artesao", "consumidor"].includes(tipo)) throw bad([{ campo: "tipo", mensagem: "Use artesao ou consumidor." }]);
  let us = [...db.users.values()].filter(u => u.tipo_usuario !== "admin");
  if (tipo) us = us.filter(u => u.tipo_usuario === tipo);
  if (status) us = us.filter(u => u.status === status);
  if (q) { const s = String(q).toLowerCase(); us = us.filter(u => u.nome.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)); }
  us.sort((a, b) => b.data_cadastro.localeCompare(a.data_cadastro));
  const r = paginate(us, req.query);
  res.json({ data: r.data.map(u => ({ id: u.id, nome: u.nome, tipo_usuario: u.tipo_usuario, status: u.status })), meta: r.meta });
});

const alvo = req => {
  const u = db.users.get(req.params.id); if (!u) throw notFound("Usuário");
  if (u.tipo_usuario === "admin") throw forbidden("Administradores não podem ser alterados por esta rota.");
  return u;
};
app.patch("/admin/usuarios/:id/bloquear", admin, (req, res) => {
  const u = alvo(req); const motivo = (req.body || {}).motivo;
  if (!isStr(motivo, 3, 500)) throw bad([{ campo: "motivo", mensagem: "Obrigatório (mín. 3 caracteres)." }]);
  if (u.status === "bloqueado") throw conflict("Usuário já está bloqueado.");
  u.status_anterior = u.status; u.status = "bloqueado"; u.motivo_bloqueio = motivo;
  res.json({ data: { id: u.id, status: u.status } });
});
// EXTRAS (fora do PDF), necessários para exercitar os fluxos de aprovação/desbloqueio:
app.patch("/admin/usuarios/:id/desbloquear", admin, (req, res) => {
  const u = alvo(req); if (u.status !== "bloqueado") throw conflict("Usuário não está bloqueado.");
  u.status = u.status_anterior || (u.tipo_usuario === "artesao" ? "aprovado" : "ativo"); delete u.motivo_bloqueio;
  res.json({ data: { id: u.id, status: u.status } });
});
app.patch("/admin/usuarios/:id/aprovar", admin, (req, res) => {
  const u = alvo(req); if (u.tipo_usuario !== "artesao" || u.status !== "pendente") throw conflict("Só artesãos pendentes podem ser aprovados.");
  u.status = "aprovado";
  res.json({ data: { id: u.id, status: u.status } });
});

/* Fallback e erros */
app.use((req, res, next) => next(new ApiError(404, "rota_nao_encontrada", `Rota ${req.method} ${req.path} não encontrada.`)));
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") err = bad(undefined, "JSON inválido no corpo da requisição.");
  if (!(err instanceof ApiError)) { console.error(err); err = new ApiError(500, "erro_interno", "Erro interno do servidor."); }
  res.status(err.status).json({ erro: { codigo: err.codigo, mensagem: err.message, ...(err.detalhes ? { detalhes: err.detalhes } : {}) } });
});

seed();
if (require.main === module) app.listen(PORT, () => console.log(`Fake API Marketplace Origem em http://localhost:${PORT}`));
module.exports = { app, seed, ID };