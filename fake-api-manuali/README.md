# Fake API — Marketplace Origem

# Fake API — Marketplace Origem

Fake API em Node.js + Express que implementa os contratos do PDF **"REQ / RES de Cada Rota — Marketplace Origem"**.

```bash
npm install
npm start        # http://localhost:3001  (PORT=4000 npm start para mudar)
npm test         # 86 testes de contrato, um por rota do PDF
```

Requisitos: Node 18+.

## Convenções (iguais ao PDF)

- Sem prefixo `/api`: `POST /auth/login`, `GET /produtos`, ...
- Campos em `snake_case`, IDs em UUID, valores monetários em reais (`189.90`).
- Sucesso: `{ "data": ... }`. Listas: `{ "data": [...], "meta": { page, limit, total, total_pages } }`.
- Paginação: `?page=1&limit=20` (padrão 20, máximo 100).
- `204 No Content` em `DELETE`.
- Autenticação por `Authorization: Bearer <access_token>` (JWT HS256 real, expira em 3600 s).

### Formato de erro (o PDF não define; escolha desta fake API)

```json
{ "erro": { "codigo": "validacao", "mensagem": "Dados inválidos.", "detalhes": [{ "campo": "preco", "mensagem": "..." }] } }
```

| Status | Quando |
|---|---|
| 400 | validação de body/query |
| 401 | token ausente, inválido ou expirado; credenciais erradas |
| 403 | perfil sem permissão, usuário bloqueado, artesão não aprovado, avaliar sem ter recebido o produto |
| 404 | recurso inexistente |
| 409 | e-mail duplicado, estoque insuficiente, transição de status inválida, avaliação duplicada |

## Usuários de demonstração (senha de todos: `SenhaForte123`)

| Perfil | E-mail | Observação |
|---|---|---|
| Administrador | `admin@exemplo.com` | |
| Artesão aprovado | `maria@exemplo.com` | dona de 8 produtos (cerâmica e fibra) |
| Artesão aprovado | `ana@exemplo.com` | dona de 2 produtos (tecelagem) |
| Artesão **pendente** | `pedro@exemplo.com` | não consegue criar produtos até ser aprovado |
| Consumidor | `joao@exemplo.com` | tem pedido entregue e um aguardando pagamento |
| Consumidor | `carla@exemplo.com` | tem 2 pedidos entregues |

## Rotas e permissões

| Rota | Acesso |
|---|---|
| `POST /auth/registro/artesao`, `POST /auth/registro/consumidor`, `POST /auth/login`, `POST /auth/refresh-token` | público |
| `GET /artesaos/me`, `PUT /artesaos/me`, `GET /artesaos/me/pedidos` | artesão |
| `GET /artesaos/{id}`, `GET /artesaos/{id}/produtos` | público (só artesãos aprovados) |
| `GET /produtos`, `GET /produtos/{id}`, `GET /produtos/{id}/avaliacoes`, `GET /categorias` | público |
| `POST /produtos`, `PUT /produtos/{id}`, `DELETE /produtos/{id}`, `PATCH /produtos/{id}/disponibilidade` | artesão aprovado, só nos próprios produtos |
| `POST /categorias` | admin ou artesão |
| `GET /carrinho`, `POST /carrinho/itens`, `PUT/DELETE /carrinho/itens/{id}` | consumidor |
| `POST /pedidos` | consumidor |
| `GET /pedidos` | consumidor (os seus) ou admin (todos) |
| `GET /pedidos/{id}` | dono, artesão com item no pedido, ou admin |
| `PATCH /pedidos/{id}/status` | artesão, admin ou consumidor (ver regras abaixo) |
| `POST /produtos/{id}/avaliacoes` | consumidor |
| `GET /admin/*`, `PATCH /admin/usuarios/{id}/bloquear` | admin |

## Regras de negócio simuladas

- **Registro de artesão** cria o cadastro com `status: "pendente"`. Ele consegue logar, mas só cria produtos depois de aprovado.
- **CPF/CNPJ**: valida só a quantidade de dígitos (11 ou 14). O exemplo do PDF (`123.456.789-00`) não passa em dígito verificador, por isso não há checagem de dígito.
- **Disponibilidade**: `disponivel = status "ativo" && quantidade_estoque > 0`. `PATCH .../disponibilidade` com `0` torna o produto indisponível.
- **Carrinho**: um por consumidor. Adicionar o mesmo produto de novo soma a quantidade. Respeita o estoque (409).
- **Pedido** nasce do carrinho: valida endereço e `metodo_pagamento` (`pix`, `cartao_credito`, `cartao_debito`, `boleto`), baixa o estoque, esvazia o carrinho e fica `aguardando_pagamento`.
- **Status do pedido**: `aguardando_pagamento → pago → preparando → enviado → entregue`, e `cancelado`.
  - Artesão só segue o fluxo `pago → preparando → enviado → entregue`. `enviado` exige `codigo_rastreio`.
  - Consumidor só pode cancelar pedido `aguardando_pagamento`.
  - Admin pode definir qualquer status.
  - Cancelar devolve o estoque.
- **Visão do artesão**: em `GET /artesaos/me/pedidos` e `GET /pedidos/{id}`, ele vê só os itens dele e o `valor_total` desses itens. Pedidos `aguardando_pagamento` não aparecem na lista dele.
- **Avaliação**: só quem recebeu o produto (pedido `entregue`) avalia, uma vez por produto. Nota inteira de 1 a 5.
- **Indicadores (definições da fake API)**:
  - `gmv` = soma dos pedidos `entregue` no período; `ticket_medio` = `gmv / total_pedidos_finalizados`.
  - `dashboard.total_vendas` = soma dos pedidos pagos (pago ou além).
  - `taxa_conversao` da categoria = pedidos pagos com a categoria ÷ total de pedidos.
  - `taxa_recorrencia` = consumidores com 2+ pedidos pagos ÷ consumidores com 1+.
  - `artesaos_ativos` = artesãos com status `aprovado`.

## Rotas extras (não estão no PDF)

| Rota | Para quê |
|---|---|
| `GET /health` | health check |
| `POST /__reset` | restaura o seed (útil entre testes do front) |
| `POST /pedidos/{id}/pagamento/aprovar` | simula o gateway aprovando o pagamento (`aguardando_pagamento → pago`) |
| `PATCH /admin/usuarios/{id}/aprovar` | aprova artesão pendente |
| `PATCH /admin/usuarios/{id}/desbloquear` | desfaz o bloqueio |

Também aceitos além do PDF: `origem` no `PUT /artesaos/me`, `status` (`ativo`/`inativo`) em `POST/PUT /produtos`, filtro `?status=` em `/pedidos` e `/artesaos/me/pedidos`, `data_pedido` no `GET /pedidos/{id}`.

## Observações

- Dados em memória: reiniciar o servidor (ou `POST /__reset`) restaura o seed.
- `JWT_SECRET` pode ser definido por variável de ambiente.
- Produto inativo some das listagens públicas, mas continua acessível por `GET /produtos/{id}`.