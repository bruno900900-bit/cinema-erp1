"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Package,
  TrendingUp,
  Plus,
  Trash2,
  X,
  Layers,
  Target,
  Percent,
  Calculator,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  formatarMoeda,
  formatarPercentual,
  calcularMargemBruta,
  calcularPercentualLucro,
  calcularPontoEquilibrio,
  formatarValorCompacto,
  type ValuationResult,
  type ProjecaoMensal,
} from "@/lib/calculations";

interface CustoFixo {
  id: number;
  nome: string;
  valor: number;
  periodicidade: string;
  descricao: string | null;
}

interface CustoVariavel {
  id: number;
  nome: string;
  valorUnitario: number;
  unidade: string;
  descricao: string | null;
}

interface EtapaProducao {
  id: number;
  nome: string;
  ordem: number;
  custo: number;
  descricao: string | null;
}

interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  precoCusto: number;
  precoVenda: number;
  etapas: EtapaProducao[];
}

interface Empresa {
  id: number;
  nome: string;
  descricao: string | null;
  setor: string | null;
  custosFixos: CustoFixo[];
  custosVariaveis: CustoVariavel[];
  produtos: Produto[];
}

type Tab = "custos" | "produtos" | "analise" | "valuation";

export default function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("custos");

  // Valuation state
  const [valuation, setValuation] = useState<{
    valuation: ValuationResult;
    projecao12Meses: ProjecaoMensal[];
    config: {
      receitaMensal: number;
      custosMensais: number;
      taxaDesconto: number;
      taxaCrescimento: number;
    };
    multiplosSetor: {
      ebitdaMin: number;
      ebitdaMax: number;
      receitaMin: number;
      receitaMax: number;
    };
    resumoAnual: {
      receitaAnual: number;
      custosAnuais: number;
      lucroAnual: number;
    };
  } | null>(null);
  const [loadingValuation, setLoadingValuation] = useState(false);
  const [showValuationConfigModal, setShowValuationConfigModal] =
    useState(false);
  const [receitaMensalInput, setReceitaMensalInput] = useState("");

  // Modal states
  const [showCustoFixoModal, setShowCustoFixoModal] = useState(false);
  const [showCustoVariavelModal, setShowCustoVariavelModal] = useState(false);
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [showEtapaModal, setShowEtapaModal] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  // Form states
  const [custoFixoForm, setCustoFixoForm] = useState({
    nome: "",
    valor: "",
    periodicidade: "mensal",
    descricao: "",
  });
  const [custoVariavelForm, setCustoVariavelForm] = useState({
    nome: "",
    valorUnitario: "",
    unidade: "unidade",
    descricao: "",
  });
  const [produtoForm, setProdutoForm] = useState({
    nome: "",
    descricao: "",
    precoVenda: "",
  });
  const [etapaForm, setEtapaForm] = useState({
    nome: "",
    custo: "",
    descricao: "",
  });
  const [saving, setSaving] = useState(false);

  const loadEmpresa = async () => {
    try {
      const res = await fetch(`/api/empresas/${id}`);
      const data = await res.json();
      setEmpresa(data);
    } catch (error) {
      console.error("Erro ao carregar empresa:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpresa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Carregar valuation quando a tab for selecionada
  useEffect(() => {
    if (
      activeTab === "valuation" &&
      !valuation &&
      !loadingValuation &&
      empresa
    ) {
      setLoadingValuation(true);
      fetch(`/api/empresas/${id}/valuation`)
        .then((res) => res.json())
        .then((data) => {
          setValuation(data);
          setReceitaMensalInput(data.config?.receitaMensal?.toString() || "0");
        })
        .catch(console.error)
        .finally(() => setLoadingValuation(false));
    }
  }, [activeTab, id, valuation, loadingValuation, empresa]);

  const handleSaveValuationConfig = async () => {
    const receitaMensal = parseFloat(receitaMensalInput) || 0;
    await fetch(`/api/empresas/${id}/valuation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receitaMensal }),
    });
    setShowValuationConfigModal(false);
    setValuation(null); // Force reload
  };

  // Calculate totals
  const totalCustosFixos =
    empresa?.custosFixos.reduce((sum, c) => {
      const valorMensal =
        c.periodicidade === "anual"
          ? c.valor / 12
          : c.periodicidade === "semanal"
          ? c.valor * 4
          : c.valor;
      return sum + valorMensal;
    }, 0) || 0;

  const custoVariavelMedio =
    empresa?.custosVariaveis.reduce((sum, c) => sum + c.valorUnitario, 0) || 0;
  const precoVendaMedio = empresa?.produtos.length
    ? empresa.produtos.reduce((sum, p) => sum + p.precoVenda, 0) /
      empresa.produtos.length
    : 0;
  const pontoEquilibrio = calcularPontoEquilibrio(
    totalCustosFixos,
    precoVendaMedio,
    custoVariavelMedio / (empresa?.custosVariaveis.length || 1)
  );

  // CRUD handlers
  const handleAddCustoFixo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/empresas/${id}/custos-fixos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...custoFixoForm,
          valor: parseFloat(custoFixoForm.valor),
        }),
      });
      setShowCustoFixoModal(false);
      setCustoFixoForm({
        nome: "",
        valor: "",
        periodicidade: "mensal",
        descricao: "",
      });
      loadEmpresa();
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustoFixo = async (custoId: number) => {
    if (!confirm("Excluir este custo fixo?")) return;
    await fetch(`/api/empresas/${id}/custos-fixos/${custoId}`, {
      method: "DELETE",
    });
    loadEmpresa();
  };

  const handleAddCustoVariavel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/empresas/${id}/custos-variaveis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...custoVariavelForm,
          valorUnitario: parseFloat(custoVariavelForm.valorUnitario),
        }),
      });
      setShowCustoVariavelModal(false);
      setCustoVariavelForm({
        nome: "",
        valorUnitario: "",
        unidade: "unidade",
        descricao: "",
      });
      loadEmpresa();
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustoVariavel = async (custoId: number) => {
    if (!confirm("Excluir este custo variável?")) return;
    await fetch(`/api/empresas/${id}/custos-variaveis/${custoId}`, {
      method: "DELETE",
    });
    loadEmpresa();
  };

  const handleAddProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/empresas/${id}/produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...produtoForm,
          precoVenda: parseFloat(produtoForm.precoVenda),
        }),
      });
      setShowProdutoModal(false);
      setProdutoForm({ nome: "", descricao: "", precoVenda: "" });
      loadEmpresa();
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduto = async (produtoId: number) => {
    if (!confirm("Excluir este produto e todas suas etapas?")) return;
    await fetch(`/api/empresas/${id}/produtos/${produtoId}`, {
      method: "DELETE",
    });
    loadEmpresa();
  };

  const handleAddEtapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduto) return;
    setSaving(true);
    try {
      await fetch(`/api/empresas/${id}/produtos/${selectedProduto.id}/etapas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...etapaForm,
          custo: parseFloat(etapaForm.custo),
        }),
      });
      setShowEtapaModal(false);
      setEtapaForm({ nome: "", custo: "", descricao: "" });
      loadEmpresa();
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEtapa = async (produtoId: number, etapaId: number) => {
    if (!confirm("Excluir esta etapa?")) return;
    await fetch(`/api/empresas/${id}/produtos/${produtoId}/etapas/${etapaId}`, {
      method: "DELETE",
    });
    loadEmpresa();
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">Carregando...</div>
    );
  }

  if (!empresa) {
    return (
      <div className="text-center py-20 text-slate-400">
        Empresa não encontrada
      </div>
    );
  }

  const tabs = [
    { id: "custos" as Tab, label: "Custos", icon: DollarSign },
    { id: "produtos" as Tab, label: "Produtos", icon: Package },
    { id: "analise" as Tab, label: "Análise", icon: TrendingUp },
    { id: "valuation" as Tab, label: "Valuation", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/empresas"
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-emerald-400" />
            {empresa.nome}
          </h1>
          {empresa.setor && (
            <span className="badge badge-info mt-2">{empresa.setor}</span>
          )}
          {empresa.descricao && (
            <p className="text-slate-400 mt-2">{empresa.descricao}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-slate-400 text-sm">Custos Fixos/mês</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatarMoeda(totalCustosFixos)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-slate-400 text-sm">Produtos</p>
          <p className="text-2xl font-bold text-white mt-1">
            {empresa.produtos.length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-slate-400 text-sm">Custos Variáveis</p>
          <p className="text-2xl font-bold text-white mt-1">
            {empresa.custosVariaveis.length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-slate-400 text-sm">Ponto de Equilíbrio</p>
          <p className="text-2xl font-bold text-white mt-1">
            {pontoEquilibrio === Infinity
              ? "N/A"
              : `${Math.ceil(pontoEquilibrio)} un.`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700/50 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "custos" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Custos Fixos */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                Custos Fixos
              </h3>
              <button
                onClick={() => setShowCustoFixoModal(true)}
                className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {empresa.custosFixos.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Nenhum custo fixo cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {empresa.custosFixos.map((custo) => (
                  <div
                    key={custo.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 group"
                  >
                    <div>
                      <p className="text-white font-medium">{custo.nome}</p>
                      <p className="text-slate-400 text-sm">
                        {custo.periodicidade}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-medium">
                        {formatarMoeda(custo.valor)}
                      </span>
                      <button
                        onClick={() => handleDeleteCustoFixo(custo.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between">
              <span className="text-slate-400">Total Mensal:</span>
              <span className="text-white font-bold">
                {formatarMoeda(totalCustosFixos)}
              </span>
            </div>
          </div>

          {/* Custos Variáveis */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Custos Variáveis
              </h3>
              <button
                onClick={() => setShowCustoVariavelModal(true)}
                className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {empresa.custosVariaveis.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Nenhum custo variável cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {empresa.custosVariaveis.map((custo) => (
                  <div
                    key={custo.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 group"
                  >
                    <div>
                      <p className="text-white font-medium">{custo.nome}</p>
                      <p className="text-slate-400 text-sm">
                        por {custo.unidade}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-medium">
                        {formatarMoeda(custo.valorUnitario)}
                      </span>
                      <button
                        onClick={() => handleDeleteCustoVariavel(custo.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "produtos" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowProdutoModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          </div>
          {empresa.produtos.length === 0 ? (
            <div className="glass-card text-center py-12">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum produto cadastrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {empresa.produtos.map((produto) => {
                const margemBruta = calcularMargemBruta(
                  produto.precoVenda,
                  produto.precoCusto
                );
                const lucroPercent = calcularPercentualLucro(
                  produto.precoVenda,
                  produto.precoCusto
                );
                return (
                  <div key={produto.id} className="glass-card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {produto.nome}
                        </h4>
                        {produto.descricao && (
                          <p className="text-slate-400 text-sm">
                            {produto.descricao}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduto(produto);
                            setShowEtapaModal(true);
                          }}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                          title="Adicionar etapa"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduto(produto.id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-slate-400 text-sm">Custo</p>
                        <p className="text-white font-bold">
                          {formatarMoeda(produto.precoCusto)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-slate-400 text-sm">Preço Venda</p>
                        <p className="text-emerald-400 font-bold">
                          {formatarMoeda(produto.precoVenda)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-slate-400 text-sm">Margem Bruta</p>
                        <p
                          className={`font-bold ${
                            margemBruta > 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatarPercentual(margemBruta)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/50">
                        <p className="text-slate-400 text-sm">Lucro</p>
                        <p
                          className={`font-bold ${
                            lucroPercent > 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatarPercentual(lucroPercent)}
                        </p>
                      </div>
                    </div>

                    {/* Etapas */}
                    {produto.etapas.length > 0 && (
                      <div className="border-t border-slate-700/50 pt-4">
                        <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Etapas de Produção
                        </p>
                        <div className="space-y-2">
                          {produto.etapas.map((etapa, idx) => (
                            <div
                              key={etapa.id}
                              className="flex items-center justify-between p-2 rounded bg-slate-800/30 group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="text-slate-300">
                                  {etapa.nome}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400">
                                  {formatarMoeda(etapa.custo)}
                                </span>
                                <button
                                  onClick={() =>
                                    handleDeleteEtapa(produto.id, etapa.id)
                                  }
                                  className="p-1 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "analise" && (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-400" />
              Análise Financeira
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-emerald-400" />
                  <span className="text-slate-300">Ponto de Equilíbrio</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {pontoEquilibrio === Infinity
                    ? "N/A"
                    : `${Math.ceil(pontoEquilibrio)} unidades`}
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Quantidade mínima para cobrir custos fixos
                </p>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                  <span className="text-slate-300">Custos Fixos Mensais</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatarMoeda(totalCustosFixos)}
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  {empresa.custosFixos.length} custos cadastrados
                </p>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Percent className="w-6 h-6 text-blue-400" />
                  <span className="text-slate-300">Margem Média</span>
                </div>
                {empresa.produtos.length > 0 ? (
                  <>
                    <p className="text-3xl font-bold text-white">
                      {formatarPercentual(
                        empresa.produtos.reduce(
                          (sum, p) =>
                            sum +
                            calcularMargemBruta(p.precoVenda, p.precoCusto),
                          0
                        ) / empresa.produtos.length
                      )}
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Média de {empresa.produtos.length} produtos
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-slate-500">N/A</p>
                )}
              </div>
            </div>
          </div>

          {/* Products Analysis Table */}
          {empresa.produtos.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Análise por Produto
              </h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Custo</th>
                      <th>Venda</th>
                      <th>Lucro</th>
                      <th>Margem</th>
                      <th>% Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresa.produtos.map((produto) => {
                      const lucro = produto.precoVenda - produto.precoCusto;
                      const margem = calcularMargemBruta(
                        produto.precoVenda,
                        produto.precoCusto
                      );
                      const percentLucro = calcularPercentualLucro(
                        produto.precoVenda,
                        produto.precoCusto
                      );
                      return (
                        <tr key={produto.id}>
                          <td className="font-medium">{produto.nome}</td>
                          <td>{formatarMoeda(produto.precoCusto)}</td>
                          <td className="text-emerald-400">
                            {formatarMoeda(produto.precoVenda)}
                          </td>
                          <td
                            className={
                              lucro >= 0 ? "text-emerald-400" : "text-red-400"
                            }
                          >
                            {formatarMoeda(lucro)}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                margem >= 30
                                  ? "badge-success"
                                  : margem >= 15
                                  ? "badge-warning"
                                  : "badge-danger"
                              }`}
                            >
                              {formatarPercentual(margem)}
                            </span>
                          </td>
                          <td
                            className={
                              percentLucro >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }
                          >
                            {formatarPercentual(percentLucro)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Valuation */}
      {activeTab === "valuation" && (
        <div className="space-y-6">
          {loadingValuation ? (
            <div className="text-center py-20 text-slate-400">
              Calculando valuation...
            </div>
          ) : !valuation?.valuation ? (
            <div className="glass-card p-8 text-center">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Configure a Receita
              </h3>
              <p className="text-slate-400 mb-6">
                Informe a receita mensal estimada para calcular o valuation
              </p>
              <div className="max-w-xs mx-auto">
                <input
                  type="number"
                  placeholder="Receita mensal (R$)"
                  value={receitaMensalInput}
                  onChange={(e) => setReceitaMensalInput(e.target.value)}
                  className="input-field mb-4"
                />
                <button
                  onClick={handleSaveValuationConfig}
                  className="btn-primary w-full"
                >
                  Calcular Valuation
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Configuração de receita */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">Receita Mensal:</span>
                    <input
                      type="number"
                      value={receitaMensalInput}
                      onChange={(e) => setReceitaMensalInput(e.target.value)}
                      className="input-field w-40 py-1"
                    />
                  </div>
                  <button
                    onClick={handleSaveValuationConfig}
                    className="btn-secondary text-sm"
                  >
                    Recalcular
                  </button>
                </div>
              </div>

              {/* Cards de Valuation */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* DCF */}
                <div
                  className={`glass-card p-5 ${
                    valuation.valuation.metodoRecomendado === "dcf"
                      ? "ring-2 ring-purple-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm">
                      DCF (Fluxo de Caixa)
                    </span>
                    {valuation.valuation.metodoRecomendado === "dcf" && (
                      <span className="badge badge-success text-xs">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-purple-400">
                    {formatarValorCompacto(valuation.valuation.dcf)}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    5 anos projetados + valor terminal
                  </p>
                </div>

                {/* EBITDA */}
                <div
                  className={`glass-card p-5 ${
                    valuation.valuation.metodoRecomendado === "ebitda"
                      ? "ring-2 ring-emerald-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm">
                      Múltiplo EBITDA
                    </span>
                    {valuation.valuation.metodoRecomendado === "ebitda" && (
                      <span className="badge badge-success text-xs">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-emerald-400">
                    {formatarValorCompacto(valuation.valuation.multiploEbitda)}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    EBITDA:{" "}
                    {formatarMoeda(valuation.valuation.detalhes.ebitdaAnual)}
                    /ano ×{" "}
                    {(valuation.multiplosSetor.ebitdaMin +
                      valuation.multiplosSetor.ebitdaMax) /
                      2}
                    x
                  </p>
                </div>

                {/* Receita */}
                <div
                  className={`glass-card p-5 ${
                    valuation.valuation.metodoRecomendado === "receita"
                      ? "ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm">
                      Múltiplo Receita
                    </span>
                    {valuation.valuation.metodoRecomendado === "receita" && (
                      <span className="badge badge-success text-xs">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-blue-400">
                    {formatarValorCompacto(valuation.valuation.multiploReceita)}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Receita:{" "}
                    {formatarMoeda(valuation.valuation.detalhes.receitaAnual)}
                    /ano ×{" "}
                    {(valuation.multiplosSetor.receitaMin +
                      valuation.multiplosSetor.receitaMax) /
                      2}
                    x
                  </p>
                </div>
              </div>

              {/* Valuation Médio */}
              <div className="glass-card p-6 bg-linear-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 mb-2">
                      Valuation Estimado (Média Ponderada)
                    </p>
                    <p className="text-5xl font-bold text-white">
                      {formatarValorCompacto(
                        valuation.valuation.mediaValuation
                      )}
                    </p>
                  </div>
                  <Sparkles className="w-16 h-16 text-purple-400 opacity-50" />
                </div>
              </div>

              {/* Projeção 12 Meses */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Projeção de Lucro - 12 Meses
                </h3>
                <div className="grid grid-cols-12 gap-2">
                  {valuation.projecao12Meses.map((mes) => {
                    const maxLucro = Math.max(
                      ...valuation.projecao12Meses.map((m) => m.lucro)
                    );
                    const altura =
                      maxLucro > 0 ? (mes.lucro / maxLucro) * 100 : 0;
                    return (
                      <div key={mes.mes} className="flex flex-col items-center">
                        <div className="h-32 w-full flex items-end justify-center">
                          <div
                            className={`w-full rounded-t transition-all ${
                              mes.lucro >= 0 ? "bg-emerald-500" : "bg-red-500"
                            }`}
                            style={{
                              height: `${Math.abs(altura)}%`,
                              minHeight: "4px",
                            }}
                            title={formatarMoeda(mes.lucro)}
                          />
                        </div>
                        <span className="text-xs text-slate-500 mt-1">
                          M{mes.mes}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-sm">
                  <span className="text-slate-400">Lucro Anual Projetado:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatarMoeda(valuation.resumoAnual.lucroAnual)}
                  </span>
                </div>
              </div>

              {/* Múltiplos do Setor */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Múltiplos do Setor: {empresa.setor || "Outro"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-slate-400 text-sm">Múltiplo EBITDA</p>
                    <p className="text-white font-bold">
                      {valuation.multiplosSetor.ebitdaMin}x -{" "}
                      {valuation.multiplosSetor.ebitdaMax}x
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-800/50">
                    <p className="text-slate-400 text-sm">Múltiplo Receita</p>
                    <p className="text-white font-bold">
                      {valuation.multiplosSetor.receitaMin}x -{" "}
                      {valuation.multiplosSetor.receitaMax}x
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showCustoFixoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Novo Custo Fixo
              </h2>
              <button
                onClick={() => setShowCustoFixoModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustoFixo} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={custoFixoForm.nome}
                  onChange={(e) =>
                    setCustoFixoForm({ ...custoFixoForm, nome: e.target.value })
                  }
                  className="input-field"
                  placeholder="Ex: Aluguel"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={custoFixoForm.valor}
                  onChange={(e) =>
                    setCustoFixoForm({
                      ...custoFixoForm,
                      valor: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Periodicidade
                </label>
                <select
                  value={custoFixoForm.periodicidade}
                  onChange={(e) =>
                    setCustoFixoForm({
                      ...custoFixoForm,
                      periodicidade: e.target.value,
                    })
                  }
                  className="input-field"
                >
                  <option value="mensal">Mensal</option>
                  <option value="semanal">Semanal</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustoFixoModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustoVariavelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Novo Custo Variável
              </h2>
              <button
                onClick={() => setShowCustoVariavelModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustoVariavel} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={custoVariavelForm.nome}
                  onChange={(e) =>
                    setCustoVariavelForm({
                      ...custoVariavelForm,
                      nome: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="Ex: Matéria-prima"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Valor Unitário *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={custoVariavelForm.valorUnitario}
                  onChange={(e) =>
                    setCustoVariavelForm({
                      ...custoVariavelForm,
                      valorUnitario: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Unidade
                </label>
                <select
                  value={custoVariavelForm.unidade}
                  onChange={(e) =>
                    setCustoVariavelForm({
                      ...custoVariavelForm,
                      unidade: e.target.value,
                    })
                  }
                  className="input-field"
                >
                  <option value="unidade">Unidade</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="litro">Litro</option>
                  <option value="hora">Hora</option>
                  <option value="metro">Metro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustoVariavelModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProdutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Novo Produto</h2>
              <button
                onClick={() => setShowProdutoModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduto} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={produtoForm.nome}
                  onChange={(e) =>
                    setProdutoForm({ ...produtoForm, nome: e.target.value })
                  }
                  className="input-field"
                  placeholder="Nome do produto"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Preço de Venda *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={produtoForm.precoVenda}
                  onChange={(e) =>
                    setProdutoForm({
                      ...produtoForm,
                      precoVenda: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Descrição
                </label>
                <textarea
                  value={produtoForm.descricao}
                  onChange={(e) =>
                    setProdutoForm({
                      ...produtoForm,
                      descricao: e.target.value,
                    })
                  }
                  className="input-field"
                  rows={2}
                  placeholder="Descrição do produto"
                />
              </div>
              <p className="text-slate-500 text-sm">
                💡 Após criar, adicione etapas de produção para calcular o custo
                automaticamente
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProdutoModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? "Salvando..." : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEtapaModal && selectedProduto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Nova Etapa de Produção
                </h2>
                <p className="text-slate-400 text-sm">
                  Produto: {selectedProduto.nome}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEtapaModal(false);
                  setSelectedProduto(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEtapa} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Nome da Etapa *
                </label>
                <input
                  type="text"
                  required
                  value={etapaForm.nome}
                  onChange={(e) =>
                    setEtapaForm({ ...etapaForm, nome: e.target.value })
                  }
                  className="input-field"
                  placeholder="Ex: Corte, Montagem, Acabamento"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Custo da Etapa *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={etapaForm.custo}
                  onChange={(e) =>
                    setEtapaForm({ ...etapaForm, custo: e.target.value })
                  }
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Descrição
                </label>
                <textarea
                  value={etapaForm.descricao}
                  onChange={(e) =>
                    setEtapaForm({ ...etapaForm, descricao: e.target.value })
                  }
                  className="input-field"
                  rows={2}
                  placeholder="Detalhes da etapa"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEtapaModal(false);
                    setSelectedProduto(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? "Salvando..." : "Adicionar Etapa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
