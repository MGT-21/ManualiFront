import express from "express";
import cors from "cors";
import { db } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());
const BASE = "/api/v1";
let nextPedidoId = 1, nextAvaliacaoId = 1, nextUsuarioId = 4, nextProdutoId = 11;

const ok = (res, data, meta) => res.json(meta ? { data, meta } : { data });
const erro = (res, status, codigo, mensagem, detalhes=[]) => res.status(status).json({ erro: { codigo, mensagem, detalhes, requestId: `req_${Date.now().toString(36)}` } });
const tokenUser = (req) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const userId = Number(token.split("_")[1]);
  return db.usuarios.find(u => u.id === userId) || null;
};
const auth = (req,res,next) => { req.user=tokenUser(req); if(!req.user) return erro(res,401,"NAO_AUTENTICADO","Token ausente ou inválido."); next(); };
const role = (...roles) => (req,res,next) => { if(!roles.includes(req.user?.papel)) return erro(res,403,"SEM_PERMISSAO","Você não tem permissão para acessar este recurso."); next(); };
const publicUser = u => { const {password,cpf,...safe}=u; return safe; };
const productImage = p => p.fotos?.[0] || "";
const paginate = (items, req) => {
  const pagina=Math.max(1, Number(req.query.pagina)||1), tamanho=Math.min(100,Math.max(1,Number(req.query.tamanho)||20));
  return { data: items.slice((pagina-1)*tamanho,pagina*tamanho), meta:{pagina,tamanho,total:items.length,totalPaginas:Math.ceil(items.length/tamanho)} };
};
const sorted = (items, sort) => {
  if(!sort) return items;
  const rules=sort.split(",");
  return [...items].sort((a,b)=>{ for(const rule of rules){const [field,dir]=rule.split(":"); if(a[field]<b[field]) return dir==="desc"?1:-1; if(a[field]>b[field]) return dir==="desc"?-1:1;} return 0; });
};
const productSummary = p => ({ id:p.id,nome:p.nome,preco:p.preco,imagem:productImage(p),categoria:p.categoria,estoque:p.estoque,mediaAvaliacoes:p.mediaAvaliacoes,totalAvaliacoes:p.totalAvaliacoes,artesaoId:p.artesaoId });
const cartFor = userId => {
  db.carrinhos[userId] ||= { id:userId, itens:[], atualizadoEm:new Date().toISOString() };
  const c=db.carrinhos[userId];
  const itens=c.itens.map(i=>{const p=db.produtos.find(p=>p.id===i.produtoId); return p?{produtoId:p.id,quantidade:i.quantidade,nome:p.nome,preco:p.preco,imagem:productImage(p),subtotal:+(p.preco*i.quantidade).toFixed(2)}:null;}).filter(Boolean);
  return { id:c.id,itens,total:+itens.reduce((s,i)=>s+i.subtotal,0).toFixed(2),atualizadoEm:c.atualizadoEm };
};
function recommendations(baseId, limit, surface) {
  const base=baseId ? db.produtos.find(p=>p.id===Number(baseId)) : null;
  let candidates=db.produtos.filter(p=>p.ativo && p.estoque>0 && p.id!==base?.id);
  if(base) candidates.sort((a,b)=>(b.categoria===base.categoria)-(a.categoria===base.categoria) || b.mediaAvaliacoes-a.mediaAvaliacoes || b.totalAvaliacoes-a.totalAvaliacoes);
  else candidates.sort((a,b)=>b.mediaAvaliacoes-a.mediaAvaliacoes || b.totalAvaliacoes-a.totalAvaliacoes);
  const chosen=candidates.slice(0,limit);
  const recId=`rec_${Date.now().toString(36)}`;
  return { data:chosen.map((p,i)=>({posicao:i+1,score:+Math.max(.55,.97-i*.06).toFixed(2),produto:productSummary(p)})),
    meta:{recomendacaoId:recId,superficie:surface,...(base?{produtoBaseId:base.id}:{}),origem:"fallback",modelo:"fake-rules-v1",variante:"A",limite:limit,geradoEm:new Date().toISOString()} };
}
app.get("/health/live",(req,res)=>res.json({status:"ok"}));
app.get("/health/ready",(req,res)=>res.json({status:"ok",dependencias:{banco:"ok",ia:"simulada"}}));

