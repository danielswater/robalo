📱 Comanda Digital — Documentação Completa
Especificação EXTREMAMENTE detalhada (MVP) — 1 barraca, 2 a 5 celulares, uso simples
Última atualização: 19/12/2025

📌 Resumo rápido

🧠 Glossário (palavras do app)

🎯 Escopo do MVP (o que o app tem)
• Cadastro e manutenção de produtos (com ativar/inativar).
• Criar comandas sem mesa fixa (apelido).
• Adicionar/editar/remover itens na comanda.
• Total automático da comanda.
• Troca de atendente com histórico.
• Fechamento de comanda com forma de pagamento (Pix/Cartão/Dinheiro).
• Relatório do dia e relatório por período (ontem/7 dias/mês/personalizado).
• Segurança mínima com PIN da barraca (simples).

🚫 Fora do escopo (por enquanto)
• Controle de estoque.
• Impressão de comandas ou integração com impressoras.
• Dividir conta por pessoa.
• Painel de cozinha / filas de preparo.
• Programa de fidelidade, cupons, taxas de serviço.
• Multi-barraca (várias lojas).

👥 Perfis de uso (papéis)
O app é simples e pode começar sem permissões complexas. Mesmo assim, é útil pensar em perfis:

🧱 Stack tecnológica (escolha recomendada)

✅  Motivo: é rápido de desenvolver, fácil de testar e funciona bem para poucos usuários.

🗂️ Modelo de dados (Firestore)
Estrutura sugerida (1 barraca):
shops/{shopId}
  products/{productId}
  orders/{orderId}
    items/{itemId}
📦 Coleção: products

🧾 Coleção: orders (comandas)

🧩 Subcoleção: items (itens da comanda)

⚠️ Por que salvar nameSnapshot e priceSnapshot? Porque o preço do produto pode mudar depois, e o histórico/relatório tem que continuar certo.

🎨 Layout e experiência (UI/UX)
Ideia: telas simples, botões grandes, pouca coisa por tela, e tudo com 1 ou 2 cliques.
📏 Padrões de layout
• Topo com título da tela + ações principais (ex: + Nova comanda).
• Lista com cards grandes (fácil de tocar).
• Botão primário sempre no final da tela (ex: Fechar comanda).
• Confirmação antes de ações perigosas (fechar, remover item).
• Feedback rápido: 'Salvo', 'Item removido', 'Comanda fechada'.
🧭 Navegação (fluxo de telas)
Login → Home → (Nova comanda → Comanda) → (Adicionar item) → (Fechar) → Relatórios / Produtos
🧷 Ícones sugeridos

🖥️ Telas do app (detalhamento completo)
🔐 Tela 1 — Login (seleção de atendente + PIN)
🎯 Objetivo: Entrar no app e guardar quem está usando o celular.
🧩 Componentes
• Seleção de atendente (lista local).
• Campo 'PIN da barraca' (numérico, escondido).
• Botão 'Entrar'.
• Link pequeno: 'Trocar atendente' (se já entrou antes).
• Cards: Total do período, Total por pagamento, Total por atendente.
• Escolher atendente e digitar o PIN e tocar em Entrar.
• Se já entrou antes, pode só confirmar/ajustar o atendente.
• Tocar em 'Aplicar' para atualizar o relatório.
• Atendente obrigatório (selecionar na lista).
• PIN obrigatório (ex: 4 dígitos).
• Data início <= data fim.
• Primeiro uso: mostrar explicação curta do PIN.
• Se offline: avisar que precisa internet para sincronizar dados.
🫙 Estados vazios
• PIN errado: 'PIN incorreto'.
• Sem internet: 'Sem conexão. Tente de novo'.
• Erro inesperado: 'Não foi possível entrar'.
⚠️ Erros e mensagens
• AsyncStorage: atendente salvo localmente (auto-login).
• Config da barraca: shopId fixo no app (MVP).

🏠 Tela 2 — Home (Comandas abertas)
🎯 Objetivo: Ser o painel principal do dia: criar comanda e ver o que está aberto.
🧩 Componentes
• Topo: título 'Comandas'.
• Botão grande: ➕ Nova comanda.
• Lista de cards: comandas abertas (nickname, total, atendente atual, tempo aberta).
• Acesso rápido: 🍔 Produtos, 📊 Relatórios.
• Cards: Total do período, Total por pagamento, Total por atendente.
• Abrir Nova comanda.
• Tocar em uma comanda para ver detalhes.
• Ir para Produtos ou Relatórios.
• Tocar em 'Aplicar' para atualizar o relatório.
• Nenhuma comanda aberta: mostrar botão Nova comanda bem grande.
• Data início <= data fim.
• 'Sem comandas abertas' + sugestão 'Crie uma nova comanda'.
• Se não tem produtos ativos: alerta 'Cadastre produtos antes de vender'.
🫙 Estados vazios
• Erro de carregamento: 'Não foi possível carregar as comandas' + botão Recarregar.
⚠️ Erros e mensagens
• Firestore: orders where status == 'open' (ordenado por openedAt desc).
• Exibir total (campo total).

