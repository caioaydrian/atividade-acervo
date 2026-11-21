# Acervo em TypeScript

Aplicação de console para praticar conceitos de Orientação a Objetos. O acervo inicial contém um livro e um jogo eletrônico.

## Requisitos

- Node.js e npm

## Executar

```bash
npm install
npm run build
npm start
```

O comando `npm run build` compila `src/ativ.ts` para a pasta `dist/`. O menu permite listar itens, emprestar e devolver itens, reservar livros e calcular multas por atraso.

## Conceitos demonstrados

- Classes, construtores com parameter properties e arrays de objetos
- Encapsulamento, identificadores `readonly` e validações de negócio
- Acessor calculado para disponibilidade e contador de IDs estático
- Classe abstrata, herança e sobrescrita das regras de multa
- Interface `Reservavel`, implementada por `Livro`
- Repositório genérico com `Partial` e `Pick`
- Exceções de domínio e validação de operações
