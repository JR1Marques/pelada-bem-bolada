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
  status_confirmacao?: string;
}

interface Pelada {
  vagas_goleiros: number;
  vagas_linha: number;
  quantidade_times: number;
  data_hora: string;
}

export const PeladaDetailsModal = ({
  peladaId,
  valorPorJogador = 0,
  isOpen,
  onClose,
}: PeladaDetailsModalProps) => {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [_loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [timeA, setTimeA] = useState<Jogador[]>([]);
  const [timeB, setTimeB] = useState<Jogador[]>([]);
  const [dividindo, setDividindo] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [ehMensalista, setEhMensalista] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !peladaId) return;

    const fetchData = async () => {
      setLoading(true);
      setMensagemSucesso("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        const { data: grupo } = await supabase.from("grupos").select("id").limit(1).single();
        if (grupo) {
          const { data: meuMembro } = await supabase
            .from("membros_grupo")
            .select("categoria")
            .eq("grupo_id", grupo.id)
            .eq("usuario_id", user.id)
            .single();
          setEhMensalista(meuMembro?.categoria === "mensalista");
        }
      }

      const { data: peladaData } = await supabase
        .from("peladas")
        .select("vagas_goleiros, vagas_linha, quantidade_times, data_hora")
        .eq("id", peladaId)
        .single();

      if (peladaData) {
        setPelada(peladaData);
      }

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

  const mostrarMensagem = (texto: string) => {
    setMensagemSucesso(texto);
    setTimeout(() => setMensagemSucesso(""), 3000);
  };

  const buscarPosicaoDoUsuario = async (userId: string): Promise<string> => {
    // 1. Tenta ler da tabela perfis
    const { data: perfil } = await supabase
      .from("perfis")
      .select("posicao")
      .eq("usuario_id", userId)
      .single();

    if (perfil?.posicao) return perfil.posicao;

    // 2. Fallback: tenta ler do metadata do usuário logado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id === userId && user.user_metadata?.position) {
      return user.user_metadata.position;
    }

    return "Curinga";
  };

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
      if (jaConfirmou.status_confirmacao === "presenca") {
        await supabase.from("jogadores_peladas").delete().eq("id", jaConfirmou.id);
        mostrarMensagem("Sua presença foi cancelada.");
      } else {
        const posicao = await buscarPosicaoDoUsuario(user.id);
        await supabase
          .from("jogadores_peladas")
          .update({
            status_confirmacao: "presenca",
            confirmou: true,
            confirmou_em: new Date().toISOString(),
            posicao,
          })
          .eq("id", jaConfirmou.id);
        mostrarMensagem("Você confirmou sua presença nesta partida! ⚽");
      }
    } else {
      const nomeExibicao = user.user_metadata?.nickname || user.email?.split("@")[0] || "Jogador";
      const posicao = await buscarPosicaoDoUsuario(user.id);

      await supabase.from("jogadores_peladas").insert({
        pelada_id: peladaId,
        usuario_id: user.id,
        nome: nomeExibicao,
        confirmou: true,
        pagou: false,
        status_confirmacao: "presenca",
        confirmou_em: new Date().toISOString(),
        posicao,
      });
      mostrarMensagem("Você confirmou sua presença nesta partida! ⚽");
    }

    const { data } = await supabase.from("jogadores_peladas").select("*").eq("pelada_id", peladaId);
    if (data) setJogadores(data);

    setConfirming(false);
  };

  const handleConfirmarAusencia = async () => {
    if (!peladaId || !currentUserId) return;

    setConfirming(true);

    const jaConfirmou = jogadores.find((j) => j.usuario_id === currentUserId);

    if (jaConfirmou) {
      await supabase
        .from("jogadores_peladas")
        .update({
          status_confirmacao: "ausencia",
          confirmou: false,
          confirmou_em: new Date().toISOString(),
        })
        .eq("id", jaConfirmou.id);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const nomeExibicao = user?.user_metadata?.nickname || user?.email?.split("@")[0] || "Jogador";

      await supabase.from("jogadores_peladas").insert({
        pelada_id: peladaId,
        usuario_id: currentUserId,
        nome: nomeExibicao,
        confirmou: false,
        pagou: false,
        status_confirmacao: "ausencia",
        confirmou_em: new Date().toISOString(),
        posicao: await buscarPosicaoDoUsuario(currentUserId),
      });
    }

    mostrarMensagem("Você confirmou sua ausência. Os avulsos podem acompanhar as vagas.");

    const { data } = await supabase.from("jogadores_peladas").select("*").eq("pelada_id", peladaId);
    if (data) setJogadores(data);

    setConfirming(false);
  };

  const _handleTogglePagamento = async (jogadorId: string, statusAtual: boolean) => {
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
    const confirmados = jogadores.filter((j) => j.confirmou && j.status_confirmacao === "presenca");
    if (confirmados.length < 2 || !pelada) return;

    setDividindo(true);

    const jogadoresComPosicao: { jogador: Jogador; posicao: string }[] = [];

    for (const j of confirmados) {
      const posicao = j.posicao || (await buscarPosicaoDoUsuario(j.usuario_id));
      jogadoresComPosicao.push({ jogador: j, posicao });
    }

    const goleiros = jogadoresComPosicao.filter((j) => j.posicao === "Goleiro");
    const linha = jogadoresComPosicao.filter((j) => j.posicao !== "Goleiro");

    const linhaEmbaralhada = shuffleArray(linha.map((j) => j.jogador));

    const times: Jogador[][] = Array.from({ length: pelada.quantidade_times }, () => []);
    linhaEmbaralhada.forEach((jogador, index) => {
      times[index % pelada.quantidade_times].push(jogador);
    });

    goleiros.forEach((g, index) => {
      if (index < pelada.quantidade_times) {
        times[index].unshift(g.jogador);
      }
    });

    setTimeA(times[0] || []);
    setTimeB(times[1] || []);

    setDividindo(false);
  };

  const totalConfirmados = jogadores.filter(
    (j) => j.confirmou && j.status_confirmacao === "presenca",
  ).length;
  const totalPagantes = jogadores.filter((j) => j.pagou).length;
  const totalEsperado = totalConfirmados * valorPorJogador;
  const totalArrecadado = totalPagantes * valorPorJogador;
  const faltaArrecadar = totalEsperado - totalArrecadado;

  const jaConfirmou = currentUserId
    ? jogadores.some((j) => j.usuario_id === currentUserId && j.status_confirmacao === "presenca")
    : false;
  const jaConfirmouAusencia = currentUserId
    ? jogadores.some((j) => j.usuario_id === currentUserId && j.status_confirmacao === "ausencia")
    : false;

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

              <AnimatePresence>
                {mensagemSucesso && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium p-3 rounded-lg text-center"
                  >
                    {mensagemSucesso}
                  </motion.div>
                )}
              </AnimatePresence>

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
                    dataHora={pelada.data_hora}
                  />
                )}

                <div className="space-y-2">
                  <motion.button
                    type="button"
                    onClick={handleConfirmar}
                    disabled={confirming}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full font-bold py-3 rounded-lg shadow-md disabled:opacity-50 flex justify-center items-center gap-2 text-sm ${
                      jaConfirmou
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-pelada-yellow text-pelada-blue hover:bg-yellow-400"
                    }`}
                  >
                    {confirming ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      />
                    ) : jaConfirmou ? (
                      "Cancelar Presença"
                    ) : (
                      "Confirmar Presença"
                    )}
                  </motion.button>

                  {ehMensalista && !jaConfirmou && !jaConfirmouAusencia && (
                    <motion.button
                      type="button"
                      onClick={handleConfirmarAusencia}
                      disabled={confirming}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gray-100 text-gray-700 font-bold py-2 rounded-lg shadow-sm hover:bg-gray-200 disabled:opacity-50 flex justify-center items-center gap-2 text-xs"
                    >
                      {confirming ? "..." : "Confirmar Ausência (Mensalista)"}
                    </motion.button>
                  )}

                  {jaConfirmouAusencia && (
                    <p className="text-xs text-center text-gray-500 italic">
                      Você confirmou sua ausência.
                    </p>
                  )}

                  <motion.button
                    type="button"
                    onClick={handleDividirTimes}
                    disabled={dividindo || totalConfirmados < 2}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-pelada-blue text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-50 flex justify-center items-center gap-2 text-sm"
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
