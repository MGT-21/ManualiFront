export const db = {
  usuarios: [
    { id: 1, username: "joao", password: "Senha123", email: "joao@exemplo.com", cep: "50000-000", papel: "comprador" },
    { id: 2, username: "maria", password: "Senha123", email: "maria@exemplo.com", cep: "50000-000", papel: "artesao", cpf: "12345678901", bio: "Artesã de cerâmica", experiencia: "5 anos", telefone: "81999990000" },
    { id: 3, username: "admin", password: "Senha123", email: "admin@exemplo.com", papel: "adm" }
  ],
  produtos: [
    { id: 1, nome: "Vaso azul", descricao: "Vaso artesanal em cerâmica", preco: 189.9, estoque: 5, ativo: true, categoria: "Cerâmica", tags: ["vaso","azul","decoracao"], fotos: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600"], historia: "Inspirado no litoral", artesaoId: 2, mediaAvaliacoes: 4.7, totalAvaliacoes: 12 },
    { id: 2, nome: "Vaso verde", descricao: "Vaso de cerâmica esmaltada", preco: 159.9, estoque: 3, ativo: true, categoria: "Cerâmica", tags: ["vaso","verde"], fotos: ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600"], historia: "", artesaoId: 2, mediaAvaliacoes: 4.8, totalAvaliacoes: 8 },
    { id: 3, nome: "Jarro marajoara", descricao: "Jarro inspirado na arte marajoara", preco: 210, estoque: 6, ativo: true, categoria: "Cerâmica", tags: ["jarro","marajoara"], fotos: ["https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600"], historia: "", artesaoId: 2, mediaAvaliacoes: 4.6, totalAvaliacoes: 8 },
    { id: 4, nome: "Bolsa de palha", descricao: "Bolsa feita à mão", preco: 89.9, estoque: 10, ativo: true, categoria: "Acessórios", tags: ["bolsa","palha"], fotos: ["https://images.unsplash.com/photo-1590876289329-4a136a7a6e5e?w=600"], historia: "", artesaoId: 2, mediaAvaliacoes: 4.9, totalAvaliacoes: 20 },
    { id: 5, nome: "Colar artesanal", descricao: "Colar com peças naturais", preco: 65, estoque: 15, ativo: true, categoria: "Acessórios", tags: ["colar","artesanal"], fotos: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"], historia: "", artesaoId: 2, mediaAvaliacoes: 4.4, totalAvaliacoes: 6 },
    { id: 6, nome: "Prato decorativo", descricao: "Prato decorativo pintado à mão", preco: 120, estoque: 4, ativo: true, categoria: "Cerâmica", tags: ["prato","decoracao"], fotos: ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600"], historia: "", artesaoId: 2, mediaAvaliacoes: 4.5, totalAvaliacoes: 10 },
    { id: 7, nome: "Cesto de fibra", descricao: "Cesto artesanal de fibras naturais", preco: 75, estoque: 8, ativo: true, categoria: "Decoração", tags: ["cesto","fibra"], fotos: ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600"], historia: "", artesaoId: 2, mediaAvaliacoes: 4.2, totalAvaliacoes: 5 },
    { id: 8, nome: "Escultura de madeira", descricao: "Pequena escultura feita à mão", preco: 240, estoque: 2, ativo: true, categoria: "Decoração", tags: ["madeira","escultura"], fotos: ["https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600"], historia: "", artesaoId: 2, mediaAvaliacoes: 4.9, totalAvaliacoes: 3 },
    { id: 9, nome: "Caneca rústica", descricao: "Caneca de cerâmica", preco: 49.9, estoque: 0, ativo: true, categoria: "Cerâmica", tags: ["caneca"], fotos: [], historia: "", artesaoId: 2, mediaAvaliacoes: 4.3, totalAvaliacoes: 7 },
    { id: 10, nome: "Bowl terracota", descricao: "Bowl artesanal", preco: 99.9, estoque: 7, ativo: false, categoria: "Cerâmica", tags: ["bowl"], fotos: [], historia: "", artesaoId: 2, mediaAvaliacoes: 4.1, totalAvaliacoes: 2 }
  ],
  carrinhos: {},
  pedidos: [],
  avaliacoes: [],
  eventosRecomendacao: [],
  refreshTokens: new Set()
};
