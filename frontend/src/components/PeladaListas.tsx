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

      // Busca todos os jogadores confirmados
      const { data: jogadores } = await supabase
        .from("jogadores_peladas")
        .select("*, perfis(*), membros_grupo(categoria)")
        .eq("pelada_id", peladaId)
        .eq("confirmou", true)
        .order("confirmou_em", { ascending: true });

      if (!jogadores) {
        setLoading(false);
        return;
      }

      // Separa goleiros e jogadores de linha
      const goleiros = jogadores.filter(
        (j) => j.perfis?.posicao === "Goleiro" || j.posicao === "Goleiro",
      );
      const linha = jogadores.filter(
        (j) => j.perfis?.posicao !== "Goleiro" && j.posicao !== "Goleiro",
      );

      // Preenche titulares e espera
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
              {j.membros_grupo?.categoria === "mensalista"
                ? "M"
                : j.membros_grupo?.categoria === "premium"
                  ? "P"
                  : "C"}
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
