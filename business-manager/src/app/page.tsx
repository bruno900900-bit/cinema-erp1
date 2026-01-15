"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  Package,
  DollarSign,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { formatarMoeda } from "@/lib/calculations";

interface EmpresaResumo {
  id: number;
  nome: string;
  setor: string | null;
  totalCustosFixos: number;
  totalProdutos: number;
}

export default function HomePage() {
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/empresas")
      .then((res) => res.json())
      .then((data) => {
        setEmpresas(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalEmpresas = empresas.length;
  const totalCustos = empresas.reduce((sum, e) => sum + e.totalCustosFixos, 0);
  const totalProdutos = empresas.reduce((sum, e) => sum + e.totalProdutos, 0);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold">
          <span className="gradient-text">Gerenciamento Empresarial</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Controle completo de custos, produtos e análises financeiras para suas
          empresas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total de Empresas</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? "..." : totalEmpresas}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Custos Fixos Totais</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? "..." : formatarMoeda(totalCustos)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total de Produtos</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? "..." : totalProdutos}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Suas Empresas
          </h2>
          <Link
            href="/empresas"
            className="btn-primary flex items-center gap-2"
          >
            Ver Todas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Carregando...</div>
        ) : empresas.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              Nenhuma empresa cadastrada ainda
            </p>
            <Link href="/empresas" className="btn-primary">
              Cadastrar Primeira Empresa
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {empresas.slice(0, 6).map((empresa) => (
              <Link
                key={empresa.id}
                href={`/empresas/${empresa.id}`}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {empresa.nome}
                    </h3>
                    {empresa.setor && (
                      <span className="badge badge-info mt-2">
                        {empresa.setor}
                      </span>
                    )}
                  </div>
                  <TrendingUp className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                  <span>{empresa.totalProdutos} produtos</span>
                  <span>•</span>
                  <span>{formatarMoeda(empresa.totalCustosFixos)}/mês</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
