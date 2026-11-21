import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

export interface Reservavel {
  reservar(nomePessoa: string): void;
  cancelarReserva(nomePessoa: string): void;
}

export class ErroDominio extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ItemNaoEncontradoError extends ErroDominio {}

export class OperacaoInvalidaError extends ErroDominio {}

class EntradaEncerradaError extends Error {}

export abstract class ItemAcervo {
  private static _contadorId = 0;
  private readonly _id: number;
  private _emprestadoPara: string | null = null;
  private _reservadoPara: string | null = null;

  constructor(
    private readonly _titulo: string,
    private readonly _ano: number,
  ) {
    if (_titulo.trim().length === 0) {
      throw new OperacaoInvalidaError("O título não pode ficar vazio.");
    }
    if (!Number.isInteger(_ano) || _ano < 0) {
      throw new OperacaoInvalidaError("O ano deve ser um número inteiro válido.");
    }

    this._id = ++ItemAcervo._contadorId;
  }

  get id(): number {
    return this._id;
  }

  get titulo(): string {
    return this._titulo;
  }

  get ano(): number {
    return this._ano;
  }

  get statusDisponibilidade(): string {
    if (this._emprestadoPara !== null) {
      return `Emprestado para ${this._emprestadoPara}`;
    }
    if (this._reservadoPara !== null) {
      return `Reservado para ${this._reservadoPara}`;
    }
    return "Disponível";
  }

  abstract calcularMulta(diasAtraso: number): number;

  emprestar(nomePessoa: string): void {
    const pessoa = this.validarNome(nomePessoa);
    if (this._emprestadoPara !== null) {
      throw new OperacaoInvalidaError("Este item já está emprestado.");
    }
    if (this._reservadoPara !== null && this._reservadoPara !== pessoa) {
      throw new OperacaoInvalidaError(
        `Este item está reservado para ${this._reservadoPara}.`,
      );
    }

    this._reservadoPara = null;
    this._emprestadoPara = pessoa;
  }

  devolver(): void {
    if (this._emprestadoPara === null) {
      throw new OperacaoInvalidaError("Este item não está emprestado.");
    }
    this._emprestadoPara = null;
  }

  protected validarDiasAtraso(diasAtraso: number): void {
    if (!Number.isInteger(diasAtraso) || diasAtraso < 0) {
      throw new OperacaoInvalidaError(
        "Os dias de atraso devem ser um inteiro igual ou maior que zero.",
      );
    }
  }

  protected reservarPara(nomePessoa: string): void {
    const pessoa = this.validarNome(nomePessoa);
    if (this._emprestadoPara !== null) {
      throw new OperacaoInvalidaError(
        "Não é possível reservar um item que está emprestado.",
      );
    }
    if (this._reservadoPara !== null) {
      throw new OperacaoInvalidaError(
        `Este item já está reservado para ${this._reservadoPara}.`,
      );
    }
    this._reservadoPara = pessoa;
  }

  protected removerReserva(nomePessoa: string): void {
    const pessoa = this.validarNome(nomePessoa);
    if (this._reservadoPara === null) {
      throw new OperacaoInvalidaError("Este item não possui uma reserva.");
    }
    if (this._reservadoPara !== pessoa) {
      throw new OperacaoInvalidaError(
        "Somente a pessoa que fez a reserva pode cancelá-la.",
      );
    }
    this._reservadoPara = null;
  }

  private validarNome(nomePessoa: string): string {
    const nome = nomePessoa.trim();
    if (nome.length === 0) {
      throw new OperacaoInvalidaError("Informe o nome da pessoa.");
    }
    return nome;
  }
}

export class Livro extends ItemAcervo implements Reservavel {
  constructor(
    titulo: string,
    ano: number,
    private readonly _autor: string,
  ) {
    super(titulo, ano);
    if (_autor.trim().length === 0) {
      throw new OperacaoInvalidaError("O nome do autor não pode ficar vazio.");
    }
  }

  get autor(): string {
    return this._autor;
  }

  override calcularMulta(diasAtraso: number): number {
    this.validarDiasAtraso(diasAtraso);
    return diasAtraso * 1;
  }

  reservar(nomePessoa: string): void {
    this.reservarPara(nomePessoa);
  }

  cancelarReserva(nomePessoa: string): void {
    this.removerReserva(nomePessoa);
  }
}

export class JogoEletronico extends ItemAcervo {
  constructor(
    titulo: string,
    ano: number,
    private readonly _plataforma: string,
  ) {
    super(titulo, ano);
    if (_plataforma.trim().length === 0) {
      throw new OperacaoInvalidaError("A plataforma não pode ficar vazia.");
    }
  }

  get plataforma(): string {
    return this._plataforma;
  }

  override calcularMulta(diasAtraso: number): number {
    this.validarDiasAtraso(diasAtraso);
    return diasAtraso * 3;
  }
}

export type FiltroAcervo = Partial<
  Pick<ItemAcervo, "titulo" | "statusDisponibilidade">
