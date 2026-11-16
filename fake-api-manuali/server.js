const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const db = {
  usuarios: new Map(), artesaos: new Map(), adms: new Map(),
  products: new Map(), pedidos: new Map(), carrinhos: new Map(),
  avaliacoes: new Map(), tokens: new Set()
};
const seq = { usuario: 2, artesao: 2, adm: 2, product: 4, pedido: 2, carrinho: 1, avaliacao: 3 };
const now = () => new Date().toISOString();
const clone = x => JSON.parse(JSON.stringify(x));
const publicUser = ({password, ...u}) => clone(u);
const fail = (res, status, message) => res.status(status).json({ erro: message });

function seed() {
  db.usuarios.set(1, {id:1, username:"joao", password:"Senha123", email:"joao@exemplo.com", cep:"50000-000"});
  db.artesaos.set(1, {id:1, username:"maria", password:"Senha123", email:"maria@exemplo.com", cep:"50000-000", cpf:"52998224725", bio:"Ceramista pernambucana", experiencia:"15 anos", telefone:"81999990000"});
  db.adms.set(1, {idAdm:1, username:"admin", password:"Senha123", email:"admin@exemplo.com"});
  db.products.set(1, {id:1,nome:"Vaso azul",descricao:"Vaso artesanal em cerâmica",preco:189.90,estoque:8,ativo:true,categoria:"Cerâmica",fotos:["https://placehold.co/600x600?text=Vaso+Azul"],historia:"Inspirado no litoral pernambucano",artesaoId:1});
  db.products.set(2, {id:2,nome:"Bowl terracota",descricao:"Bowl feito à mão",preco:89.90,estoque:12,ativo:true,categoria:"Cerâmica",fotos:["https://placehold.co/600x600?text=Bowl"],historia:"Peça única moldada manualmente",artesaoId:1});
  db.products.set(3, {id:3,nome:"Cesto de palha",descricao:"Cesto artesanal trançado",preco:129.00,estoque:0,ativo:false,categoria:"Fibra natural",fotos:["https://placehold.co/600x600?text=Cesto"],historia:"Tradição e trabalho manual",artesaoId:1});
  db.pedidos.set(1, {idPedido:1,data:now(),cep:"50000-000",endereco:"Rua das Flores, 123",usuarioId:1,status:"entregue",concluido:true,total:179.80,itens:[{idProduto:2,quantidade:2,precoUnitario:89.90,subtotal:179.80}]});
  db.avaliacoes.set(1,{id:1,produtoId:2,usuarioId:1,nota:5,comentario:"Peça excelente!",data:now()});
  db.avaliacoes.set(2,{id:2,produtoId:1,usuarioId:1,nota:4,comentario:"Muito bonita.",data:now()});
}
seed();

const numericId = value => /^\\d+$/.test(String(value)) && Number(value) > 0;
const cepOk = cep => /^\\d{5}-?\\d{3}$/.test(String(cep || ""));
const emailOk = email => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(email || ""));
const getById = (map, id) => map.get(Number(id));
const list = map => [...map.values()].map(clone);
function next(key) { return seq[key]++; }
function required(body, fields) { return fields.filter(k => body[k] === undefined || body[k] === null || body[k] === ""); }
function findUser(type, username) {
  const map = type === "artesao" ? db.artesaos : type === "adm" ? db.adms : db.usuarios;
  return [...map.values()].find(x => x.username === username);
}
function cartFor(userId) {
  let cart = db.carrinhos.get(Number(userId));
  if (!cart) {
    cart = {id:next("carrinho"),usuarioId:Number(userId),itens:[],atualizadoEm:now()};
    db.carrinhos.set(Number(userId), cart);
  }
  return cart;
}
function cartDto(cart) { return clone(cart); }
function cartDetails(cart) {
  const itens = cart.itens.map(i => {
    const p = db.products.get(i.idProduto);
    if (!p) return null;
    return {idProduto:i.idProduto,quantidade:i.quantidade,nome:p.nome,preco:p.preco,imagem:(p.fotos||[])[0] || null,subtotal:round(p.preco*i.quantidade)};
  }).filter(Boolean);
  return {itens,total:round(itens.reduce((s,i)=>s+i.subtotal,0))};
}
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;

// Health
app.get("/health", (req,res) => res.json({status:"ok",timestamp:now()}));