const api=express.Router();
api.post("/auth/login",(req,res)=>{
  const {username,password,tipo="usuario"}=req.body||{};
  const u=db.usuarios.find(x=>x.username===username && x.password===password && (tipo==="usuario" ? x.papel==="comprador" : x.papel===tipo));
  if(!u) return erro(res,401,"NAO_AUTENTICADO","Credenciais inválidas.");
  const accessToken=`fake_${u.id}_${Date.now()}`, refreshToken=`rt_${u.id}_${Date.now()}`;
  db.refreshTokens.add(refreshToken);
  return ok(res,{accessToken,refreshToken,expiraEm:900,usuario:publicUser(u)});
});
api.post("/auth/refresh",(req,res)=>{const rt=req.body?.refreshToken;if(!db.refreshTokens.has(rt))return erro(res,401,"NAO_AUTENTICADO","Refresh token inválido.");db.refreshTokens.delete(rt);const id=Number(rt.split("_")[1]);const accessToken=`fake_${id}_${Date.now()}`,refreshToken=`rt_${id}_${Date.now()}`;db.refreshTokens.add(refreshToken);ok(res,{accessToken,refreshToken,expiraEm:900});});
api.post("/auth/logout",auth,(req,res)=>{const rt=req.body?.refreshToken;db.refreshTokens.delete(rt);res.status(204).end();});
api.get("/auth/me",auth,(req,res)=>ok(res,publicUser(req.user)));

