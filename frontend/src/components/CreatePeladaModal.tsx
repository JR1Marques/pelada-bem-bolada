import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "../lib/supabase";

interface CreatePeladaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePeladaModal = ({ isOpen, onClose, onSuccess }: CreatePeladaModalProps) => {
  const [titulo, setTitulo] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [local, setLocal] = useState("");
  const [valor, setValor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

    const { error: dbError } = await supabase.from("peladas").insert({
      titulo,
      data_hora: new Date(dataHora).toISOString(),
      local,
      valor_por_jogador: valor ? parseFloat(valor) : 0,
      criado_por: user.id,
      grupo_id: grupoPadrao?.id || null,
    });

    if (dbError) {
      setError(dbError.message);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      onSuccess();
      onClose();
      setTitulo("");
      setDataHora("");
      setLocal("");
      setValor("");
    }
  };

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
                    Data e Hora
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
                      Salvando...
                    </>
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