➕ Tela 3 — Nova comanda
🎯 Objetivo: Criar uma comanda sem mesa fixa, com apelido e atendente inicial.
🧩 Componentes
• Campo 'Apelido' (opcional).
• Campo/seleção 'Atendente' (puxa do nome do login por padrão).
• Botão 'Criar comanda'.
• Cards: Total do período, Total por pagamento, Total por atendente.
• Digitar apelido (opcional).
• Confirmar atendente (padrão = seu nome).
• Criar comanda.
• Tocar em 'Aplicar' para atualizar o relatório.
• Atendente obrigatório (não pode ficar vazio).
• Apelido pode ser vazio; se vazio, sistema pode gerar 'Comanda 001' (opcional).
• Data início <= data fim.
• Se apelido vazio: mostrar 'Sem apelido' no card da Home (ou auto-gerar).
🫙 Estados vazios
• Erro ao criar: 'Não foi possível criar a comanda'.
⚠️ Erros e mensagens
• Firestore: criar order com status=open, openedAt=now, currentAttendant=..., attendantHistory=[{name,from, to:null}], total=0.

🧾 Tela 4 — Comanda (Detalhe)
🎯 Objetivo: Ver e editar a comanda: itens, total, atendente e fechamento.
🧩 Componentes
• Header: apelido + status.
• Linha: 👤 Atendente atual + botão 'Trocar atendente'.
• Lista de itens (nome, qty, preço, subtotal).
• Botão: 🧾 Adicionar item.
• Resumo fixo no final: Total.
• Botão primário: ✅ Fechar comanda.
• Cards: Total do período, Total por pagamento, Total por atendente.
• Adicionar item.
• Editar quantidade do item (tocar no item).
• Remover item.
• Trocar atendente.
• Fechar comanda.
• Tocar em 'Aplicar' para atualizar o relatório.
• Não permitir fechar comanda sem itens (opcional, mas recomendado).
• Ao remover item: pedir confirmação rápida.
• Data início <= data fim.
• Sem itens: mostrar mensagem 'Sem itens. Toque em Adicionar item'.
• Total = 0,00.
🫙 Estados vazios
• Erro ao salvar item: 'Não foi possível salvar o item'.
• Conflito: 'Atualizando... tente de novo' (se duas pessoas editarem ao mesmo tempo).
⚠️ Erros e mensagens
• Firestore: orders/{orderId} + items subcollection.
• Total: pode ser recalculado a cada mudança (no app) e salvo no order.total.

🧾 Tela 5 — Adicionar item
🎯 Objetivo: Adicionar rapidamente vários produtos na comanda, de forma contínua, sem interrupções.
🧩 Componentes
• Busca (opcional).
• Lista de produtos ativos (nome + preço + tipo) com controle de quantidade (+/−).
• Quantidade inicial de todos os produtos = 0.
• Botão grande fixo no final: 'Adicionar itens à comanda'.
• Cards: Total do período, Total por pagamento, Total por atendente.
• Buscar produto.
• Ajustar quantidade/peso de vários produtos.
• Tocar em 'Adicionar itens à comanda' para confirmar tudo de uma vez.
• O app volta para a comanda.
• Tocar em 'Aplicar' para atualizar o relatório.
• Somente produtos com quantidade > 0 são adicionados.
• Para 'kg': permitir decimal (ex: 0,250).
• Salvar item com nameSnapshot e priceSnapshot.
• Data início <= data fim.
• Se não há produtos ativos: mostrar 'Nenhum produto. Vá em Produtos e cadastre'.
🫙 Estados vazios
• Sem itens selecionados: botão desabilitado.
⚠️ Erros e mensagens
• Firestore: criar item com productId, nameSnapshot, priceSnapshot, qty.
• Recalcular total da comanda (somar items).
👤 Tela 6 — Trocar atendente (Modal ou tela)
🎯 Objetivo: Trocar o responsável atual e registrar no histórico.
🧩 Componentes
• Lista de atendentes recentes (opcional).
• Campo/seleção de atendente (lista local).
• Botão 'Confirmar troca'.
• Cards: Total do período, Total por pagamento, Total por atendente.
• Escolher/digitar nome do novo atendente.
• Confirmar troca.
• Tocar em 'Aplicar' para atualizar o relatório.
• Nome obrigatório.
• Ao trocar: fechar o último registro do histórico (to = now) e abrir um novo (from = now).
• Data início <= data fim.
• Se não tem lista: permitir digitar direto.
🫙 Estados vazios
• Erro: 'Não foi possível trocar atendente'.
⚠️ Erros e mensagens
• Firestore: atualizar order.currentAttendant e attendantHistory (append).

