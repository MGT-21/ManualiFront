# Marketplace Origem — Fake API

API fake em Express para testar o frontend conforme o contrato `/api/v1`.

## Instalação
```bash
npm install
npm run dev
```
Servidor: `http://localhost:3000`
Base: `http://localhost:3000/api/v1`

## Login de teste
- Comprador: `joao` / `Senha123` (tipo omitido ou `usuario`)
- Artesão: `maria` / `Senha123` (`tipo: "artesao"`)
- Administrador: `admin` / `Senha123` (`tipo: "adm"`)

O login retorna um token fake. Envie `Authorization: Bearer <accessToken>` nas rotas protegidas.

## Exemplos
```http
GET /api/v1/produtos?pagina=1&tamanho=8&ordenar=preco:asc
GET /api/v1/recomendacoes/destaque?limite=8
GET /api/v1/produtos/1/recomendacoes?limite=4
POST /api/v1/auth/login
Content-Type: application/json

{"username":"joao","password":"Senha123"}
```

## Carrinho
Use token do comprador:
```json
POST /api/v1/carrinho/itens
{"produtoId":1,"quantidade":2}
```
Para adicionar ao carrinho, atualizar quantidade, remover itens, esvaziar, criar pedidos e avaliar, as regras básicas de negócio estão simuladas.

## Limitações
- Dados ficam em memória e reiniciar o servidor restaura o seed.
- Tokens são fake, sem JWT/segurança real.
- Recomendações são heurísticas (categoria, avaliações e popularidade), não IA.
- Alguns endpoints administrativos/recursos do contrato podem estar simplificados.
