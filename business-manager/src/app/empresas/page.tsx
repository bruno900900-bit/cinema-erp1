"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Search, Trash2, ArrowRight, X } from "lucide-react";
import { formatarMoeda } from "@/lib/calculations";

interface Empresa {
  id: number;
  nome: string;
  descricao: string | null;
  setor: string | null;
  totalCustosFixos: number;
  totalProdutos: number;
  totalCustosVariaveis: number;
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    setor: "",
  });
  const [saving, setSaving] = useState(false);

  const loadEmpresas = async () => {
    try {
      const res = await fetch("/api/empresas");
      const data = await res.json();
      setEmpresas(data);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpresas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ nome: "", descricao: "", setor: "" });
      loadEmpresas();
    } catch (error) {
      console.error("Erro ao criar empresa:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;
    try {
      await fetch(`/api/empresas/${id}`, { method: "DELETE" });
      loadEmpresas();
    } catch (error) {
      console.error("Erro ao excluir empresa:", error);
    }
  };

  const filteredEmpresas = empresas.filter((e) =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  const setores = [
    "Tecnologia",
    "Comércio",
    "Serviços",
    "Indústria",
    "Alimentação",
    "Outro",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-emerald-400" />
            Empresas
          </h1>
          <p className="text-slate-400 mt-1">
            Gerencie suas empresas e análises financeiras
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar empresas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Carregando...</div>
      ) : filteredEmpresas.length === 0 ? (
        <div className="glass-card text-center py-12">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            {search
              ? "Nenhuma empresa encontrada"
              : "Nenhuma empresa cadastrada"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmpresas.map((empresa) => (
            <div
              key={empresa.id}
              className="glass-card p-5 hover:border-emerald-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-white">
                    {empresa.nome}
                  </h3>
                  {empresa.setor && (
                    <span className="badge badge-info mt-1">
                      {empresa.setor}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(empresa.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {empresa.descricao && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {empresa.descricao}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="p-2 rounded-lg bg-slate-800/50">
                  <p className="text-slate-500">Custos Fixos</p>
                  <p className="text-white font-medium">
                    {formatarMoeda(empresa.totalCustosFixos)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50">
                  <p className="text-slate-500">Produtos</p>
                  <p className="text-white font-medium">
                    {empresa.totalProdutos}
                  </p>
                </div>
              </div>
              <Link
                href={`/empresas/${empresa.id}`}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                Acessar
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Nova Empresa</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="input-field"
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Setor
                </label>
                <select
                  value={formData.setor}
                  onChange={(e) =>
                    setFormData({ ...formData, setor: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">Selecione um setor</option>
                  {setores.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="input-field"
                  rows={3}
                  placeholder="Descrição da empresa"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? "Salvando..." : "Criar Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
