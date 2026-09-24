import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Jogador {
  id: string;
  usuario_id: string;
  nome: string;
  posicao: string;
  categoria: string;
  confirmou_em: string;
}

interface PeladaListasProps {
  peladaId: string;
  vagasGoleiros: number;
  vagasLinha: number;
}

export const PeladaListas = ({ peladaId, vagasGoleiros, vagasLinha }: PeladaListasProps) => {
  const [goleirosTitulares, setGoleirosTitulares] = useState<Jogador[]>([]);
  const [goleirosEspera, setGoleirosEspera] = useState<Jogador[]>([]);
  const [linhaTitulares, setLinhaTitulares] = useState<Jogador[]>([]);
  const [linhaEspera, setLinhaEspera] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarListas = async () => {
      setLoading(true);

      const { data: jogadores } = await supabase
        .from("jogadores_peladas")
        .select("*")
        .eq("pelada_id", peladaId)
        .eq("confirmou", true)
        .order("confirmou_em", { ascending: true });

      if (!jogadores || jogadores.length === 0) {
        setGoleirosTitulares([]);
        setGoleirosEspera([]);
        setLinhaTitulares([]);
        setLinhaEspera([]);
        setLoading(false);
        return;
      }

      const jogadoresComDetalhes: Jogador[] = [];

      for (const j of jogadores) {
        // Busca a posição da tabela perfis (pública!)
        const { data: perfil } = await supabase
          .from("perfis")
          .select("posicao")
          .eq("usuario_id", j.usuario_id)
          .single();

        const posicao = perfil?.posicao || "Curinga";

        // Busca a categoria do membro
        const { data: membroData } = await supabase
          .from("membros_grupo")
          .select("categoria")
          .eq("usuario_id", j.usuario_id)
          .single();

        jogadoresComDetalhes.push({
          id: j.id,
          usuario_id: j.usuario_id,
          nome: j.nome,
          posicao,
          categoria: membroData?.categoria || "comum",
          confirmou_em: j.confirmou_em,
        });
      }

      const goleiros = jogadoresComDetalhes.filter((j) => j.posicao === "Goleiro");
      const linha = jogadoresComDetalhes.filter((j) => j.posicao !== "Goleiro");

      setGoleirosTitulares(goleiros.slice(0, vagasGoleiros));
      setGoleirosEspera(goleiros.slice(vagasGoleiros));
      setLinhaTitulares(linha.slice(0, vagasLinha));
      setLinhaEspera(linha.slice(vagasLinha));

      setLoading(false);
    };

    carregarListas();
  }, [peladaId, vagasGoleiros, vagasLinha]);

  const renderLista = (titulo: string, jogadores: Jogador[], cor: string) => (
    <div className="space-y-2">
      <h4 className={`font-bold text-sm ${cor}`}>{titulo}</h4>
      {jogadores.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Vaga disponível</p>
      ) : (
        jogadores.map((j, i) => (
          <motion.div
            key={j.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm"
          >
            <span className="font-medium capitalize">{j.nome}</span>
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

      {renderLista(
        `Goleiros Titulares (${goleirosTitulares.length}/${vagasGoleiros})`,
        goleirosTitulares,
        "text-pelada-blue",
      )}
      {renderLista("Goleiros - Lista de Espera", goleirosEspera, "text-gray-600")}
      {renderLista(
        `Jogadores de Linha Titulares (${linhaTitulares.length}/${vagasLinha})`,
        linhaTitulares,
        "text-green-600",
      )}
      {renderLista("Linha - Lista de Espera", linhaEspera, "text-gray-600")}

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
        <strong>Legenda:</strong> M = Mensalista | P = Premium | C = Comum
      </div>
    </div>
  );
};
