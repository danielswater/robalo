# ✅ Comanda Digital — Status (o que já foi feito)

Data: 2025-12-18

## ✅ Feito

### Projeto / Infra
- [x] Projeto Expo (TypeScript) criado e rodando
- [x] Repositório GitHub (`robalo`) configurado e primeiro commit enviado
- [x] Estrutura de pastas criada:
  - [x] `src/components`
  - [x] `src/models`
  - [x] `src/screens`
  - [x] `src/services`
  - [x] `src/routes`

### Firebase / Firestore
- [x] Projeto criado no Firebase Console
- [x] Firestore habilitado (modo teste)
- [x] Arquivo `src/firebase.ts` criado com `initializeApp(firebaseConfig)`
- [x] Conexão testada (escreveu documento na coleção `testes`)

### Modelos (tipos)
- [x] Arquivo `src/models/firestoreModels.ts` criado com:
  - [x] `Product`
  - [x] `Order`
  - [x] `OrderItem`
  - [x] `AttendantHistoryItem`
  - [x] `OrderStatus`
  - [x] `PaymentMethod`
  - [x] `UnitType`
- Modelos já preparados para integração futura com Firestore (MVP local ainda em uso)

### Navegação / UI (base)
- [x] `expo-router` removido (e pasta `app/` removida)
- [x] Navegação por abas funcionando com React Navigation:
  - [x] Tab **Comandas**
  - [x] Tab **Produtos**
  - [x] Tab **Relatórios**
- [x] Correção de tipagem no `tabBarIcon`
- [x] `react-native-reanimated` removido/desativado para evitar erro de plugin
- Navegação híbrida **Tabs + Stack** implementada corretamente (fluxo de Comanda fora das Tabs)

### Login / Sessão do atendente (MVP)
- [x] Tela de Login com nome + PIN implementada
- [x] Validação de PIN simples no app (MVP)
- [x] Sessão do atendente salva no `AsyncStorage`
- [x] Auto-login ao reabrir o app
- [x] Header das abas exibe nome do atendente logado
- [x] Ação “Trocar atendente” no header (logoff local e retorno ao Login)
- Bloqueio de acesso às abas sem login válido
- Limpeza correta da sessão ao trocar atendente

### Comandas (MVP local — sem Firestore)
- [x] Tela **Comandas Abertas** funcional (não placeholder)
- [x] Estado vazio quando não há comandas
- [x] Busca por apelido (filtro local)
- [x] Botão “Nova comanda”
- [x] Modal para criar comanda
- [x] Função `createComanda` centralizada no `ComandaContext`
- [x] Criação de comanda com ou sem apelido
- [x] Seed inicial de comanda OPEN (MVP)
- [x] Navegação para **Detalhe da Comanda**
- [x] Tela **Detalhe da Comanda** completa
- [x] Adicionar itens à comanda
- [x] Editar item da comanda
- [x] Remover item da comanda
- [x] Total recalculado automaticamente
- [x] Fechar comanda com forma de pagamento
- [x] Bloquear fechamento sem itens
- [x] Travar edição após comanda fechada
- [x] Cancelar/excluir comanda aberta sem itens
- [x] Safe Area corrigida (top e bottom)
- Tela **Adicionar Item** com fluxo de carrinho (quantidade por produto + confirmação única)
- Botão de ação principal sempre visível (não fica atrás da navegação do sistema)

### Troca de atendente (Comanda)
- [x] Trocar atendente dentro da comanda
- [x] Atualizar `currentAttendant`
- [x] Registrar histórico completo (`from` / `to`)
- Bloqueio de troca de atendente em comanda já fechada

### Produtos (MVP local)
- [x] Listar produtos
- [x] Criar produto (modal)
- [x] Editar produto (modal reutilizado)
- [x] Ativar / Inativar produto
- [x] Máscara de preço (R$ 0,00)

### Relatórios (MVP local)
- [x] Relatório do dia
- [x] Relatório por período (data início / fim)
- [x] Validação de datas (PT-BR)
- [x] Total por forma de pagamento
- Listagem de comandas fechadas no período
- Ordenação por data de fechamento

---

## 🧾 Observações importantes
- O MVP está **100% funcional em modo local**
- Nenhuma funcionalidade foi marcada como feita sem estar realmente implementada
- Firestore ainda **não foi integrado ao fluxo real**
- Próximo passo seguro: **serviços Firestore (`src/services/`)**