>;

export class RepositorioMemoria<T extends ItemAcervo> {
  private readonly itens: T[] = [];

  adicionar(item: T): void {
    if (this.itens.some((existente) => existente.id === item.id)) {
      throw new OperacaoInvalidaError(
        `Já existe um item com o ID ${item.id}.`,
      );
    }
    this.itens.push(item);
  }

  buscarPorId(id: number): T {
    const item = this.itens.find((candidato) => candidato.id === id);
    if (item === undefined) {
      throw new ItemNaoEncontradoError(`Não foi encontrado item com ID ${id}.`);
    }
    return item;
  }

  listar(filtro: FiltroAcervo = {}): T[] {
    return this.itens.filter((item) => {
      const tituloCorresponde =
        filtro.titulo === undefined ||
        item.titulo.toLocaleLowerCase().includes(filtro.titulo.toLocaleLowerCase());
      const statusCorresponde =
        filtro.statusDisponibilidade === undefined ||
        item.statusDisponibilidade === filtro.statusDisponibilidade;
      return tituloCorresponde && statusCorresponde;
    });
  }
}

const repositorio = new RepositorioMemoria<ItemAcervo>();
repositorio.adicionar(new Livro("O Hobbit", 1937, "J. R. R. Tolkien"));
repositorio.adicionar(new JogoEletronico("Stardew Valley", 2016, "PC"));

const consoleApp = createInterface({ input: stdin, crlfDelay: Infinity });
const linhas = consoleApp[Symbol.asyncIterator]();

async function perguntar(mensagem: string): Promise<string> {
  stdout.write(mensagem);
  const resposta = await linhas.next();
  if (resposta.done) {
    throw new EntradaEncerradaError();
  }
  return resposta.value;
}

function exibirAcervo(): void {
  const itens = repositorio.listar();
  if (itens.length === 0) {
    console.log("O acervo está vazio.");
    return;
  }

  for (const item of itens) {
    const detalhe =
      item instanceof Livro
        ? `Autor: ${item.autor}`
        : item instanceof JogoEletronico
          ? `Plataforma: ${item.plataforma}`
          : "";
    console.log(
      `#${item.id} | ${item.titulo} (${item.ano}) | ${item.constructor.name} | ${item.statusDisponibilidade}${detalhe.length > 0 ? ` | ${detalhe}` : ""}`,
    );
  }
}

async function lerId(): Promise<number> {
  const resposta = await perguntar("ID do item: ");
  const id = Number(resposta);
  if (!Number.isInteger(id) || id < 1) {
    throw new OperacaoInvalidaError("Informe um ID inteiro positivo.");
  }
  return id;
}

async function executarMenu(): Promise<void> {
  let executando = true;

  while (executando) {
    console.log(
      "\n=== Acervo ===\n1. Listar itens\n2. Emprestar item\n3. Devolver item\n4. Reservar livro\n5. Calcular multa\n0. Sair",
    );

    try {
      const opcao = (await perguntar("Escolha uma opção: ")).trim();
      switch (opcao) {
        case "1":
          exibirAcervo();
          break;
        case "2": {
          const item = repositorio.buscarPorId(await lerId());
          const nome = await perguntar("Nome de quem vai retirar: ");
          item.emprestar(nome);
          console.log(`Empréstimo registrado para ${nome.trim()}.`);
          break;
        }
        case "3": {
          const item = repositorio.buscarPorId(await lerId());
          item.devolver();
          console.log("Devolução registrada.");
          break;
        }
        case "4": {
          const item = repositorio.buscarPorId(await lerId());
          if (!(item instanceof Livro)) {
            throw new OperacaoInvalidaError(
              "A reserva está disponível somente para livros.",
            );
          }
          const nome = await perguntar("Nome de quem vai reservar: ");
          item.reservar(nome);
          console.log(`Reserva registrada para ${nome.trim()}.`);
          break;
        }
        case "5": {
          const item = repositorio.buscarPorId(await lerId());
          const resposta = await perguntar("Dias de atraso: ");
          const diasAtraso = Number(resposta);
          const multa = item.calcularMulta(diasAtraso);
          console.log(`Multa: R$ ${multa.toFixed(2)}.`);
          break;
        }
        case "0":
          executando = false;
          console.log("Até logo!");
          break;
        default:
          throw new OperacaoInvalidaError("Opção inválida.");
      }
    } catch (erro: unknown) {
      if (erro instanceof EntradaEncerradaError) {
        executando = false;
      } else if (erro instanceof Error) {
        console.error(`Erro: ${erro.message}`);
      } else {
        console.error("Erro inesperado ao executar a operação.");
      }
    }
  }
}

void executarMenu()
  .catch((erro: unknown) => {
    if (erro instanceof Error) {
      console.error(`Falha na aplicação: ${erro.message}`);
    } else {
      console.error("Falha inesperada na aplicação.");
    }
    process.exitCode = 1;
  })
  .finally(() => consoleApp.close());
