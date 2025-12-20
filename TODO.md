# ✅ COMANDA DIGITAL — TODO ATUALIZADO

Data: 2025-12-18

---

## ✅ Já concluído

### Projeto / Infra
- [x] Criado projeto Expo com TypeScript
- [x] Projeto rodando localmente (Android)
- [x] Repositório GitHub (`robalo`) criado e sincronizado
- [x] Estrutura de pastas criada:
  - [x] `src/components`
  - [x] `src/models`
  - [x] `src/screens`
  - [x] `src/services`
  - [x] `src/routes`

### Firebase / Firestore
- [x] Projeto criado no Firebase Console
- [x] Habilitar Firestore (modo teste)

### Navegação / Base UI
- [x] Navegação por abas (Comandas / Produtos / Relatórios)
- [x] Header com nome do atendente
- [x] Ação de trocar atendente (logoff local)

---

## ⏳ Em andamento / pendente (estado real)

### Comandas (MVP local — sem Firestore)
- [x] Tela de Comandas Abertas (real, não placeholder)
- [x] Estado vazio quando não há comandas
- [x] Busca por apelido (filtro local)
- [x] Botão “Nova comanda”
- [x] Modal para criar comanda (UI)

- [x] Integração REAL do botão **Criar** com a criação de comanda
- [x] Função única e consistente para criar comanda (contexto)
- [x] Garantir que criar comanda sem apelido funcione
- [x] Garantir que criar comanda com apelido funcione
- [ ] Evitar depender apenas de seed/mock para criação
- [ ] Remover `seedIfEmpty` após integração com Firestore

- [x] Navegação para Detalhe da Comanda
- [x] Correção de layout da tela **Detalhe da Comanda** (Safe Area top e bottom)
- [x] Botão **Fechar comanda** sempre visível (não atrás da navegação do sistema)

- [x] Editar item da comanda
- [x] Remover item da comanda
- [x] Recalcular total automaticamente
- [x] Fechar comanda com forma de pagamento
- [x] Bloquear fechamento sem itens
- [x] Travar edição após comanda fechada

- [x] Cancelar/excluir comanda aberta sem itens (comanda vazia)
- [x] Tela **Adicionar item** com fluxo de carrinho (quantidade por produto + botão final)

---

## 🔜 Próximos passos (após estabilizar Comandas)

### Produtos
- [x] Listar produtos
- [x] Criar produto
- [x] Editar produto
- [x] Ativar / Inativar produto

### Relatórios
- [x] Relatório do dia
- [x] Relatório por período (datas início/fim)
- [x] Total por forma de pagamento
- [x] Listar comandas fechadas no período
- [ ] Definir regra final de relatório por atendente (MVP: quem FECHOU)

---

## 🧾 Observações importantes
- O fluxo de **criação de comanda estava inconsistente** e já foi corrigido
- O MVP local está estável e funcional
- Firestore ainda não foi integrado ao fluxo real
- Próximo passo seguro: **criar serviços Firestore em `src/services/`**


### Atendente (comanda)

- [x] Trocar atendente dentro da comanda (atualizar `currentAttendant`)
- [x] Registrar histórico de atendentes na comanda (`from` / `to`)
- [ ] Definir regra de relatório por atendente (MVP: conta para quem FECHOU)
