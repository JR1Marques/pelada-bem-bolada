import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupSettingsModal = ({ isOpen, onClose }: GroupSettingsModalProps) => {
  const [valMensalista, setValMensalista] = useState("0");
  const [valPremium, setValPremium] = useState("0");
  const [valComum, setValComum] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadConfig = async () => {
        const { data: grupo } = await supabase
          .from("grupos")
          .select("configuracoes")
          .limit(1)
          .single();
        if (grupo?.configuracoes) {
          setValMensalista(grupo.configuracoes.valor_mensalista?.toString() || "0");
          setValPremium(grupo.configuracoes.valor_premium?.toString() || "0");
          setValComum(grupo.configuracoes.valor_comum?.toString() || "0");
        }
      };
      loadConfig();
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    const { data: grupo } = await supabase.from("grupos").select("id").limit(1).single();

    const { error } = await supabase
      .from("grupos")
      .update({
        configuracoes: {
          valor_mensalista: parseFloat(valMensalista) || 0,
          valor_premium: parseFloat(valPremium) || 0,
          valor_comum: parseFloat(valComum) || 0,
        },
      })
      .eq("id", grupo?.id);

    if (!error) {
      setSuccess(true);
      setTimeout(onClose, 1500);
    }
    setIsLoading(false);
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
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-pelada-blue">Configurações do Grupo</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label
                    htmlFor="valMensalista"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Valor Mensalista (R$)
                  </label>
                  <input
                    id="valMensalista"
                    type="number"
                    step="0.01"
                    value={valMensalista}
                    onChange={(e) => setValMensalista(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="valPremium"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Valor Avulso Premium (R$)
                  </label>
                  <input
                    id="valPremium"
                    type="number"
                    step="0.01"
                    value={valPremium}
                    onChange={(e) => setValPremium(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="valComum"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Valor Avulso Comum (R$)
                  </label>
                  <input
                    id="valComum"
                    type="number"
                    step="0.01"
                    value={valComum}
                    onChange={(e) => setValComum(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all"
                  />
                </div>

                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-lg font-medium"
                  >
                    Configurações salvas! 💰
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading || success}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-pelada-blue text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
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
                  ) : success ? (
                    "Salvo!"
                  ) : (
                    "Salvar Configurações"
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
