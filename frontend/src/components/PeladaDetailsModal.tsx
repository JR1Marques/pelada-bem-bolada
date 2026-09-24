import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { PeladaListas } from "./PeladaListas";

interface PeladaDetailsModalProps {
  peladaId: string | null;
  valorPorJogador?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface Jogador {
  id: string;
  usuario_id: string;
  nome: string;
  confirmou: boolean;
  pagou: boolean;
}

interface Pelada {
  vagas_goleiros: number;
  vagas_linha: number;
  quantidade_times: number;
}

export const PeladaDetailsModal = ({
  peladaId,
  valorPorJogador = 0,
  isOpen,
  onClose,
}: PeladaDetailsModalProps) => {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [timeA, setTimeA] = useState<Jogador[]>([]);
  const [timeB, setTimeB] = useState<Jogador[]>([]);
  const [dividindo, setDividindo] = useState(false);

  useEffect(() => {
    if (!isOpen || !peladaId) return;

    const fetchData = async () => {
      setLoading(true);

      // Busca dados da pelada
      const { data: peladaData } = await supabase
        .from("peladas")
        .select("vagas_goleiros, vagas_linha, quantidade_times")
        .eq("id", peladaId)
        .single();

      if (peladaData) {
        setPelada(peladaData);
      }

      // Busca jogadores
      const { data, error } = await supabase
        .from("jogadores_peladas")
        .select("*")
        .eq("pelada_id", peladaId);

      if (!error && data) {
        setJogadores(data);
      }
      setLoading(false);
    };

    fetchData();
    setTimeA([]);
    setTimeB([]);
  }, [isOpen, peladaId]);

  const handleConfirmar = async () => {
    if (!peladaId) return;

    setConfirming(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setConfirming(false);
      return;
    }

    const jaConfirmou = jogadores.find((j) => j.usuario_id === user.id);

    if (jaConfirmou) {
      await supabase.from("jogadores_peladas").delete().eq("id", jaConfirmou.id);
    } else {
      const nomeExibicao = user.user_metadata?.nickname || user.email?.split("@")[0] || "Jogador";

      await supabase.from("jogadores_peladas").insert({
        pelada_id: peladaId,
        usuario_id: user.id,
        nome: nomeExibicao,
        confirmou: true,
        pagou: false,
        confirmou_em: new Date().toISOString(),
      });
    }

    const { data } = await supabase.from("jogadores_peladas").select("*").eq("pelada_id", peladaId);
    if (data) setJogadores(data);

    setConfirming(false);
  };

  const handleTogglePagamento = async (jogadorId: string, statusAtual: boolean) => {
    const novoStatus = !statusAtual;

    const { error } = await supabase
      .from("jogadores_peladas")
      .update({ pagou: novoStatus })
      .eq("id", jogadorId);

    if (!error) {
      setJogadores((prev) =>
        prev.map((j) => (j.id === jogadorId ? { ...j, pagou: novoStatus } : j)),
      );
    }
  };

  const shuffleArray = (array: Jogador[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleDividirTimes = async () => {
    const confirmados = jogadores.filter((j) => j.confirmou);
    if (confirmados.length < 2 || !pelada) return;

    setDividindo(true);

    // Busca a posição de cada jogador
    const jogadoresComPosicao: { jogador: Jogador; posicao: string }[] = [];

    for (const j of confirmados) {
      const { data: userData } = await supabase.auth.admin.getUserById(j.usuario_id);
      const posicao = userData?.user?.user_metadata?.position || "Curinga";
      jogadoresComPosicao.push({ jogador: j, posicao });
    }

    // Separa goleiros e jogadores de linha
    const goleiros = jogadoresComPosicao.filter((j) => j.posicao === "Goleiro");
    const linha = jogadoresComPosicao.filter((j) => j.posicao !== "Goleiro");

    // Embaralha apenas os jogadores de linha
    const linhaEmbaralhada = shuffleArray(linha.map((j) => j.jogador));

    // Distribui os jogadores de linha entre os times
    const times: Jogador[][] = Array.from({ length: pelada.quantidade_times }, () => []);
    linhaEmbaralhada.forEach((jogador, index) => {
      times[index % pelada.quantidade_times].push(jogador);
    });

    // Distribui os goleiros (um para cada time, se houver goleiros suficientes)
    goleiros.forEach((g, index) => {
      if (index < pelada.quantidade_times) {
        times[index].unshift(g.jogador); // Adiciona o goleiro no início do time
      }
    });

    // Define os dois primeiros times para exibição (Time A e Time B)
    setTimeA(times[0] || []);
    setTimeB(times[1] || []);

    setDividindo(false);
  };

  const totalConfirmados = jogadores.filter((j) => j.confirmou).length;
  const totalPagantes = jogadores.filter((j) => j.pagou).length;
  const totalEsperado = totalConfirmados * valorPorJogador;
  const totalArrecadado = totalPagantes * valorPorJogador;
  const faltaArrecadar = totalEsperado - totalArrecadado;

  return (
    <AnimatePresence>
      {isOpen && peladaId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-pelada-blue">Detalhes da Pelada</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-6">
                {valorPorJogador > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3"
                  >
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                      Resumo Financeiro
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <p className="text-gray-500 text-xs">Esperado</p>
                        <p className="font-bold text-pelada-blue">R$ {totalEsperado.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <p className="text-gray-500 text-xs">Arrecadado</p>
                        <p className="font-bold text-green-600">R$ {totalArrecadado.toFixed(2)}</p>
                      </div>
                    </div>
                    {faltaArrecadar > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500 text-center font-medium"
                      >
                        Faltam R$ {faltaArrecadar.toFixed(2)} para fechar a conta!
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {pelada && (
                  <PeladaListas
                    peladaId={peladaId}
                    vagasGoleiros={pelada.vagas_goleiros}
                    vagasLinha={pelada.vagas_linha}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    onClick={handleConfirmar}
                    disabled={confirming}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-pelada-yellow text-pelada-blue font-bold py-3 rounded-lg shadow-md disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
                  >
                    {confirming ? "..." : "Confirmar"}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleDividirTimes}
                    disabled={dividindo || totalConfirmados < 2}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-pelada-blue text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
                  >
                    {dividindo ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      "Dividir Times"
                    )}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {(timeA.length > 0 || timeB.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4 border-t border-gray-200"
                    >
                      <div>
                        <h4 className="font-bold text-pelada-blue mb-2">Time A</h4>
                        <div className="space-y-1">
                          {timeA.map((j, i) => (
                            <motion.div
                              key={j.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="bg-blue-50 p-2 rounded text-sm capitalize"
                            >
                              {j.nome}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-red-600 mb-2">Time B</h4>
                        <div className="space-y-1">
                          {timeB.map((j, i) => (
                            <motion.div
                              key={j.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="bg-red-50 p-2 rounded text-sm capitalize"
                            >
                              {j.nome}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
