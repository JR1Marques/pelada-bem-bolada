import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Jogador {
  id: string;
  usuario_id: string;
  nome: string;
  posicao: string;
  categoria: string;
  status_confirmacao: string;
  confirmou_em: string;
}

interface PeladaListasProps {
  peladaId: string;
  vagasGoleiros: number;
  vagasLinha: number;
  dataHora: string;
}

// Função PURA fora do componente
const processarLista = (jogadores: Jogador[], vagas: number, dataHora: string) => {
  const agora = new Date();
  const limite = new Date(dataHora);
  limite.setMinutes(limite.getMinutes() - 60);
  const passouLimite = agora >= limite;

  const mensalistasPresenca = jogadores.filter((j) => j.categoria === "mensalista");
  const avulsosPresenca = jogadores.filter((j) => j.categoria !== "mensalista");

  const mensalistasPendentes = mensalistasPresenca.filter(
    (j) => j.status_confirmacao === "pendente",
  );

  const titulares: (Jogador | null)[] = Array(vagas).fill(null);

  let idx = 0;
  for (const j of mensalistasPresenca) {
    if (idx < vagas) {
      titulares[idx] = j;
      idx++;
    }
  }

  for (const j of mensalistasPendentes) {
    if (idx < vagas && !passouLimite) {
      titulares[idx] = { ...j, nome: `${j.nome} (pendente)` };
      idx++;
    }
  }

  const avulsosOrdenados = [...avulsosPresenca].sort((a, b) => {
    if (a.categoria === "premium" && b.categoria !== "premium") return -1;
    if (b.categoria === "premium" && a.categoria !== "premium") return 1;
    return new Date(a.confirmou_em).getTime() - new Date(b.confirmou_em).getTime();
  });

  let idxAvulso = 0;
  for (let i = 0; i < vagas && idxAvulso < avulsosOrdenados.length; i++) {
    if (titulares[i] === null) {
      titulares[i] = avulsosOrdenados[idxAvulso];
      idxAvulso++;
    }
  }

  const espera = avulsosOrdenados.slice(idxAvulso);

  return { titulares, espera };
};

