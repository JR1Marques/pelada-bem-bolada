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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarListas = async () => {
      setLoading(true);

      const { data: jogadores } = await supabase
        .from("jogadores_peladas")
        .select("*")
        .eq("pelada_id", peladaId)
        .in("status_confirmacao", ["presenca", "ausencia", "pendente"])
        .order("confirmou_em", { ascending: true });

      if (!jogadores || jogadores.length === 0) {
        setGoleirosTitulares(Array(vagasGoleiros).fill(null));
        setGoleirosEspera([]);
        setLinhaTitulares(Array(vagasLinha).fill(null));
        setLinhaEspera([]);
        setLoading(false);
        return;
      }

      const jogadoresComDetalhes: Jogador[] = [];

      for (const j of jogadores) {
        const { data: perfil } = await supabase
          .from("perfis")
          .select("posicao")
          .eq("usuario_id", j.usuario_id)
          .single();

        const { data: membroData } = await supabase
          .from("membros_grupo")
          .select("categoria")
          .eq("usuario_id", j.usuario_id)
          .single();

        jogadoresComDetalhes.push({
          id: j.id,
          usuario_id: j.usuario_id,
          nome: j.nome,
          posicao: perfil?.posicao || "Curinga",
          categoria: membroData?.categoria || "comum",
          status_confirmacao: j.status_confirmacao,
          confirmou_em: j.confirmou_em,
        });
      }

      // Separa por posição
      const goleiros = jogadoresComDetalhes.filter((j) => j.posicao === "Goleiro");
      const linha = jogadoresComDetalhes.filter((j) => j.posicao !== "Goleiro");

      // Aplica a regra de prioridade
      const { titulares: golTit, espera: golEsp } = processarLista(
        goleiros,
        vagasGoleiros,
        dataHora,
      );
      const { titulares: linTit, espera: linEsp } = processarLista(linha, vagasLinha, dataHora);

      setGoleirosTitulares(golTit);
      setGoleirosEspera(golEsp);
      setLinhaTitulares(linTit);
      setLinhaEspera(linEsp);

      setLoading(false);
    };

    carregarListas();
  }, [peladaId, vagasGoleiros, vagasLinha, dataHora]);

  const processarLista = (jogadores: Jogador[], vagas: number, dataHora: string) => {
    const agora = new Date();
    const limite = new Date(dataHora);
    limite.setMinutes(limite.getMinutes() - 60);
    const passouLimite = agora >= limite;

    // Separa por categoria e status
    const mensalistasPresenca = jogadores.filter(
      (j) => j.categoria === "mensalista" && j.status_confirmacao === "presenca",
    );
    const mensalistasAusencia = jogadores.filter(
      (j) => j.categoria === "mensalista" && j.status_confirmacao === "ausencia",
    );
    const mensalistasPendentes = jogadores.filter(
      (j) => j.categoria === "mensalista" && j.status_confirmacao === "pendente",
    );

    const avulsosPresenca = jogadores.filter(
      (j) => j.categoria !== "mensalista" && j.status_confirmacao === "presenca",
    );
    const avulsosAusencia = jogadores.filter(
      (j) => j.categoria !== "mensalista" && j.status_confirmacao === "ausencia",
    );

    // Calcula vagas disponíveis
    const vagasOcupadasMensalistas = mensalistasPresenca.length;
    const vagasLiberadasAusencia = mensalistasAusencia.length;
    const vagasPendentes = passouLimite ? 0 : mensalistasPendentes.length; // Se passou o limite, pendentes viram ausência

    const vagasDisponiveisParaAvulsos = Math.max(
      0,
      vagas - vagasOcupadasMensalistas - vagasPendentes + vagasLiberadasAusencia,
    );

    // Monta lista de titulares
    const titulares: (Jogador | null)[] = Array(vagas).fill(null);

    // 1. Preenche com mensalistas que confirmaram presença
    mensalistasPresenca.forEach((j, i) => {
      if (i < vagas) titulares[i] = j;
    });

    // 2. Preenche vagas pendentes (reservadas para mensalistas)
    mensalistasPendentes.forEach((j, i) => {
      const indice = vagasOcupadasMensalistas + i;
      if (indice < vagas && !passouLimite) {
        titulares[indice] = { ...j, nome: `${j.nome} (pendente)` };
      }
    });

    // 3. Preenche com avulsos (prioridade: Premium > Comum, depois por ordem de chegada)
    const avulsosOrdenados = [...avulsosPresenca].sort((a, b) => {
      if (a.categoria === "premium" && b.categoria !== "premium") return -1;
      if (b.categoria === "premium" && a.categoria !== "premium") return 1;
      return new Date(a.confirmou_em).getTime() - new Date(b.confirmou_em).getTime();
    });

    let indiceAvulso = 0;
    for (let i = 0; i < vagas && indiceAvulso < avulsosOrdenados.length; i++) {
      if (titulares[i] === null) {
        titulares[i] = avulsosOrdenados[indiceAvulso];
        indiceAvulso++;
      }
    }

    // 4. Resto dos avulsos vai para espera
    const espera = avulsosOrdenados.slice(indiceAvulso);

    return { titulares, espera };
  };

  const renderListaTitulares = (titulo: string, jogadores: (Jogador | null)[], cor: string) => (
    <div className="space-y-2">
      <h4 className={`font-bold text-sm ${cor}`}>{titulo}</h4>
      {jogadores.map((j, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm"
        >
          <span className="font-medium">
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
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
        Lista de Confirmação
      </h3>

      {renderListaTitulares("Goleiros", goleirosTitulares, "text-pelada-blue")}
      {renderListaEspera("Espera Goleiros", goleirosEspera, "text-gray-600")}
      {renderListaTitulares("Jogadores de Linha", linhaTitulares, "text-green-600")}
      {renderListaEspera("Espera para Linha", linhaEspera, "text-gray-600")}

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
