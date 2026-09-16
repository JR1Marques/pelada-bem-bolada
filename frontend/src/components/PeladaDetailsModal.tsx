import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

export const PeladaDetailsModal = ({
  peladaId,
  valorPorJogador = 0,
  isOpen,
  onClose,
}: PeladaDetailsModalProps) => {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [timeA, setTimeA] = useState<Jogador[]>([]);
  const [timeB, setTimeB] = useState<Jogador[]>([]);
  const [dividindo, setDividindo] = useState(false);

  useEffect(() => {
    if (!isOpen || !peladaId) return;

    const fetchJogadores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("jogadores_peladas")
        .select("*")
        .eq("pelada_id", peladaId);

      if (!error && data) {
        setJogadores(data);
      }
      setLoading(false);
    };

    fetchJogadores();
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
      await supabase.from("jogadores_peladas").insert({
        pelada_id: peladaId,
        usuario_id: user.id,
        nome: user.email?.split("@")[0] || "Jogador",
        confirmou: true,
        pagou: false,
      });
    }

    const { data } = await supabase.from("jogadores_peladas").select("*").eq("pelada_id", peladaId);
    if (data) setJogadores(data);

    setConfirming(false);
  };

  const handleTogglePagamento = async (jogadorId: string, statusAtual: boolean) => {
    const novoStatus = !statusAtual;

    // Atualiza no Supabase
    const { error } = await supabase
      .from("jogadores_peladas")
      .update({ pagou: novoStatus })
      .eq("id", jogadorId);

    // Atualiza na tela (otimista, mas só se não der erro no banco)
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

  const handleDividirTimes = () => {
    const confirmados = jogadores.filter((j) => j.confirmou);
    if (confirmados.length < 2) return;

    setDividindo(true);

    setTimeout(() => {
      const embaralhados = shuffleArray(confirmados);
      const meio = Math.ceil(embaralhados.length / 2);

      setTimeA(embaralhados.slice(0, meio));
      setTimeB(embaralhados.slice(meio));
      setDividindo(false);
    }, 1500);
  };

  // Cálculos Financeiros
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
                {/* Resumo Financeiro */}
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

                {/* Lista de Jogadores */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Jogadores ({totalConfirmados} confirmados)
                  </h3>
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : jogadores.filter((j) => j.confirmou).length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum jogador confirmado ainda.</p>
                  ) : (
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                      {jogadores
                        .filter((j) => j.confirmou)
                        .map((jogador) => (
                          <motion.li
                            key={jogador.id}
                            layout
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                          >
                            <span className="font-medium capitalize">{jogador.nome}</span>

                            {valorPorJogador > 0 && (
                              <motion.button
                                type="button"
                                onClick={() => handleTogglePagamento(jogador.id, jogador.pagou)}
                                whileTap={{ scale: 0.9 }}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                  jogador.pagou
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {jogador.pagou ? "Pago" : "Pendente"}
                              </motion.button>
                            )}
                          </motion.li>
                        ))}
                    </ul>
                  )}
                </div>

                {/* Botões de Ação */}
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

                {/* Resultado da Divisão */}
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
