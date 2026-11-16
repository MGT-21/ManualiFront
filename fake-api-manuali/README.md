# Fake API — Marketplace Origem

Fake API em Node.js + Express, baseada nos contratos dos PDFs `Endpoints da API` e `Requisições e Respostas`.

## Requisitos
- Node.js 18 ou superior
- npm

## Como executar
```bash
npm install
npm start
```
A API ficará disponível em `http://localhost:3001`.

## Teste rápido
- `GET http://localhost:3001/health`
- `GET http://localhost:3001/api/products`
- `GET http://localhost:3001/api/recomendacoes/destaque`

## Usuários de demonstração
| Tipo | Username | Senha |
|---|---|---|
| Comprador | `joao` | `Senha123` |
| Artesão | `maria` | `Senha123` |
| Administrador | `admin` | `Senha123` |

Login:
```http
POST /api/auth/login
Content-Type: application/json

{"username":"joao","password":"Senha123","tipo":"usuario"}
```

## Observações
- Os dados são mantidos em memória. Ao reiniciar o servidor, alterações feitas durante os testes são perdidas.
- IDs são numéricos.
- As rotas seguem o prefixo `/api`, exceto `/health`.
- Não há autenticação obrigatória nas rotas de negócio, conforme a documentação de referência.
- A fake API simula os fluxos principais e retorna JSON direto (sem envelope `data/meta`).
- O CPF de demonstração é apenas dado fictício para testes; substitua por um CPF válido se quiser testar validação mais rigorosa.

## Rotas incluídas
Auth, usuários, artesãos, administradores, produtos, carrinho, pedidos, avaliações, recomendações e métricas administrativas, conforme os PDFs enviados.