export const PeladaListas = ({
  peladaId,
  vagasGoleiros,
  vagasLinha,
  dataHora,
}: PeladaListasProps) => {
  const [goleirosTitulares, setGoleirosTitulares] = useState<(Jogador | null)[]>([]);
  const [goleirosEspera, setGoleirosEspera] = useState<Jogador[]>([]);
  const [linhaTitulares, setLinhaTitulares] = useState<(Jogador | null)[]>([]);
  const [linhaEspera, setLinhaEspera] = useState<Jogador[]>([]);
  const [mensalistasAusentes, setMensalistasAusentes] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarListas = async () => {
      setLoading(true);

      const { data: jogadores } = await supabase
        .from("jogadores_peladas")
        .select("*")
        .eq("pelada_id", peladaId)
        .order("confirmou_em", { ascending: true });

      if (!jogadores || jogadores.length === 0) {
        setGoleirosTitulares(Array(vagasGoleiros).fill(null));
        setGoleirosEspera([]);
        setLinhaTitulares(Array(vagasLinha).fill(null));
        setLinhaEspera([]);
        setMensalistasAusentes([]);
        setLoading(false);
        return;
      }

      const jogadoresComDetalhes: Jogador[] = [];

      for (const j of jogadores) {
        let posicao = j.posicao;

        if (!posicao || posicao === "Curinga") {
          const { data: perfil } = await supabase
            .from("perfis")
            .select("posicao")
            .eq("usuario_id", j.usuario_id)
            .single();
          if (perfil?.posicao) {
            posicao = perfil.posicao;
          }
        }

        const { data: membroData } = await supabase
          .from("membros_grupo")
          .select("categoria")
          .eq("usuario_id", j.usuario_id)
          .single();

        jogadoresComDetalhes.push({
          id: j.id,
          usuario_id: j.usuario_id,
          nome: j.nome,
          posicao: posicao || "Curinga",
          categoria: membroData?.categoria || "comum",
          status_confirmacao: j.status_confirmacao || "pendente",
          confirmou_em: j.confirmou_em,
        });
      }

      const ausentes = jogadoresComDetalhes.filter(
        (j) => j.categoria === "mensalista" && j.status_confirmacao === "ausencia",
      );
      setMensalistasAusentes(ausentes);

      const presentes = jogadoresComDetalhes.filter((j) => j.status_confirmacao === "presenca");

      const goleiros = presentes.filter((j) => j.posicao === "Goleiro");
      const linha = presentes.filter((j) => j.posicao !== "Goleiro");

      const golResult = processarLista(goleiros, vagasGoleiros, dataHora);
      const linResult = processarLista(linha, vagasLinha, dataHora);

      setGoleirosTitulares(golResult.titulares);
      setGoleirosEspera(golResult.espera);
      setLinhaTitulares(linResult.titulares);
      setLinhaEspera(linResult.espera);

      setLoading(false);
    };

    carregarListas();
  }, [peladaId, vagasGoleiros, vagasLinha, dataHora]);

  const renderListaTitulares = (titulo: string, jogadores: (Jogador | null)[], cor: string) => (
    <div className="space-y-2">
      <h4 className={`font-bold text-sm ${cor}`}>{titulo}</h4>
      {jogadores.map((j, i) => (
        <motion.div
          key={j ? j.id : `${titulo}-vaga-${i}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`flex justify-between items-center p-2 rounded-lg text-sm ${
            j ? "bg-gray-50" : "bg-gray-50/50"
          }`}
        >
          <span className={`font-medium ${j ? "" : "text-gray-400"}`}>
            {i + 1}. {j ? j.nome : "—"}
          </span>
          {j && (
            <span className="text-xs text-gray-500">
              {j.categoria === "mensalista" ? "M" : j.categoria === "premium" ? "P" : "C"}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );

  const renderListaEspera = (titulo: string, jogadores: Jogador[], cor: string) => (
    <div className="space-y-2">
      <h4 className={`font-bold text-sm ${cor}`}>{titulo}</h4>
      {jogadores.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Nenhum jogador na espera</p>
      ) : (
        jogadores.map((j, i) => (
          <motion.div
            key={j.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm"
          >
            <span className="font-medium">
              {i + 1}. {j.nome}
            </span>
            <span className="text-xs text-gray-500">
              {j.categoria === "mensalista" ? "M" : j.categoria === "premium" ? "P" : "C"}
            </span>
          </motion.div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((num) => (
          <div key={`skeleton-${num}`} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
        Lista de Confirmação
      </h3>

      {renderListaTitulares(
        `Goleiros (${goleirosTitulares.filter((j) => j !== null).length}/${vagasGoleiros})`,
        goleirosTitulares,
        "text-pelada-blue",
      )}
      {renderListaEspera("Espera Goleiros", goleirosEspera, "text-gray-600")}
      {renderListaTitulares(
        `Jogadores de Linha (${linhaTitulares.filter((j) => j !== null).length}/${vagasLinha})`,
        linhaTitulares,
        "text-green-600",
      )}
      {renderListaEspera("Espera para Linha", linhaEspera, "text-gray-600")}

      <div className="space-y-2">
        <h4 className="font-bold text-sm text-red-500">Mensalistas Ausentes</h4>
        {mensalistasAusentes.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Nenhum mensalista confirmou ausência</p>
        ) : (
          mensalistasAusentes.map((j, i) => (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex justify-between items-center bg-red-50 p-2 rounded-lg text-sm"
            >
              <span className="font-medium line-through text-red-400">{j.nome}</span>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                M
              </span>
            </motion.div>
          ))
        )}
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg space-y-1">
        <p>
          <strong>Legenda:</strong> M = Mensalista | P = Premium | C = Comum
        </p>
        <p>
          <strong>Regra:</strong> Mensalistas têm prioridade. Avulsos entram quando mensalistas
          liberam vaga ou passa o horário limite (60 min antes).
        </p>
      </div>
    </div>
  );
};