✅ Tela 7 — Fechar comanda (Pagamento)
🎯 Objetivo: Finalizar comanda, marcar pagamento e jogar para relatórios.
🧩 Componentes
• Resumo: total final.
• Escolha: ⚡ Pix / 💳 Cartão / 💵 Dinheiro.
• Botão 'Confirmar fechamento'.
• Cards: Total do período, Total por pagamento, Total por atendente.
• Selecionar forma de pagamento.
• Confirmar fechamento.
• Tocar em 'Aplicar' para atualizar o relatório.
• Forma de pagamento obrigatória.
• Ao fechar: status=closed, closedAt=now, closedDate=YYYY-MM-DD, paymentMethod=..., total final.
• Data início <= data fim.
• Se não selecionar pagamento: bloquear botão e avisar.
🫙 Estados vazios
• Erro ao fechar: 'Não foi possível fechar a comanda'.
• Se a comanda já foi fechada em outro celular: 'Comanda já fechada'.
⚠️ Erros e mensagens
• Firestore: update order + opcional: travar itens (não editar depois).

🍔 Tela 8 — Produtos
🎯 Objetivo: Cadastrar e manter o cardápio.
🧩 Componentes
• Lista de produtos (ativos e inativos com marca).
• Botão 'Novo produto'.
• Ações por produto: editar, ativar/inativar.
• Cards: Total do período, Total por pagamento, Total por atendente.
• Criar produto.
• Editar produto.
• Ativar/inativar.
• Tocar em 'Aplicar' para atualizar o relatório.
• Nome obrigatório.
• Preço obrigatório >= 0.
• Tipo obrigatório.
• Data início <= data fim.
• Sem produtos: mostrar 'Cadastre um produto para começar'.
🫙 Estados vazios
• Erro ao salvar produto: 'Não foi possível salvar'.
⚠️ Erros e mensagens
• Firestore: products collection; filtrar active==true para venda.

📊 Tela 9 — Relatórios (Hoje e Período)

📌 Regra oficial do relatório por atendente (MVP)

• Cada venda é atribuída ao atendente que FECHOU a comanda.
• Não importa quem abriu a comanda ou adicionou itens.
• Essa regra é fixa no MVP e deve ser usada em todos os relatórios por atendente.

🎯 Objetivo: Ver quanto vendeu e acompanhar a barraca por data e por atendente.
🧩 Componentes
• Aba 'Hoje' e aba 'Período'.
• Filtro por período personalizado (data início e data fim).
• Campos de data com máscara DD/MM/AAAA.
• Botão 'Aplicar'.
• Campos de data com máscara DD/MM/AAAA.
• Lista de comandas fechadas no período.

⚙️ Ações do usuário
• Lista de comandas fechadas no período.
• Informar data início e data fim.
• Tocar em 'Aplicar' para atualizar o relatório.
• Abrir detalhe de comanda fechada (somente leitura).

✅ Validações
• Abrir detalhe de comanda fechada (somente leitura).
• Campos de data obrigatórios no modo Período.
• Data início <= data fim.
• Campos de data obrigatórios no modo Período.
🫙 Estados vazios
• Data inválida: 'Use o formato DD/MM/AAAA'.
• Data início maior que data fim.
• Erro de consulta: 'Não foi possível carregar o relatório'.

🗃️ Dados usados
• Filtrar comandas fechadas por data início e data fim.
• Data início maior que data fim.
🔁 Fluxos completos (do começo ao fim)
Fluxo 1 — Primeiro uso (configurar e entrar)
📍 Passos:
1. Abrir o app.
2. Escolher o atendente (ex: 'Ana').
3. Digitar o PIN da barraca.
4. Tocar em 'Entrar'.
5. O app salva seu nome no celular e abre a Home.
🧠 Regras importantes:
• PIN errado impede entrada.
• Sem internet: mostrar aviso e tentar novamente.

