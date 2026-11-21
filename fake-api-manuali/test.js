"use strict";
/** Testes de contrato: um por rota do PDF (status + shape) e regras de autorização/validação. */
const { app, ID } = require("./server");

let passed = 0, failed = 0, base;
const U = { uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i };

async function call(method, path, { token, body } = {}) {
  const r = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  return { status: r.status, json: text ? JSON.parse(text) : null };
}
function check(name, cond, extra = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); } else { failed++; console.log(`  ✗ ${name} ${extra}`); }
}
const keys = (o, ks) => o && ks.every(k => k in o);
const exact = (o, ks) => o && keys(o, ks) && Object.keys(o).length === ks.length;
const meta = m => keys(m, ["page", "limit", "total", "total_pages"]);
async function login(email, senha = "SenhaForte123") { return (await call("POST", "/auth/login", { body: { email, senha } })).json.data; }
const section = t => console.log(`\n${t}`);

(async () => {
  const server = app.listen(0); base = `http://localhost:${server.address().port}`;
  try {
    section("1. Autenticação");
    let r = await call("POST", "/auth/registro/artesao", { body: { nome: "Lúcia Rocha", email: "lucia@exemplo.com", senha: "SenhaForte123", cpf_cnpj: "123.456.789-00", biografia: "Renda renascença." } });
    check("POST /auth/registro/artesao → 201 {id,nome,email,status:pendente,data_cadastro}", r.status === 201 && exact(r.json.data, ["id", "nome", "email", "status", "data_cadastro"]) && r.json.data.status === "pendente");
    const lucia = r.json.data;
    r = await call("POST", "/auth/registro/artesao", { body: { nome: "Lúcia", email: "lucia@exemplo.com", senha: "SenhaForte123", cpf_cnpj: "12345678900" } });
    check("registro com e-mail repetido → 409", r.status === 409);
    r = await call("POST", "/auth/registro/artesao", { body: { nome: "X", email: "x", senha: "1" } });
    check("registro inválido → 400 com detalhes", r.status === 400 && Array.isArray(r.json.erro.detalhes));
    r = await call("POST", "/auth/registro/consumidor", { body: { nome: "Rita Alves", email: "rita@exemplo.com", senha: "SenhaForte123" } });
    check("POST /auth/registro/consumidor → 201 {id,nome,email,data_cadastro}", r.status === 201 && exact(r.json.data, ["id", "nome", "email", "data_cadastro"]));
    r = await call("POST", "/auth/login", { body: { email: "maria@exemplo.com", senha: "SenhaForte123" } });
    check("POST /auth/login → 200 {access_token,refresh_token,expires_in,usuario{id,nome,tipo_usuario}}", r.status === 200 && exact(r.json.data, ["access_token", "refresh_token", "expires_in", "usuario"]) && exact(r.json.data.usuario, ["id", "nome", "tipo_usuario"]) && r.json.data.expires_in === 3600 && r.json.data.usuario.tipo_usuario === "artesao");
    const refresh = r.json.data.refresh_token;
    r = await call("POST", "/auth/login", { body: { email: "maria@exemplo.com", senha: "errada" } });
    check("login com senha errada → 401", r.status === 401);
    r = await call("POST", "/auth/refresh-token", { body: { refresh_token: refresh } });
    check("POST /auth/refresh-token → 200 {access_token,expires_in}", r.status === 200 && exact(r.json.data, ["access_token", "expires_in"]));
    r = await call("POST", "/auth/refresh-token", { body: { refresh_token: (await login("maria@exemplo.com")).access_token } });
    check("refresh-token recusa access token → 401", r.status === 401);

    const maria = (await login("maria@exemplo.com")).access_token, joao = (await login("joao@exemplo.com")).access_token,
      carla = (await login("carla@exemplo.com")).access_token, adm = (await login("admin@exemplo.com")).access_token,
      ana = (await login("ana@exemplo.com")).access_token, luciaTk = (await login("lucia@exemplo.com")).access_token;

    section("2. Artesão");
    r = await call("GET", "/artesaos/me", { token: maria });
    check("GET /artesaos/me → 200 {id,nome,email,biografia,foto_url,contato,status,data_cadastro}", r.status === 200 && exact(r.json.data, ["id", "nome", "email", "biografia", "foto_url", "contato", "status", "data_cadastro"]) && r.json.data.status === "aprovado");
    r = await call("PUT", "/artesaos/me", { token: maria, body: { nome: "Maria Silva", biografia: "Nova descrição", foto_url: "https://x/y.jpg", contato: "+55 11 98888-0000" } });
    check("PUT /artesaos/me → 200 mesmo shape do GET e persiste", r.status === 200 && r.json.data.contato === "+55 11 98888-0000" && r.json.data.biografia === "Nova descrição");
    r = await call("GET", "/artesaos/me");
    check("GET /artesaos/me sem token → 401", r.status === 401);
    r = await call("GET", "/artesaos/me", { token: joao });
    check("GET /artesaos/me como consumidor → 403", r.status === 403);
    r = await call("GET", `/artesaos/${ID.maria}`);
    check("GET /artesaos/{id} → 200 {id,nome,biografia,foto_url,origem} (público, sem dados sensíveis)", r.status === 200 && exact(r.json.data, ["id", "nome", "biografia", "foto_url", "origem"]));
    r = await call("GET", `/artesaos/${ID.pedro}`);
    check("GET /artesaos/{id} de artesão pendente → 404", r.status === 404);
    r = await call("GET", `/artesaos/${ID.maria}/produtos?limit=3`);
    check("GET /artesaos/{id}/produtos → 200 {data[{id,nome,preco,disponivel,foto_capa}],meta}", r.status === 200 && exact(r.json.data[0], ["id", "nome", "preco", "disponivel", "foto_capa"]) && meta(r.json.meta) && r.json.data.length === 3 && r.json.meta.limit === 3);

    section("4. Categoria");
    r = await call("GET", "/categorias");
    check("GET /categorias → 200 {data[{id,nome}]}", r.status === 200 && exact(r.json.data[0], ["id", "nome"]));
    r = await call("POST", "/categorias", { token: adm, body: { nome: "Marcenaria" } });
    check("POST /categorias → 201 {data:{id,nome}}", r.status === 201 && exact(r.json.data, ["id", "nome"]));
    const catNova = r.json.data.id;
    r = await call("POST", "/categorias", { token: adm, body: { nome: "marcenaria" } });
    check("POST /categorias duplicada → 409", r.status === 409);
    r = await call("POST", "/categorias", { body: { nome: "Outra" } });
    check("POST /categorias sem token → 401", r.status === 401);

    section("3. Produto");
    const novoProd = { nome: "Vaso de cerâmica azul", descricao: "Peça feita em torno manual...", historia_peca: "Inspirado nas ondas do mar...", preco: 189.9, categoria_id: ID.catCeramica, quantidade_estoque: 5, fotos: ["https://x/foto1.jpg", "https://x/foto2.jpg"] };
    r = await call("POST", "/produtos", { token: maria, body: novoProd });
    check("POST /produtos → 201 {id,nome,preco,quantidade_estoque,disponivel,status,artesao_id,data_cadastro}", r.status === 201 && exact(r.json.data, ["id", "nome", "preco", "quantidade_estoque", "disponivel", "status", "artesao_id", "data_cadastro"]) && r.json.data.disponivel === true && r.json.data.status === "ativo" && r.json.data.artesao_id === ID.maria);
    const pid = r.json.data.id;
    r = await call("POST", "/produtos", { token: luciaTk, body: novoProd });
    check("POST /produtos por artesão pendente → 403", r.status === 403);
    r = await call("POST", "/produtos", { token: joao, body: novoProd });
    check("POST /produtos por consumidor → 403", r.status === 403);
    r = await call("POST", "/produtos", { token: maria, body: { nome: "x", preco: -1 } });
    check("POST /produtos inválido → 400 com detalhes", r.status === 400 && r.json.erro.detalhes.length >= 3);
    r = await call("GET", "/produtos?page=1&limit=5");
    check("GET /produtos → 200 {data[{id,nome,foto_capa,preco,disponivel,categoria}],meta}", r.status === 200 && exact(r.json.data[0], ["id", "nome", "foto_capa", "preco", "disponivel", "categoria"]) && meta(r.json.meta) && r.json.data.length === 5 && typeof r.json.data[0].categoria === "string");
    r = await call("GET", "/produtos?q=bowl");
    check("GET /produtos?q= filtra por texto", r.json.data.length === 1 && r.json.data[0].nome === "Bowl terracota");
    r = await call("GET", `/produtos?categoria_id=${ID.catTecelagem}`);
    check("GET /produtos?categoria_id= filtra por categoria", r.json.data.length === 2 && r.json.data.every(p => p.categoria === "Tecelagem"));
    r = await call("GET", `/produtos/${ID.vaso}`);
    const d = r.json.data;
    check("GET /produtos/{id} → 200 com categoria{}, artesao{}, avaliacao_media, total_avaliacoes", r.status === 200 && exact(d, ["id", "nome", "descricao", "historia_peca", "preco", "quantidade_estoque", "disponivel", "fotos", "categoria", "artesao", "avaliacao_media", "total_avaliacoes"]) && exact(d.categoria, ["id", "nome"]) && exact(d.artesao, ["id", "nome", "foto_url"]) && d.total_avaliacoes === 2 && d.avaliacao_media === 4.5);
    r = await call("GET", "/produtos/inexistente");
    check("GET /produtos/{id} inexistente → 404", r.status === 404 && r.json.erro.codigo === "nao_encontrado");
    r = await call("PUT", `/produtos/${pid}`, { token: maria, body: { preco: 199.9, nome: "Vaso azul grande" } });
    check("PUT /produtos/{id} parcial → 200 mesmo shape do POST", r.status === 200 && r.json.data.preco === 199.9 && r.json.data.nome === "Vaso azul grande" && r.json.data.quantidade_estoque === 5);
    r = await call("PUT", `/produtos/${ID.manta}`, { token: maria, body: { preco: 1 } });
    check("PUT em produto de outro artesão → 403", r.status === 403);
    r = await call("PATCH", `/produtos/${pid}/disponibilidade`, { token: maria, body: { quantidade_estoque: 0 } });
    check("PATCH /produtos/{id}/disponibilidade → 200 {id,quantidade_estoque:0,disponivel:false}", r.status === 200 && exact(r.json.data, ["id", "quantidade_estoque", "disponivel"]) && r.json.data.disponivel === false);
    r = await call("PATCH", `/produtos/${pid}/disponibilidade`, { token: maria, body: { quantidade_estoque: -2 } });
    check("PATCH disponibilidade inválida → 400", r.status === 400);
    r = await call("DELETE", `/produtos/${pid}`, { token: maria });
    check("DELETE /produtos/{id} → 204 sem corpo", r.status === 204 && r.json === null);
    r = await call("GET", `/produtos/${pid}`);
    check("produto removido → 404", r.status === 404);

    section("5. Carrinho");
    r = await call("GET", "/carrinho", { token: carla });
    check("GET /carrinho (vazio) → 200 {id,itens:[],valor_total:0}", r.status === 200 && exact(r.json.data, ["id", "itens", "valor_total"]) && r.json.data.itens.length === 0);
    r = await call("POST", "/carrinho/itens", { token: carla, body: { produto_id: ID.vaso, quantidade: 1 } });
    check("POST /carrinho/itens → 201 {id,produto{id,nome,preco},quantidade,subtotal}", r.status === 201 && exact(r.json.data, ["id", "produto", "quantidade", "subtotal"]) && exact(r.json.data.produto, ["id", "nome", "preco"]) && r.json.data.subtotal === 189.9);
    const itemId = r.json.data.id;
    r = await call("POST", "/carrinho/itens", { token: carla, body: { produto_id: ID.cesto, quantidade: 5 } });
    check("POST /carrinho/itens acima do estoque → 409", r.status === 409);
    r = await call("POST", "/carrinho/itens", { token: carla, body: { produto_id: "nao-existe", quantidade: 1 } });
    check("POST /carrinho/itens produto inexistente → 404", r.status === 404);
    r = await call("PUT", `/carrinho/itens/${itemId}`, { token: carla, body: { quantidade: 2 } });
    check("PUT /carrinho/itens/{id} → 200 {id,quantidade:2,subtotal:379.8}", r.status === 200 && exact(r.json.data, ["id", "quantidade", "subtotal"]) && r.json.data.subtotal === 379.8);
    r = await call("GET", "/carrinho", { token: carla });
    check("GET /carrinho → itens[{id,produto{id,nome,preco,foto_capa},quantidade,subtotal}] e valor_total", exact(r.json.data.itens[0], ["id", "produto", "quantidade", "subtotal"]) && exact(r.json.data.itens[0].produto, ["id", "nome", "preco", "foto_capa"]) && r.json.data.valor_total === 379.8);
    r = await call("DELETE", `/carrinho/itens/${itemId}`, { token: carla });
    check("DELETE /carrinho/itens/{id} → 204", r.status === 204);
    r = await call("GET", "/carrinho", { token: maria });
    check("carrinho é só de consumidor (artesão → 403)", r.status === 403);

    section("6. Pedido");
    r = await call("POST", "/pedidos", { token: carla, body: { endereco_entrega: { logradouro: "Rua A, 1", cidade: "Recife", estado: "PE", cep: "50000-000" }, metodo_pagamento: "pix" } });
    check("POST /pedidos com carrinho vazio → 400", r.status === 400);
    await call("POST", "/carrinho/itens", { token: carla, body: { produto_id: ID.vaso, quantidade: 2 } });
    await call("POST", "/carrinho/itens", { token: carla, body: { produto_id: ID.bowl, quantidade: 1 } });
    r = await call("POST", "/pedidos", { token: carla, body: { endereco_entrega: { logradouro: "Rua A, 1", cidade: "Recife", estado: "PE", cep: "50000" }, metodo_pagamento: "fiado" } });
    check("POST /pedidos inválido → 400", r.status === 400 && r.json.erro.detalhes.length === 2);
    const estoqueAntes = (await call("GET", `/produtos/${ID.vaso}`)).json.data.quantidade_estoque;
    r = await call("POST", "/pedidos", { token: carla, body: { endereco_entrega: { logradouro: "Rua das Flores, 123", cidade: "São Paulo", estado: "SP", cep: "01234-000" }, metodo_pagamento: "pix" } });
    check("POST /pedidos → 201 {id,numero_pedido,status_pedido,valor_total,itens[],data_pedido}", r.status === 201 && exact(r.json.data, ["id", "numero_pedido", "status_pedido", "valor_total", "itens", "data_pedido"]) && r.json.data.status_pedido === "aguardando_pagamento" && r.json.data.valor_total === 469.7 && /^PED-\d{4}-\d{5}$/.test(r.json.data.numero_pedido) && exact(r.json.data.itens[0], ["produto_id", "nome", "quantidade", "preco_unitario"]));
    const ped = r.json.data.id;
    check("pedido baixa o estoque", (await call("GET", `/produtos/${ID.vaso}`)).json.data.quantidade_estoque === estoqueAntes - 2);
    check("pedido esvazia o carrinho", (await call("GET", "/carrinho", { token: carla })).json.data.itens.length === 0);
    r = await call("GET", "/pedidos?limit=2", { token: carla });
    check("GET /pedidos → 200 {data[{id,numero_pedido,data_pedido,valor_total,status_pedido}],meta}", r.status === 200 && exact(r.json.data[0], ["id", "numero_pedido", "data_pedido", "valor_total", "status_pedido"]) && meta(r.json.meta) && r.json.data.length === 2);
    r = await call("GET", `/pedidos/${ped}`, { token: carla });
    check("GET /pedidos/{id} → inclui endereco_entrega, itens, pagamento{metodo,status}, entrega{status,codigo_rastreio}", r.status === 200 && keys(r.json.data, ["id", "numero_pedido", "status_pedido", "valor_total", "endereco_entrega", "itens", "pagamento", "entrega"]) && exact(r.json.data.pagamento, ["metodo", "status"]) && exact(r.json.data.entrega, ["status", "codigo_rastreio"]));
    r = await call("GET", `/pedidos/${ped}`, { token: joao });
    check("pedido de outro consumidor → 403", r.status === 403);
    r = await call("GET", "/artesaos/me/pedidos", { token: maria });
    check("pedido não pago ainda não aparece p/ artesão", !r.json.data.some(o => o.id === ped));
    r = await call("PATCH", `/pedidos/${ped}/status`, { token: maria, body: { status_pedido: "preparando" } });
    check("artesão não pode pular pagamento (aguardando_pagamento → preparando) → 409", r.status === 409);
    r = await call("POST", `/pedidos/${ped}/pagamento/aprovar`, { token: carla });
    check("(extra) POST /pedidos/{id}/pagamento/aprovar → status pago", r.status === 200 && r.json.data.status_pedido === "pago" && r.json.data.pagamento.status === "aprovado");
    r = await call("GET", "/artesaos/me/pedidos", { token: maria });
    const mine = r.json.data.find(o => o.id === ped);
    check("GET /artesaos/me/pedidos → 200 {data[{id,numero_pedido,comprador{nome},itens[{produto_id,nome,quantidade}],valor_total,status_pedido}],meta}", r.status === 200 && mine && exact(mine, ["id", "numero_pedido", "comprador", "itens", "valor_total", "status_pedido"]) && exact(mine.comprador, ["nome"]) && exact(mine.itens[0], ["produto_id", "nome", "quantidade"]) && meta(r.json.meta));
    r = await call("PATCH", `/pedidos/${ped}/status`, { token: ana, body: { status_pedido: "preparando" } });
    check("artesão sem itens no pedido → 403", r.status === 403);
    r = await call("PATCH", `/pedidos/${ped}/status`, { token: maria, body: { status_pedido: "preparando" } });
    check("PATCH /pedidos/{id}/status pago → preparando → 200", r.status === 200 && r.json.data.status_pedido === "preparando");
    r = await call("PATCH", `/pedidos/${ped}/status`, { token: maria, body: { status_pedido: "enviado" } });
    check("enviado sem codigo_rastreio → 400", r.status === 400);
    r = await call("PATCH", `/pedidos/${ped}/status`, { token: maria, body: { status_pedido: "enviado", codigo_rastreio: "BR123456789" } });
    check("PATCH status enviado → 200 {id,status_pedido,codigo_rastreio}", r.status === 200 && exact(r.json.data, ["id", "status_pedido", "codigo_rastreio"]) && r.json.data.codigo_rastreio === "BR123456789");
    r = await call("GET", `/pedidos/${ped}`, { token: carla });
    check("detalhe reflete entrega enviada com rastreio", r.json.data.entrega.status === "enviado" && r.json.data.entrega.codigo_rastreio === "BR123456789");
    r = await call("PATCH", `/pedidos/${ped}/status`, { token: maria, body: { status_pedido: "voando" } });
    check("status inexistente → 400", r.status === 400);

    section("7. Avaliação");
    r = await call("POST", `/produtos/${ID.bowl}/avaliacoes`, { token: carla, body: { nota: 5, comentario: "Linda!" } });
    check("avaliar produto de pedido não entregue → 403", r.status === 403);
    await call("PATCH", `/pedidos/${ped}/status`, { token: maria, body: { status_pedido: "entregue" } });
    r = await call("POST", `/produtos/${ID.bowl}/avaliacoes`, { token: carla, body: { nota: 5, comentario: "Peça linda, superou expectativas!" } });
    check("POST /produtos/{id}/avaliacoes → 201 {id,produto_id,nota,comentario,data_avaliacao}", r.status === 201 && exact(r.json.data, ["id", "produto_id", "nota", "comentario", "data_avaliacao"]));
    r = await call("POST", `/produtos/${ID.bowl}/avaliacoes`, { token: carla, body: { nota: 4 } });
    check("avaliação duplicada → 409", r.status === 409);
    r = await call("POST", `/produtos/${ID.vaso}/avaliacoes`, { token: joao, body: { nota: 9 } });
    check("nota fora de 1–5 → 400", r.status === 400);
    r = await call("GET", `/produtos/${ID.vaso}/avaliacoes`);
    check("GET /produtos/{id}/avaliacoes → 200 {data[{id,comprador{nome},nota,comentario,data_avaliacao}],meta}", r.status === 200 && exact(r.json.data[0], ["id", "comprador", "nota", "comentario", "data_avaliacao"]) && exact(r.json.data[0].comprador, ["nome"]) && meta(r.json.meta));

    section("8. Administrador");
    r = await call("GET", "/admin/dashboard", { token: adm });
    check("GET /admin/dashboard → {total_vendas,total_pedidos,total_usuarios{compradores,artesaos},total_produtos_ativos}", r.status === 200 && exact(r.json.data, ["total_vendas", "total_pedidos", "total_usuarios", "total_produtos_ativos"]) && exact(r.json.data.total_usuarios, ["compradores", "artesaos"]));
    r = await call("GET", "/admin/dashboard", { token: joao });
    check("admin com token de consumidor → 403", r.status === 403);
    r = await call("GET", "/admin/indicadores/vendas?periodo=30d", { token: adm });
    check("GET /admin/indicadores/vendas → {gmv,total_pedidos_finalizados,ticket_medio}", r.status === 200 && exact(r.json.data, ["gmv", "total_pedidos_finalizados", "ticket_medio"]) && r.json.data.total_pedidos_finalizados >= 3);
    const hoje = new Date().toISOString().slice(0, 10);
    r = await call("GET", `/admin/indicadores/vendas?periodo=custom&data_inicio=2000-01-01&data_fim=${hoje}`, { token: adm });
    check("indicadores/vendas periodo=custom funciona", r.status === 200);
    r = await call("GET", "/admin/indicadores/vendas?periodo=custom", { token: adm });
    check("periodo=custom sem datas → 400", r.status === 400);
    r = await call("GET", "/admin/indicadores/vendas?periodo=1y", { token: adm });
    check("periodo inválido → 400", r.status === 400);
    r = await call("GET", "/admin/indicadores/produtos", { token: adm });
    check("GET /admin/indicadores/produtos → {mais_vendidos[{produto_id,nome,unidades_vendidas}],categorias_maior_conversao[{categoria,taxa_conversao}]}", r.status === 200 && exact(r.json.data, ["mais_vendidos", "categorias_maior_conversao"]) && exact(r.json.data.mais_vendidos[0], ["produto_id", "nome", "unidades_vendidas"]) && exact(r.json.data.categorias_maior_conversao[0], ["categoria", "taxa_conversao"]));
    r = await call("GET", "/admin/indicadores/artesaos", { token: adm });
    check("GET /admin/indicadores/artesaos → {total_artesaos,artesaos_ativos}", r.status === 200 && exact(r.json.data, ["total_artesaos", "artesaos_ativos"]));
    r = await call("GET", "/admin/indicadores/consumidores", { token: adm });
    check("GET /admin/indicadores/consumidores → {novos_cadastros_mes,taxa_recorrencia}", r.status === 200 && exact(r.json.data, ["novos_cadastros_mes", "taxa_recorrencia"]));
    r = await call("GET", "/admin/usuarios?tipo=artesao&q=maria", { token: adm });
    check("GET /admin/usuarios → {data[{id,nome,tipo_usuario,status}],meta} + filtros tipo/q", r.status === 200 && exact(r.json.data[0], ["id", "nome", "tipo_usuario", "status"]) && meta(r.json.meta) && r.json.data.length === 1);
    r = await call("GET", "/admin/usuarios?status=pendente", { token: adm });
    check("GET /admin/usuarios?status= filtra", r.json.data.length >= 2 && r.json.data.every(u => u.status === "pendente"));
    r = await call("GET", "/admin/usuarios?tipo=alien", { token: adm });
    check("tipo inválido → 400", r.status === 400);
    r = await call("PATCH", `/admin/usuarios/${lucia.id}/aprovar`, { token: adm });
    check("(extra) PATCH /admin/usuarios/{id}/aprovar → aprovado", r.status === 200 && r.json.data.status === "aprovado");
    r = await call("POST", "/produtos", { token: luciaTk, body: novoProd });
    check("artesã aprovada passa a poder criar produtos", r.status === 201);
    r = await call("PATCH", `/admin/usuarios/${lucia.id}/bloquear`, { token: adm, body: { motivo: "Conduta imprópria reportada por múltiplos compradores" } });
    check("PATCH /admin/usuarios/{id}/bloquear → 200 {id,status:bloqueado}", r.status === 200 && exact(r.json.data, ["id", "status"]) && r.json.data.status === "bloqueado");
    r = await call("PATCH", `/admin/usuarios/${lucia.id}/bloquear`, { token: adm, body: {} });
    check("bloquear sem motivo → 400", r.status === 400);
    r = await call("POST", "/auth/login", { body: { email: "lucia@exemplo.com", senha: "SenhaForte123" } });
    check("usuário bloqueado não consegue logar → 403", r.status === 403);
    r = await call("GET", "/artesaos/me", { token: luciaTk });
    check("token de usuário bloqueado deixa de valer → 403", r.status === 403);
    r = await call("PATCH", `/admin/usuarios/${lucia.id}/desbloquear`, { token: adm });
    check("(extra) desbloquear restaura status anterior", r.status === 200 && r.json.data.status === "aprovado");

    section("Infra");
    r = await call("GET", "/rota/que/nao/existe");
    check("rota inexistente → 404 com envelope de erro", r.status === 404 && r.json.erro.codigo === "rota_nao_encontrada");
    const raw = await fetch(base + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{quebrado" });
    check("JSON malformado → 400", raw.status === 400);
  } catch (e) { failed++; console.error("\nERRO NO TESTE:", e); }
  server.close();
  console.log(`\n${passed} passaram, ${failed} falharam`);
  process.exit(failed ? 1 : 0);
})();