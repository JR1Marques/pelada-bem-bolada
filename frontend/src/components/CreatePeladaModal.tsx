import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface CreatePeladaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RecorrenciaType = "nenhuma" | "semanal" | "quinzenal" | "mensal";

export const CreatePeladaModal = ({ isOpen, onClose, onSuccess }: CreatePeladaModalProps) => {
  const [titulo, setTitulo] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [local, setLocal] = useState("");
  const [valor, setValor] = useState("");
  const [vagasGoleiros, setVagasGoleiros] = useState("2");
  const [vagasLinha, setVagasLinha] = useState("15");
  const [quantidadeTimes, setQuantidadeTimes] = useState("2");
  const [recorrencia, setRecorrencia] = useState<RecorrenciaType>("nenhuma");
  const [diaSemana, setDiaSemana] = useState("4");
  const [dataFimRecurrencia, setDataFimRecurrencia] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitulo("");
      setDataHora("");
      setLocal("");
      setValor("");
      setVagasGoleiros("2");
      setVagasLinha("15");
      setQuantidadeTimes("2");
      setRecorrencia("nenhuma");
      setDiaSemana("4");
      setDataFimRecurrencia("");
      setError("");
    }
  }, [isOpen]);

  const gerarDatasRecorrentes = (
    dataInicial: Date,
    recorrencia: RecorrenciaType,
    _diaSemana: number,
    dataFim: Date | null,
  ): Date[] => {
    const datas: Date[] = [dataInicial];
    const dataAtual = new Date(dataInicial);

    const limiteOcorrencias = 52;
    const limiteData = new Date();
    limiteData.setFullYear(limiteData.getFullYear() + 1);

    while (datas.length < limiteOcorrencias && dataAtual < limiteData) {
      if (recorrencia === "semanal") {
        dataAtual.setDate(dataAtual.getDate() + 7);
      } else if (recorrencia === "quinzenal") {
        dataAtual.setDate(dataAtual.getDate() + 14);
      } else if (recorrencia === "mensal") {
        dataAtual.setMonth(dataAtual.getMonth() + 1);
      } else {
        break;
      }

      if (dataFim && dataAtual > dataFim) {
        break;
      }

      dataAtual.setHours(dataInicial.getHours(), dataInicial.getMinutes(), 0, 0);
      datas.push(new Date(dataAtual));
    }

    return datas;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado.");
      setIsLoading(false);
      return;
    }

    const { data: grupoPadrao } = await supabase.from("grupos").select("id").limit(1).single();

    if (!grupoPadrao) {
      setError("Grupo não encontrado.");
      setIsLoading(false);
      return;
    }

    try {
      const dataInicial = new Date(dataHora);
      const dataFim = dataFimRecurrencia ? new Date(dataFimRecurrencia) : null;

      const grupoRecurrenciaId = recorrencia !== "nenhuma" ? crypto.randomUUID() : null;

      const datas =
        recorrencia !== "nenhuma"
          ? gerarDatasRecorrentes(dataInicial, recorrencia, parseInt(diaSemana, 10), dataFim)
          : [dataInicial];

      const peladasParaInserir = datas.map((data) => ({
        titulo,
        data_hora: data.toISOString(),
        local,
        valor_por_jogador: valor ? parseFloat(valor) : 0,
        criado_por: user.id,
        grupo_id: grupoPadrao.id,
        vagas_goleiros: parseInt(vagasGoleiros, 10) || 2,
        vagas_linha: parseInt(vagasLinha, 10) || 15,
        quantidade_times: parseInt(quantidadeTimes, 10) || 2,
        recorrencia,
        dia_semana: recorrencia !== "nenhuma" ? parseInt(diaSemana, 10) : null,
        data_fim_recurrencia: dataFim ? dataFim.toISOString().split("T")[0] : null,
        grupo_recurrencia_id: grupoRecurrenciaId,
      }));

      const { error: dbError } = await supabase.from("peladas").insert(peladasParaInserir);

      if (dbError) {
        setError(dbError.message);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        onSuccess();
        onClose();
      }
    } catch {
      setError("Erro ao criar pelada. Tente novamente.");
      setIsLoading(false);
    }
  };

  const diasSemana = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
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
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-pelada-blue">Nova Pelada</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                    Título da Pelada
                  </label>
                  <input
                    id="titulo"
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Rachão da Galera"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dataHora"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Data e Hora da Primeira Partida
                  </label>
                  <input
                    id="dataHora"
                    type="datetime-local"
                    required
                    value={dataHora}
                    onChange={(e) => setDataHora(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="local" className="block text-sm font-medium text-gray-700 mb-1">
                    Local
                  </label>
                  <input
                    id="local"
                    type="text"
                    required
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Quadra do Condomínio"
                  />
                </div>

                <div>
                  <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
                    Valor por Jogador (R$)
                  </label>
                  <input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label
                    htmlFor="recorrencia"
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Frequência
                  </label>
                  <select
                    id="recorrencia"
                    value={recorrencia}
                    onChange={(e) => setRecorrencia(e.target.value as RecorrenciaType)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue outline-none bg-white"
                  >
                    <option value="nenhuma">Partida única</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>

                  {recorrencia !== "nenhuma" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 mt-3"
                    >
                      <div>
                        <label
                          htmlFor="diaSemana"
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Dia da Semana
                        </label>
                        <select
                          id="diaSemana"
                          value={diaSemana}
                          onChange={(e) => setDiaSemana(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue outline-none bg-white text-sm"
                        >
                          {diasSemana.map((dia) => (
                            <option key={dia.value} value={dia.value}>
                              {dia.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="dataFim"
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Repetir até (opcional)
                        </label>
                        <input
                          id="dataFim"
                          type="date"
                          value={dataFimRecurrencia}
                          onChange={(e) => setDataFimRecurrencia(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue outline-none text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Deixe em branco para repetir por 1 ano.
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
                        💡 O sistema criará automaticamente todas as partidas da série. O dashboard
                        mostrará apenas a próxima.
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Configuração de Vagas</h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="vagasGoleiros"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Goleiros
                      </label>
                      <input
                        id="vagasGoleiros"
                        type="number"
                        min="1"
                        value={vagasGoleiros}
                        onChange={(e) => setVagasGoleiros(e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue outline-none text-center text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="vagasLinha"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Linha
                      </label>
                      <input
                        id="vagasLinha"
                        type="number"
                        min="1"
                        value={vagasLinha}
                        onChange={(e) => setVagasLinha(e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue outline-none text-center text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="quantidadeTimes"
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Times
                      </label>
                      <input
                        id="quantidadeTimes"
                        type="number"
                        min="2"
                        value={quantidadeTimes}
                        onChange={(e) => setQuantidadeTimes(e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue outline-none text-center text-sm"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-pelada-blue text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Criando...
                    </>
                  ) : recorrencia !== "nenhuma" ? (
                    `Criar Série de Peladas`
                  ) : (
                    "Criar Pelada"
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