Fluxo 2 — Abrir uma comanda
📍 Passos:
1. Na Home, tocar em ➕ Nova comanda.
2. Opcional: digitar apelido (ex: 'Boné azul').
3. Conferir atendente (padrão = seu nome).
4. Tocar em 'Criar comanda'.
5. A comanda aparece na Home como ABERTA.
🧠 Regras importantes:
• Ao criar, o histórico de atendente começa com (from=agora, to=vazio).

Fluxo 3 — Adicionar itens (venda)
📍 Passos:
1. Abrir a comanda (Detalhe).
2. Tocar em 🧾 Adicionar item.
3. Ajustar quantidades dos produtos usando + e −.
4. Tocar em 🧾 Adicionar itens à comanda.
5. Confirmar para adicionar tudo de uma vez e voltar para a comanda.
6. Se precisar, abrir de novo e adicionar mais itens.
🧠 Regras importantes:
• Cada item guarda o preço do momento (priceSnapshot).
• O total da comanda deve ser recalculado sempre que itens mudam.

Fluxo 4 — Trocar atendente no meio do atendimento
📍 Passos:
1. Abrir a comanda (Detalhe).
2. Tocar em 👤 Trocar atendente.
3. Selecionar ou digitar o novo atendente.
4. Confirmar troca.
5. O app atualiza o atendente atual e registra no histórico.
🧠 Regras importantes:
• Ao trocar: o último histórico recebe to=agora.
• Depois cria um novo registro com from=agora e to=vazio.

Fluxo 5 — Fechar comanda e registrar pagamento
📍 Passos:
1. Na comanda (Detalhe), tocar em ✅ Fechar comanda.
2. Escolher Pix/Cartão/Dinheiro.
3. Confirmar fechamento.
4. A comanda vira FECHADA e some da lista de abertas.
🧠 Regras importantes:
• Salvar closedAt e closedDate.
• Após fechar, itens devem ficar somente leitura (recomendado).

Fluxo 6 — Ver vendas do dia
📍 Passos:
1. Ir em 📊 Relatórios.
2. Aba 'Hoje'.
3. Ver total do dia, por pagamento, por atendente e lista de comandas.

Fluxo 7 — Ver vendas por período (semana passada)
📍 Passos:
1. Ir em 📊 Relatórios.
2. Aba 'Período'.
3. Escolher 'Últimos 7 dias' ou datas personalizadas.
4. Ver total do período, por pagamento, por atendente e lista de comandas.
🧠 Regras importantes:
• Consulta usa closedAt entre datas.
• Somatórios podem ser feitos no app (volume pequeno).

🧨 Casos especiais (edge cases) e decisões
• Comanda que já teve item: nunca pode ser excluída; só pode ser fechada.
• Cancelar comanda vazia: remove da lista de abertas e não entra em relatórios.
• Comanda vazia (aberta e sem itens) pode ser cancelada/excluída.
• Motivo: evitar venda com total R$ 0,00 e sujeira em relatórios.
• Comanda vazia (sem itens): não pode fechar.

🔒 Segurança e regras (simples, sem dor)
Meta: ninguém de fora mexer. Como é uma barraca só, dá para ter uma barreira simples (PIN) e regras no Firestore.
✅ Regras mínimas recomendadas
• O app só acessa dados do shopId fixo (uma barraca).
• Somente usuários autenticados (mesmo anônimo) podem ler/escrever.
• Somente produtos e comandas desse shopId podem ser acessados.
• Não permitir apagar documentos (apenas inativar produtos; comandas fechadas ficam como histórico).
🔐 PIN da barraca (como usar)
O PIN é uma trava simples no app (na tela de login). Ele não é perfeito como segurança de banco, mas ajuda muito a evitar acesso por acidente.
Se quiser segurança mais forte depois, dá para criar usuários de verdade com email/senha, mas isso já aumenta trabalho.
✅ Checklist de implementação (para você ou para IA)
☑️ Criar projeto Expo + TypeScript + React Navigation (Tabs + Stack).
☑️ Criar telas: Login, Home, Nova Comanda, Comanda, Adicionar Item, Produtos, Relatórios.
☑️ Configurar Firebase no app.
☑️ Modelar coleções: products, orders, items.
☑️ Implementar fluxo de comanda (criar/editar/fechar).
☑️ Implementar troca de atendente com histórico.
☑️ Implementar relatórios (hoje e período).
☑️ Adicionar validações e mensagens de erro.
☑️ Testar em 2 celulares ao mesmo tempo.
☑️ Gerar APK para instalar nos celulares da barraca.