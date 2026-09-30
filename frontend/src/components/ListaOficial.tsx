import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface JogadorProcessado {
  id: string;
  usuario_id: string;
  nome: string;
  posicao: string;
  categoria: string;
  status: "titular" | "de_fora";
}

interface ListaOficialProps {
  peladaId: string;
  vagasGoleiros: number;
  vagasLinha: number;
  dataHora: string;
}

interface ListaOficialData {
  goleirosTitulares: JogadorProcessado[];
  linhaTitulares: JogadorProcessado[];
  deFora: JogadorProcessado[];
  congeladaEm: string;
}

export const ListaOficial = ({
  peladaId,
  vagasGoleiros,
  vagasLinha,
  dataHora,
}: ListaOficialProps) => {
  const [lista, setLista] = useState<ListaOficialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [jaCongelada, setJaCongelada] = useState(false);

  useEffect(() => {
    const carregarOuProcessar = async () => {
      setLoading(true);

      // 1. Verifica se já existe uma lista congelada
      const { data: pelada } = await supabase
        .from("peladas")
        .select("lista_oficial, lista_congelada_em")
        .eq("id", peladaId)
        .single();

      if (pelada?.lista_oficial) {
        // Lista já foi congelada, apenas exibir
        const dados = processarListaCompleta(
          pelada.lista_oficial.jogadores,
          vagasGoleiros,
          vagasLinha,
        );
        setLista({ ...dados, congeladaEm: pelada.lista_congelada_em });
        setJaCongelada(true);
        setLoading(false);
        return;
      }

      // 2. Verifica se já passou o horário limite (60 min antes)
      const agora = new Date();
      const limite = new Date(dataHora);
      limite.setMinutes(limite.getMinutes() - 60);

      if (agora < limite) {
        // Ainda não passou o limite, não processa
        setLoading(false);
        return;
      }

      // 3. Passou o limite! Chama a função SQL para congelar a lista
      const { data, error } = await supabase.rpc("processar_lista_oficial", {
        p_pelada_id: peladaId,
      });

      if (error || !data) {
        setLoading(false);
        return;
      }

      // 4. Processa o resultado no frontend
      const dados = processarListaCompleta(data.jogadores, vagasGoleiros, vagasLinha);
      setLista({ ...dados, congeladaEm: data.processado_em });
      setJaCongelada(true);
      setLoading(false);
    };

    carregarOuProcessar();
  }, [peladaId, vagasGoleiros, vagasLinha, dataHora]);

  const processarListaCompleta = (jogadores: any[], vagasGol: number, vagasLin: number) => {
    // Filtra apenas quem confirmou presença
    const presentes = jogadores.filter((j) => j.status_confirmacao === "presenca");

    const goleiros = presentes.filter((j) => j.posicao === "Goleiro");
    const linha = presentes.filter((j) => j.posicao !== "Goleiro");

    // Ordena por prioridade: Mensalista > Premium > Comum, depois por ordem de chegada
    const ordenarPorPrioridade = (arr: any[]) =>
      [...arr].sort((a, b) => {
        const pesoCategoria = (cat: string) => {
          if (cat === "mensalista") return 3;
          if (cat === "premium") return 2;
          return 1;
        };
        const pesoA = pesoCategoria(a.categoria);
        const pesoB = pesoCategoria(b.categoria);
        if (pesoA !== pesoB) return pesoB - pesoA;
        return new Date(a.confirmou_em).getTime() - new Date(b.confirmou_em).getTime();
      });

    const goleirosOrdenados = ordenarPorPrioridade(goleiros);
    const linhaOrdenada = ordenarPorPrioridade(linha);

    const goleirosTitulares: JogadorProcessado[] = goleirosOrdenados
      .slice(0, vagasGol)
      .map((j) => ({ ...j, status: "titular" }));
    const linhaTitulares: JogadorProcessado[] = linhaOrdenada
      .slice(0, vagasLin)
      .map((j) => ({ ...j, status: "titular" }));

    const deFora: JogadorProcessado[] = [
      ...goleirosOrdenados.slice(vagasGol),
      ...linhaOrdenada.slice(vagasLin),
    ].map((j) => ({ ...j, status: "de_fora" }));

    return { goleirosTitulares, linhaTitulares, deFora };
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!lista) {
    // Ainda não passou o horário limite
    return null;
  }

  const totalTitulares = lista.goleirosTitulares.length + lista.linhaTitulares.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-green-800 text-sm uppercase tracking-wide flex items-center gap-2">
          🏆 Lista Oficial da Partida
        </h3>
        {jaCongelada && (
          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold">
            CONGELADA
          </span>
        )}
      </div>

      <p className="text-xs text-gray-600">
        Congelada em: {new Date(lista.congeladaEm).toLocaleString("pt-BR")}
      </p>

      {/* Goleiros Titulares */}
      <div className="space-y-1">
        <h4 className="font-bold text-sm text-pelada-blue">
          Goleiros Titulares ({lista.goleirosTitulares.length}/{vagasGoleiros})
        </h4>
        {lista.goleirosTitulares.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Sem goleiros confirmados</p>
        ) : (
          lista.goleirosTitulares.map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex justify-between items-center bg-white p-2 rounded-lg text-sm"
            >
              <span className="font-medium capitalize">
                {i + 1}. {j.nome}
              </span>
              <span className="text-xs bg-pelada-blue text-white px-2 py-0.5 rounded-full font-bold">
                {j.categoria === "mensalista" ? "M" : j.categoria === "premium" ? "P" : "C"}
              </span>
            </motion.div>
          ))
        )}
      </div>

      {/* Linha Titulares */}
      <div className="space-y-1">
        <h4 className="font-bold text-sm text-green-700">
          Jogadores de Linha Titulares ({lista.linhaTitulares.length}/{vagasLinha})
        </h4>
        {lista.linhaTitulares.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Sem jogadores de linha confirmados</p>
        ) : (
          lista.linhaTitulares.map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex justify-between items-center bg-white p-2 rounded-lg text-sm"
            >
              <span className="font-medium capitalize">
                {i + 1}. {j.nome}
              </span>
              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">
                {j.categoria === "mensalista" ? "M" : j.categoria === "premium" ? "P" : "C"}
              </span>
            </motion.div>
          ))
        )}
      </div>

      {/* De Fora */}
      <div className="space-y-1">
        <h4 className="font-bold text-sm text-red-600">De Fora ({lista.deFora.length})</h4>
        {lista.deFora.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Todos os confirmados entraram!</p>
        ) : (
          lista.deFora.map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex justify-between items-center bg-red-100 p-2 rounded-lg text-sm"
            >
              <span className="font-medium capitalize line-through text-red-500">
                {i + 1}. {j.nome}
              </span>
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                {j.categoria === "mensalista" ? "M" : j.categoria === "premium" ? "P" : "C"}
              </span>
            </motion.div>
          ))
        )}
      </div>

      <div className="bg-white/70 p-2 rounded-lg text-xs text-gray-600 border border-green-200">
        <p>
          <strong>Total de titulares:</strong> {totalTitulares} jogadores
        </p>
        <p className="mt-1">
          <strong>Ordem de prioridade:</strong> Mensalistas confirmados → Avulsos Premium → Avulsos
          Comum
        </p>
      </div>
    </motion.div>
  );
};