// Auth
app.post("/api/auth/login", (req,res) => {
  const {username,password,tipo="usuario"} = req.body || {};
  if (!["usuario","artesao","adm"].includes(tipo)) return fail(res,400,"Tipo de usuário inválido.");
  const user = findUser(tipo, username);
  if (!user || user.password !== password) return fail(res,401,"Usuário ou senha inválidos.");
  const token = `token_${tipo}_${user.id ?? user.idAdm}_${Date.now()}`;
  db.tokens.add(token);
  const usuario = tipo === "adm"
    ? {id:user.idAdm,username:user.username,email:user.email,papel:"administrador"}
    : {id:user.id,username:user.username,email:user.email,papel:tipo === "artesao" ? "artesao" : "comprador"};
  res.json({token,usuario});
});
app.post("/api/auth/logout", (req,res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\\s+/i,"");
  if (token) db.tokens.delete(token);
  res.json({mensagem:"Logout realizado com sucesso."});
});

// Generic CRUD for account collections
function accountRoutes(path, map, kind, requiredCreate, requiredUpdate, dto, validateCreate=()=>null, validateUpdate=()=>null) {
  app.get(path, (req,res) => res.json(list(map).map(dto)));
  app.get(path+"/search", (req,res) => {
    const found = [...map.values()].find(x => x.username === req.query.username);
    if (!found) return fail(res,404,"Registro não encontrado.");
    res.json(dto(found));
  });
  app.get(path+"/:id", (req,res) => {
    if (!numericId(req.params.id)) return fail(res,400,"ID inválido.");
    const item = map.get(Number(req.params.id));
    if (!item) return fail(res,404,"Registro não encontrado.");
    res.json(dto(item));
  });
  app.post(path, (req,res) => {
    const body = req.body || {}, missing = required(body,requiredCreate);
    if (missing.length) return fail(res,400,`Campos obrigatórios: ${missing.join(", ")}.`);
    const error = validateCreate(body); if (error) return fail(res,400,error);
    if ([...map.values()].some(x=>x.username===body.username)) return fail(res,409,"Username já cadastrado.");
    const id = next(kind);
    const item = kind==="adm" ? {idAdm:id,...body} : {id,...body};
    map.set(id,item); res.status(201).json(dto(item));
  });
  app.put(path+"/:id", (req,res) => {
    if (!numericId(req.params.id)) return fail(res,400,"ID inválido.");
    const id=Number(req.params.id), old=map.get(id);
    if (!old) return fail(res,404,"Registro não encontrado.");
    const body=req.body||{}, missing=required(body,requiredUpdate);
    if (missing.length) return fail(res,400,`Campos obrigatórios: ${missing.join(", ")}.`);
    const error=validateUpdate(body); if(error) return fail(res,400,error);
    const updated={...old,...body}; map.set(id,updated); res.json(dto(updated));
  });
  app.delete(path+"/:id", (req,res) => {
    if (!numericId(req.params.id)) return fail(res,400,"ID inválido.");
    if (!map.has(Number(req.params.id))) return fail(res,404,"Registro não encontrado.");
    map.delete(Number(req.params.id)); res.status(204).end();
  });
}
accountRoutes("/api/usuarios",db.usuarios,"usuario",["username","password","email","cep"],["username","email","cep"],publicUser,
  b=>!emailOk(b.email)?"Email inválido.":!cepOk(b.cep)?"CEP inválido.":String(b.username).length<3||String(b.username).length>50?"Username deve ter entre 3 e 50 caracteres.":String(b.password).length<6?"Senha deve ter no mínimo 6 caracteres.":null,
  b=>!emailOk(b.email)?"Email inválido.":!cepOk(b.cep)?"CEP inválido.":null);
accountRoutes("/api/artesaos",db.artesaos,"artesao",["username","password","email","cep","cpf"],["username","email","cep","cpf"],publicUser,
  b=>!emailOk(b.email)?"Email inválido.":!cepOk(b.cep)?"CEP inválido.":String(b.password).length<6?"Senha deve ter no mínimo 6 caracteres.":!/^\\d{11}$/.test(String(b.cpf))?"CPF inválido (use 11 dígitos).":null,
  b=>!emailOk(b.email)?"Email inválido.":!cepOk(b.cep)?"CEP inválido.":!/^\\d{11}$/.test(String(b.cpf))?"CPF inválido (use 11 dígitos).":null);
accountRoutes("/api/adms",db.adms,"adm",["username","password","email"],["username","email"],publicUser,
  b=>!emailOk(b.email)?"Email inválido.":String(b.password).length<6?"Senha deve ter no mínimo 6 caracteres.":null,
  b=>!emailOk(b.email)?"Email inválido.":null);

