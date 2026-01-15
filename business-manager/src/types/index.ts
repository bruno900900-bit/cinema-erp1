export interface Empresa {
  id: number;
  nome: string;
  descricao: string | null;
  setor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustoFixo {
  id: number;
  empresaId: number;
  nome: string;
  valor: number;
  periodicidade: "mensal" | "anual" | "semanal";
  descricao: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustoVariavel {
  id: number;
  empresaId: number;
  nome: string;
  valorUnitario: number;
  unidade: string;
  descricao: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Produto {
  id: number;
  empresaId: number;
  nome: string;
  descricao: string | null;
  precoCusto: number;
  precoVenda: number;
  createdAt: Date;
  updatedAt: Date;
  etapas?: EtapaProducao[];
}

export interface EtapaProducao {
  id: number;
  produtoId: number;
  nome: string;
  ordem: number;
  custo: number;
  descricao: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmpresaComResumo extends Empresa {
  totalCustosFixos: number;
  totalProdutos: number;
  totalCustosVariaveis: number;
}