api.get("/produtos",(req,res)=>{
 let list=db.produtos.filter(p=>p.ativo || req.query.ativo==="false");
 if(req.query.ativo!==undefined) list=list.filter(p=>String(p.ativo)===req.query.ativo);
 if(req.query.categoria)list=list.filter(p=>p.categoria===req.query.categoria);
 if(req.query.artesaoId)list=list.filter(p=>p.artesaoId===Number(req.query.artesaoId));
 if(req.query.precoMin)list=list.filter(p=>p.preco>=Number(req.query.precoMin));
 if(req.query.precoMax)list=list.filter(p=>p.preco<=Number(req.query.precoMax));
 if(req.query.q){const q=req.query.q.toLowerCase();list=list.filter(p=>`${p.nome} ${p.descricao} ${p.categoria} ${(p.tags||[]).join(" ")}`.toLowerCase().includes(q));}
 list=sorted(list,req.query.ordenar);
 const result=paginate(list,req);res.json(result);
});
api.get("/produtos/:id",(req,res)=>{const p=db.produtos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Produto não encontrado.");ok(res,p);});
api.get("/produtos/:id/recomendacoes",(req,res)=>{const p=db.produtos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Produto não encontrado.");const limit=Math.min(12,Math.max(1,Number(req.query.limite)||4));const r=recommendations(p.id,limit,"produto");res.json(r);});
api.get("/recomendacoes/relacionados/:id",(req,res)=>{const p=db.produtos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Produto não encontrado.");const limit=Math.min(12,Math.max(1,Number(req.query.limite)||4));res.json(recommendations(p.id,limit,"produto"));});
api.get("/recomendacoes/destaque",(req,res)=>{const limit=Math.min(24,Math.max(1,Number(req.query.limite)||8));res.json(recommendations(null,limit,"destaque"));});
api.get("/recomendacoes/mais-avaliados",(req,res)=>ok(res,db.produtos.filter(p=>p.ativo&&p.estoque>0).sort((a,b)=>b.totalAvaliacoes-a.totalAvaliacoes).slice(0,Number(req.query.limite)||5).map(productSummary)));
api.post("/recomendacoes/eventos",(req,res)=>{const ev=req.body?.eventos||[];if(!Array.isArray(ev)||ev.length>50)return erro(res,400,"VALIDACAO_INVALIDA","Envie até 50 eventos.");db.eventosRecomendacao.push(...ev.map(e=>({...e,recebidoEm:new Date().toISOString()})));res.status(202).end();});

api.post("/produtos",auth,role("artesao","adm"),(req,res)=>{
 const b=req.body||{};if(!b.nome||b.preco==null||b.estoque==null)return erro(res,400,"VALIDACAO_INVALIDA","nome, preco e estoque são obrigatórios.");
 const p={id:nextProdutoId++,nome:b.nome,descricao:b.descricao||"",preco:Number(b.preco),estoque:Number(b.estoque),ativo:b.ativo??true,categoria:b.categoria||"Outros",tags:b.tags||[],fotos:b.fotos||[],historia:b.historia||"",artesaoId:req.user.papel==="adm"?(b.artesaoId||req.user.id):req.user.id,mediaAvaliacoes:0,totalAvaliacoes:0,criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString()};
 db.produtos.push(p);res.status(201).location(`${BASE}/produtos/${p.id}`).json({data:p});
});
api.patch("/produtos/:id",auth,role("artesao","adm"),(req,res)=>{const p=db.produtos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Produto não encontrado.");if(req.user.papel!=="adm"&&p.artesaoId!==req.user.id)return erro(res,403,"SEM_PERMISSAO","Produto de outro artesão.");Object.assign(p,req.body,{atualizadoEm:new Date().toISOString()});ok(res,p);});
api.put("/produtos/:id",auth,role("artesao","adm"),(req,res)=>{const p=db.produtos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Produto não encontrado.");if(req.user.papel!=="adm"&&p.artesaoId!==req.user.id)return erro(res,403,"SEM_PERMISSAO","Produto de outro artesão.");Object.assign(p,req.body,{atualizadoEm:new Date().toISOString()});ok(res,p);});
api.delete("/produtos/:id",auth,role("artesao","adm"),(req,res)=>{const p=db.produtos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Produto não encontrado.");if(req.user.papel!=="adm"&&p.artesaoId!==req.user.id)return erro(res,403,"SEM_PERMISSAO","Produto de outro artesão.");p.ativo=false;res.status(204).end();});
api.get("/produtos/:id/avaliacoes",(req,res)=>{const list=db.avaliacoes.filter(a=>a.produtoId===Number(req.params.id));res.json(paginate(list,req));});
api.get("/produtos/:id/avaliacoes/resumo",(req,res)=>{const a=db.avaliacoes.filter(a=>a.produtoId===Number(req.params.id));ok(res,{media:a.length?+(a.reduce((s,x)=>s+x.nota,0)/a.length).toFixed(1):0,total:a.length});});

api.get("/carrinho",auth,role("comprador"),(req,res)=>ok(res,cartFor(req.user.id)));
api.post("/carrinho/itens",auth,role("comprador"),(req,res)=>{const {produtoId,quantidade}=req.body||{};const p=db.produtos.find(p=>p.id===Number(produtoId));if(!p||!p.ativo||p.estoque<Number(quantidade)||!Number.isInteger(Number(quantidade))||Number(quantidade)<1)return erro(res,422,"REGRA_DE_NEGOCIO","Produto indisponível ou quantidade inválida.");const c=db.carrinhos[req.user.id]||={id:req.user.id,itens:[],atualizadoEm:new Date().toISOString()};const item=c.itens.find(i=>i.produtoId===p.id);if(item)item.quantidade+=Number(quantidade);else c.itens.push({produtoId:p.id,quantidade:Number(quantidade)});c.atualizadoEm=new Date().toISOString();ok(res,cartFor(req.user.id));});
api.put("/carrinho/itens/:produtoId",auth,role("comprador"),(req,res)=>{const id=Number(req.params.produtoId),q=Number(req.body?.quantidade),p=db.produtos.find(p=>p.id===id);if(!p||!p.ativo||!Number.isInteger(q)||q<1||q>p.estoque)return erro(res,422,"REGRA_DE_NEGOCIO","Quantidade inválida ou estoque insuficiente.");const c=db.carrinhos[req.user.id]||={id:req.user.id,itens:[],atualizadoEm:new Date().toISOString()};const item=c.itens.find(i=>i.produtoId===id);if(!item)return erro(res,404,"NAO_ENCONTRADO","Item não está no carrinho.");item.quantidade=q;c.atualizadoEm=new Date().toISOString();ok(res,cartFor(req.user.id));});
api.delete("/carrinho/itens/:produtoId",auth,role("comprador"),(req,res)=>{const c=db.carrinhos[req.user.id]||={id:req.user.id,itens:[],atualizadoEm:new Date().toISOString()};c.itens=c.itens.filter(i=>i.produtoId!==Number(req.params.produtoId));c.atualizadoEm=new Date().toISOString();ok(res,cartFor(req.user.id));});
api.delete("/carrinho",auth,role("comprador"),(req,res)=>{db.carrinhos[req.user.id]={id:req.user.id,itens:[],atualizadoEm:new Date().toISOString()};ok(res,cartFor(req.user.id));});

api.post("/pedidos",auth,role("comprador"),(req,res)=>{const {itens,cep,endereco}=req.body||{};if(!Array.isArray(itens)||!itens.length||!cep)return erro(res,400,"VALIDACAO_INVALIDA","Itens e CEP são obrigatórios.");const details=[];for(const i of itens){const p=db.produtos.find(p=>p.id===Number(i.produtoId));if(!p||!p.ativo||p.estoque<Number(i.quantidade)||!Number.isInteger(Number(i.quantidade))||Number(i.quantidade)<1)return erro(res,422,"REGRA_DE_NEGOCIO","Produto indisponível ou estoque insuficiente.");details.push({produtoId:p.id,quantidade:Number(i.quantidade),precoUnitario:p.preco,subtotal:+(p.preco*Number(i.quantidade)).toFixed(2)});}const total=+details.reduce((s,i)=>s+i.subtotal,0).toFixed(2);details.forEach(i=>db.produtos.find(p=>p.id===i.produtoId).estoque-=i.quantidade);const pedido={id:nextPedidoId++,data:new Date().toISOString(),usuarioId:req.user.id,cep,endereco:endereco||"",status:"pendente",total,itens:details};db.pedidos.push(pedido);db.carrinhos[req.user.id]={id:req.user.id,itens:[],atualizadoEm:new Date().toISOString()};res.status(201).json({data:pedido});});
api.get("/pedidos",auth,(req,res)=>{let list=req.user.papel==="adm"?db.pedidos:[...db.pedidos].filter(p=>p.usuarioId===req.user.id);if(req.query.status)list=list.filter(p=>p.status===req.query.status);res.json(paginate(list,req));});
api.get("/pedidos/:id",auth,(req,res)=>{const p=db.pedidos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Pedido não encontrado.");if(req.user.papel!=="adm"&&p.usuarioId!==req.user.id&&!(req.user.papel==="artesao"&&p.itens.some(i=>db.produtos.find(x=>x.id===i.produtoId)?.artesaoId===req.user.id)))return erro(res,403,"SEM_PERMISSAO","Sem acesso ao pedido.");ok(res,p);});
api.patch("/pedidos/:id",(req,res,next)=>{req.user=tokenUser(req);if(!req.user)return erro(res,401,"NAO_AUTENTICADO","Token ausente ou inválido.");const p=db.pedidos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Pedido não encontrado.");if(p.usuarioId!==req.user.id||p.status!=="pendente")return erro(res,403,"SEM_PERMISSAO","Só o dono pode editar pedido pendente.");Object.assign(p,{cep:req.body.cep??p.cep,endereco:req.body.endereco??p.endereco});ok(res,p);});
api.patch("/pedidos/:id/status",auth,role("artesao","adm"),(req,res)=>{const p=db.pedidos.find(p=>p.id===Number(req.params.id));if(!p)return erro(res,404,"NAO_ENCONTRADO","Pedido não encontrado.");const transitions={pendente:["aprovado","cancelado"],aprovado:["preparado","cancelado"],preparado:["enviado"],enviado:["entregue"]};if(!transitions[p.status]?.includes(req.body.status))return erro(res,422,"REGRA_DE_NEGOCIO","Transição de status inválida.");p.status=req.body.status;ok(res,p);});
api.delete("/pedidos/:id",auth,role("adm"),(req,res)=>{db.pedidos=db.pedidos.filter(p=>p.id!==Number(req.params.id));res.status(204).end();});

api.post("/avaliacoes",auth,role("comprador"),(req,res)=>{const {produtoId,nota,comentario=""}=req.body||{};if(!db.produtos.some(p=>p.id===Number(produtoId))||!Number.isInteger(Number(nota))||nota<1||nota>5||comentario.length>500)return erro(res,400,"VALIDACAO_INVALIDA","Produto, nota (1–5) ou comentário inválido.");if(db.avaliacoes.some(a=>a.usuarioId===req.user.id&&a.produtoId===Number(produtoId)))return erro(res,409,"CONFLITO","Você já avaliou este produto.");const a={id:nextAvaliacaoId++,produtoId:Number(produtoId),usuarioId:req.user.id,nota:Number(nota),comentario,criadoEm:new Date().toISOString()};db.avaliacoes.push(a);const p=db.produtos.find(p=>p.id===a.produtoId),all=db.avaliacoes.filter(x=>x.produtoId===p.id);p.totalAvaliacoes=all.length;p.mediaAvaliacoes=+(all.reduce((s,x)=>s+x.nota,0)/all.length).toFixed(1);res.status(201).json({data:a});});
api.get("/avaliacoes",auth,role("comprador","adm"),(req,res)=>{const list=req.user.papel==="adm"&&req.query.usuarioId?db.avaliacoes.filter(a=>a.usuarioId===Number(req.query.usuarioId)):db.avaliacoes.filter(a=>a.usuarioId===req.user.id);res.json(paginate(list,req));});
api.delete("/avaliacoes/:id",auth,(req,res)=>{const a=db.avaliacoes.find(a=>a.id===Number(req.params.id));if(!a)return erro(res,404,"NAO_ENCONTRADO","Avaliação não encontrada.");if(a.usuarioId!==req.user.id&&req.user.papel!=="adm")return erro(res,403,"SEM_PERMISSAO","Sem permissão.");db.avaliacoes=db.avaliacoes.filter(x=>x.id!==a.id);res.status(204).end();});

api.post("/usuarios", (req,res)=>{const b=req.body||{};if(!b.username||!b.password||!b.email)return erro(res,400,"VALIDACAO_INVALIDA","username, password e email são obrigatórios.");if(db.usuarios.some(u=>u.username===b.username||u.email===b.email))return erro(res,409,"CONFLITO","Username ou email já cadastrado.");const u={id:nextUsuarioId++,username:b.username,password:b.password,email:b.email,cep:b.cep||"",papel:"comprador"};db.usuarios.push(u);res.status(201).json({data:publicUser(u)});});
api.get("/usuarios",auth,role("adm"),(req,res)=>res.json(paginate(db.usuarios.filter(u=>!req.query.q||u.username.includes(req.query.q)).map(publicUser),req)));
api.get("/usuarios/:id",auth,(req,res)=>{const u=db.usuarios.find(u=>u.id===Number(req.params.id));if(!u)return erro(res,404,"NAO_ENCONTRADO","Usuário não encontrado.");if(req.user.id!==u.id&&req.user.papel!=="adm")return erro(res,403,"SEM_PERMISSAO","Sem permissão.");ok(res,publicUser(u));});
api.patch("/usuarios/:id",auth,(req,res)=>{const u=db.usuarios.find(u=>u.id===Number(req.params.id));if(!u)return erro(res,404,"NAO_ENCONTRADO","Usuário não encontrado.");if(req.user.id!==u.id&&req.user.papel!=="adm")return erro(res,403,"SEM_PERMISSAO","Sem permissão.");Object.assign(u,req.body);ok(res,publicUser(u));});
api.put("/usuarios/:id",auth,(req,res)=>{const u=db.usuarios.find(u=>u.id===Number(req.params.id));if(!u)return erro(res,404,"NAO_ENCONTRADO","Usuário não encontrado.");if(req.user.id!==u.id&&req.user.papel!=="adm")return erro(res,403,"SEM_PERMISSAO","Sem permissão.");for(const k of ["username","email","cep"])if(req.body[k]!==undefined)u[k]=req.body[k];ok(res,publicUser(u));});
api.put("/usuarios/:id/senha",auth,(req,res)=>{const u=db.usuarios.find(u=>u.id===Number(req.params.id));if(!u||u.id!==req.user.id)return erro(res,403,"SEM_PERMISSAO","Sem permissão.");if(u.password!==req.body.senhaAtual)return erro(res,400,"VALIDACAO_INVALIDA","Senha atual incorreta.");u.password=req.body.novaSenha;res.status(204).end();});
api.delete("/usuarios/:id",auth,(req,res)=>{if(req.user.papel!=="adm"&&req.user.id!==Number(req.params.id))return erro(res,403,"SEM_PERMISSAO","Sem permissão.");db.usuarios=db.usuarios.filter(u=>u.id!==Number(req.params.id));res.status(204).end();});

api.get("/admin/metricas/vendas",auth,role("adm"),(req,res)=>{const pedidos=db.pedidos;ok(res,{totalPedidos:pedidos.length,totalVendas:pedidos.reduce((s,p)=>s+p.total,0),pedidosEntregues:pedidos.filter(p=>p.status==="entregue").length,pedidosPendentes:pedidos.filter(p=>p.status==="pendente").length,ticketMedio:pedidos.length?+(pedidos.reduce((s,p)=>s+p.total,0)/pedidos.length).toFixed(2):0});});
api.get("/admin/metricas/produtos",auth,role("adm"),(req,res)=>ok(res,{totalProdutos:db.produtos.length,produtosAtivos:db.produtos.filter(p=>p.ativo).length,produtosInativos:db.produtos.filter(p=>!p.ativo).length,estoqueTotal:db.produtos.reduce((s,p)=>s+p.estoque,0)}));
api.get("/admin/metricas/artesaos",auth,role("adm"),(req,res)=>ok(res,{totalArtesaos:db.usuarios.filter(u=>u.papel==="artesao").length,artesaos:db.usuarios.filter(u=>u.papel==="artesao").map(publicUser)}));
api.get("/admin/metricas/consumidores",auth,role("adm"),(req,res)=>ok(res,{totalUsuarios:db.usuarios.length,totalCompradores:db.usuarios.filter(u=>u.papel==="comprador").length}));
api.get("/admin/metricas/geral",auth,role("adm"),(req,res)=>ok(res,{usuarios:db.usuarios.length,produtos:db.produtos.length,pedidos:db.pedidos.length,vendas:db.pedidos.reduce((s,p)=>s+p.total,0)}));
api.get("/admin/metricas/recomendacoes",auth,role("adm"),(req,res)=>{const events=db.eventosRecomendacao,impressions=events.filter(e=>e.tipo==="impressao").length,clicks=events.filter(e=>e.tipo==="clique").length;ok(res,{impressoes:impressions,cliques:clicks,ctr:impressions?clicks/impressions:0,adicoesCarrinho:events.filter(e=>e.tipo==="adicao_carrinho").length,pedidosAtribuidos:events.filter(e=>e.tipo==="compra").length,taxaFallback:1,latenciaP95Ms:35,porSuperficie:{destaque:0,produto:0},porVariante:{A:events.length}});});
app.use(BASE,api);
app.use((req,res)=>erro(res,404,"NAO_ENCONTRADO","Rota não encontrada."));
app.listen(3001,()=>console.log("Fake API rodando em http://localhost:3001"));