// Products
app.get("/api/products",(req,res)=>{
  let items=list(db.products);
  if(req.query.categoria) items=items.filter(p=>p.categoria===req.query.categoria);
  if(req.query.ativo!==undefined) items=items.filter(p=>p.ativo=== (req.query.ativo==="true"));
  res.json(items);
});
app.get("/api/products/search",(req,res)=>{
  const q=String(req.query.nome||"").toLowerCase();
  res.json(list(db.products).filter(p=>p.nome.toLowerCase().includes(q)));
});
app.get("/api/products/:id",(req,res)=>{
  if(!numericId(req.params.id)) return fail(res,400,"ID inválido.");
  const p=getById(db.products,req.params.id); if(!p) return fail(res,404,"Produto não encontrado."); res.json(clone(p));
});
app.post("/api/products",(req,res)=>{
  const b=req.body||{}, missing=required(b,["nome","preco","estoque"]);
  if(missing.length) return fail(res,400,`Campos obrigatórios: ${missing.join(", ")}.`);
  if(typeof b.preco!=="number"||b.preco<0||!Number.isInteger(b.estoque)||b.estoque<0) return fail(res,400,"Preço ou estoque inválido.");
  const id=next("product"), p={id,ativo:true,fotos:[],...b}; db.products.set(id,p); res.status(201).json(clone(p));
});
app.put("/api/products/:id",(req,res)=>{
  const id=Number(req.params.id), old=db.products.get(id), b=req.body||{};
  if(!numericId(req.params.id)) return fail(res,400,"ID inválido.");
  if(!old) return fail(res,404,"Produto não encontrado.");
  const missing=required(b,["nome","preco","estoque","ativo"]); if(missing.length) return fail(res,400,`Campos obrigatórios: ${missing.join(", ")}.`);
  if(typeof b.preco!=="number"||!Number.isInteger(b.estoque)||b.estoque<0||typeof b.ativo!=="boolean") return fail(res,400,"Dados do produto inválidos.");
  const p={...old,...b}; db.products.set(id,p); res.json(clone(p));
});
app.delete("/api/products/:id",(req,res)=>{const id=Number(req.params.id);if(!db.products.has(id))return fail(res,404,"Produto não encontrado.");db.products.delete(id);res.status(204).end();});

// Cart
app.get("/api/carrinho",(req,res)=>{
  const uid=Number(req.query.usuarioId); if(!numericId(req.query.usuarioId)) return fail(res,400,"usuarioId é obrigatório.");
  res.json(cartDto(cartFor(uid)));
});
app.get("/api/carrinho/itens",(req,res)=>{
  if(!numericId(req.query.usuarioId)) return fail(res,400,"usuarioId é obrigatório.");
  res.json(cartDetails(cartFor(req.query.usuarioId)));
});
app.post("/api/carrinho/itens",(req,res)=>{
  const uid=req.query.usuarioId,b=req.body||{}; if(!numericId(uid))return fail(res,400,"usuarioId é obrigatório.");
  if(!numericId(b.idProduto)||!Number.isInteger(b.quantidade)||b.quantidade<=0)return fail(res,400,"idProduto e quantidade positiva são obrigatórios.");
  const p=db.products.get(Number(b.idProduto));if(!p)return fail(res,404,"Produto não encontrado.");
  if(!p.ativo||p.estoque<b.quantidade)return fail(res,409,"Estoque insuficiente ou produto inativo.");
  const c=cartFor(uid), item=c.itens.find(i=>i.idProduto===Number(b.idProduto));
  if(item)item.quantidade+=b.quantidade;else c.itens.push({idProduto:Number(b.idProduto),quantidade:b.quantidade});
  c.atualizadoEm=now();res.json(cartDto(c));
});
app.put("/api/carrinho/itens/:idProduto",(req,res)=>{
  const uid=req.query.usuarioId,b=req.body||{}, pid=Number(req.params.idProduto);
  if(!numericId(uid))return fail(res,400,"usuarioId é obrigatório.");
  if(!Number.isInteger(b.quantidade)||b.quantidade<=0)return fail(res,400,"Quantidade deve ser positiva.");
  const c=cartFor(uid), item=c.itens.find(i=>i.idProduto===pid), p=db.products.get(pid);
  if(!item)return fail(res,404,"Item não encontrado no carrinho.");
  if(!p||p.estoque<b.quantidade)return fail(res,409,"Estoque insuficiente.");
  item.quantidade=b.quantidade;c.atualizadoEm=now();res.json(cartDto(c));
});
app.delete("/api/carrinho/itens/:idProduto",(req,res)=>{
  if(!numericId(req.query.usuarioId))return fail(res,400,"usuarioId é obrigatório.");
  const c=cartFor(req.query.usuarioId);c.itens=c.itens.filter(i=>i.idProduto!==Number(req.params.idProduto));c.atualizadoEm=now();res.json(cartDto(c));
});
app.delete("/api/carrinho",(req,res)=>{
  if(!numericId(req.query.usuarioId))return fail(res,400,"usuarioId é obrigatório.");
  const c=cartFor(req.query.usuarioId);c.itens=[];c.atualizadoEm=now();res.json(cartDto(c));
});

