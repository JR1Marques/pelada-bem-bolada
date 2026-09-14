# 📜 Diretrizes do Projeto: Pelada Bem Bolada

> **"Confirma, divide e joga"**

Este documento deve ser lido e seguido por qualquer desenvolvedor ou agente de IA que contribua para este projeto.

## A. Fluxo de Trabalho no GitHub (Obrigatório)
1. **Tudo vira Issue**: Qualquer Correção (Bug), Melhoria (Refactor/Chore) ou Nova Função (Feature) deve ter uma Issue aberta.
2. **Branches**: Crie branches a partir da \main\ com o formato: \	ipo/numero-issue-descricao\ (ex: \eature/12-tela-confirmacao\).
3. **Pull Requests (PRs)**: Todo código entra via PR. A descrição do PR **deve** mencionar a Issue (ex: "Resolve #12").
4. **Deploy**: Apenas via PR aprovado e mergeado na \main\.

## B. Design e Motion Principles
- Seguir os princípios de movimento (ref: github.com/kylezantos/design-principles).
- **Obrigatório**: 
  - Skeleton loading em todos os carregamentos
  - Lazy loading de imagens e componentes
  - Smooth animations (entrada/saída/transição)
  - Indicadores de progresso em ações assíncronas

## C. Esteira de Qualidade
- Nenhum código chega à \main\ sem passar pelo CI/CD
- Linting e formatação com **Biome**
- Commits padronizados com **Commitlint**
- Verificação de código morto com **Knip**
- Testes unitários e E2E

## D. Arquitetura
- Separação clara: Frontend (PWA) e Backend (Supabase)
- DRY com critério: sem abstrações prematuras
- Componentização desde o início
- Evitar overengineering

## E. Identidade Visual
- Logo/Brasão: \/brasao.png\
- Paleta: Azul escuro (#2C5282) e Amarelo/Dourado (#ECC94B)
- Tom: Jovem, descontraído e funcional