// Orders
app.get("/api/pedidos",(req,res)=>{
  let items=list(db.pedidos);
  if(req.query.usuarioId)items=items.filter(p=>p.usuarioId===Number(req.query.usuarioId));
  if(req.query.status)items=items.filter(p=>p.status===req.query.status);
  res.json(items);
});
app.get("/api/pedidos/:id",(req,res)=>{
  const p=db.pedidos.get(Number(req.params.id));if(!p)return fail(res,404,"Pedido não encontrado.");res.json(clone(p));
});
app.post("/api/pedidos",(req,res)=>{
  const b=req.body||{};if(!Array.isArray(b.itens)||!b.itens.length||!cepOk(b.cep))return fail(res,400,"itens e CEP válido são obrigatórios.");
  let total=0, itens=[];
  for(const i of b.itens){
    const p=db.products.get(Number(i.idProduto));
    if(!p||!Number.isInteger(i.quantidade)||i.quantidade<=0)return fail(res,400,"Item ou quantidade inválida.");
    if(!p.ativo||p.estoque<i.quantidade)return fail(res,409,`Estoque insuficiente para ${p.nome}.`);
    const subtotal=round(p.preco*i.quantidade);total+=subtotal;itens.push({idProduto:p.id,quantidade:i.quantidade,precoUnitario:p.preco,subtotal});
  }
  for(const i of b.itens)db.products.get(Number(i.idProduto)).estoque-=i.quantidade;
  const id=next("pedido"), order={idPedido:id,data:now(),cep:b.cep,endereco:b.endereco||"",usuarioId:b.usuarioId??null,status:"pendente",concluido:false,total:round(total),itens};
  db.pedidos.set(id,order);res.status(201).json(clone(order));
});
app.patch("/api/pedidos/:id/status",(req,res)=>{
  const p=db.pedidos.get(Number(req.params.id)), status=req.body?.status;
  if(!p)return fail(res,404,"Pedido não encontrado.");
  if(!["pendente","aprovado","preparado","enviado","entregue","cancelado"].includes(status))return fail(res,400,"Status inválido.");
  p.status=status;if(status==="entregue")p.concluido=true;res.json(clone(p));
});
app.put("/api/pedidos/:id",(req,res)=>{
  const p=db.pedidos.get(Number(req.params.id)),b=req.body||{};
  if(!p)return fail(res,404,"Pedido não encontrado.");
  if(!cepOk(b.cep)||typeof b.concluido!=="boolean")return fail(res,400,"CEP válido e concluido booleano são obrigatórios.");
  p.cep=b.cep;p.concluido=b.concluido;res.json(clone(p));
});
app.delete("/api/pedidos/:id",(req,res)=>{
  const id=Number(req.params.id),p=db.pedidos.get(id);if(!p)return fail(res,404,"Pedido não encontrado.");
  if(!p.concluido&&p.status!=="cancelado")for(const i of p.itens){const prod=db.products.get(i.idProduto);if(prod)prod.estoque+=i.quantidade;}
  db.pedidos.delete(id);res.status(204).end();
});

// Reviews
app.post("/api/avaliacoes",(req,res)=>{
  const uid=Number(req.query.usuarioId),b=req.body||{};
  if(!numericId(req.query.usuarioId)||!numericId(b.produtoId)||!Number.isInteger(b.nota)||b.nota<1||b.nota>5)return fail(res,400,"usuarioId, produtoId e nota entre 1 e 5 são obrigatórios.");
  if(!db.products.has(Number(b.produtoId)))return fail(res,404,"Produto não encontrado.");
  const id=next("avaliacao"),a={id,produtoId:Number(b.produtoId),usuarioId:uid,nota:b.nota,comentario:b.comentario||"",data:now()};
  db.avaliacoes.set(id,a);res.status(201).json(clone(a));
});
app.get("/api/avaliacoes/produto/:id",(req,res)=>res.json(list(db.avaliacoes).filter(a=>a.produtoId===Number(req.params.id))));
app.get("/api/avaliacoes/media/:id",(req,res)=>{
  const a=list(db.avaliacoes).filter(x=>x.produtoId===Number(req.params.id));
  res.json({media:a.length?round(a.reduce((s,x)=>s+x.nota,0)/a.length):0,total:a.length});
});
app.get("/api/avaliacoes/usuario",(req,res)=>{
  if(!numericId(req.query.usuarioId))return fail(res,400,"usuarioId é obrigatório.");
  res.json(list(db.avaliacoes).filter(a=>a.usuarioId===Number(req.query.usuarioId)));
});
app.delete("/api/avaliacoes/:id",(req,res)=>{if(!db.avaliacoes.has(Number(req.params.id)))return fail(res,404,"Avaliação não encontrada.");db.avaliacoes.delete(Number(req.params.id));res.status(204).end();});

// Recommendations
app.get("/api/recomendacoes/relacionados/:id",(req,res)=>{
  const p=db.products.get(Number(req.params.id));if(!p)return fail(res,404,"Produto não encontrado.");
  const limit=Math.max(0,Number(req.query.limite)||4);
  res.json(list(db.products).filter(x=>x.id!==p.id&&x.ativo&&x.categoria===p.categoria).slice(0,limit));
});
app.get("/api/recomendacoes/mais-avaliados",(req,res)=>{
  const limit=Math.max(0,Number(req.query.limite)||5);
  const ranked=list(db.products).map(p=>{const a=list(db.avaliacoes).filter(x=>x.produtoId===p.id);return {...p,mediaAvaliacoes:a.length?round(a.reduce((s,x)=>s+x.nota,0)/a.length):0,totalAvaliacoes:a.length};})
    .sort((a,b)=>b.mediaAvaliacoes-a.mediaAvaliacoes||b.totalAvaliacoes-a.totalAvaliacoes);
  res.json(ranked.slice(0,limit));
});
app.get("/api/recomendacoes/destaque",(req,res)=>{
  const limit=Math.max(0,Number(req.query.limite)||8);
  res.json(list(db.products).filter(p=>p.ativo&&p.estoque>0).slice(0,limit));
});

// Admin metrics
app.get("/api/admin/metricas/vendas",(req,res)=>{
  const pedidos=list(db.pedidos), entregues=pedidos.filter(p=>p.status==="entregue"), pendentes=pedidos.filter(p=>["pendente","aprovado","preparado","enviado"].includes(p.status));
  const vendas=entregues.reduce((s,p)=>s+p.total,0);
  res.json({totalPedidos:pedidos.length,totalVendas:round(vendas),pedidosEntregues:entregues.length,pedidosPendentes:pendentes.length,ticketMedio:entregues.length?round(vendas/entregues.length):0});
});
app.get("/api/admin/metricas/produtos",(req,res)=>{
  const p=list(db.products);res.json({totalProdutos:p.length,produtosAtivos:p.filter(x=>x.ativo).length,produtosInativos:p.filter(x=>!x.ativo).length,estoqueTotal:p.reduce((s,x)=>s+x.estoque,0)});
});
app.get("/api/admin/metricas/artesaos",(req,res)=>res.json({totalArtesãos:db.artesaos.size,artesaos:list(db.artesaos).map(publicUser)}));
app.get("/api/admin/metricas/consumidores",(req,res)=>res.json({totalUsuarios:db.usuarios.size,totalCompradores:db.usuarios.size}));
app.get("/api/admin/metricas/geral",(req,res)=>{
  const p=list(db.products),o=list(db.pedidos),done=o.filter(x=>x.status==="entregue"),sales=done.reduce((s,x)=>s+x.total,0);
  res.json({totalVendas:round(sales),totalPedidos:o.length,totalProdutos:p.length,totalArtesãos:db.artesaos.size,totalUsuarios:db.usuarios.size,ticketMedio:done.length?round(sales/done.length):0,produtosAtivos:p.filter(x=>x.ativo).length,pedidosPendentes:o.filter(x=>["pendente","aprovado","preparado","enviado"].includes(x.status)).length});
});

// Fallback and error handling
app.use((req,res)=>fail(res,404,"Rota não encontrada."));
app.use((err,req,res,next)=>{console.error(err);fail(res,500,"Erro interno do servidor.");});

app.listen(PORT,()=>console.log(`Fake API Marketplace Origem rodando em http://localhost:${PORT}`));
