import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState("Curinga");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadProfile = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          setNickname(user.user_metadata.nickname || user.email?.split("@")[0] || "");
          setPosition(user.user_metadata.position || "Curinga");
        }
      };
      loadProfile();
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    const { error } = await supabase.auth.updateUser({
      data: {
        nickname: nickname.trim(),
        position: position,
      },
    });

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500); // Fecha automaticamente após mostrar o sucesso
    }

    setIsLoading(false);
  };

  const positions = ["Goleiro", "Defesa", "Meio-Campo", "Ataque", "Curinga"];

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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-pelada-blue">Meu Perfil</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label
                    htmlFor="nickname"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Apelido na Pelada
                  </label>
                  <input
                    id="nickname"
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Marquinhos, Gordinho, etc."
                  />
                </div>

                <div>
                  <label
                    htmlFor="position"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Posição Preferida
                  </label>
                  <select
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-pelada-blue focus:border-transparent outline-none transition-all bg-white"
                  >
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-lg font-medium"
                  >
                    Perfil salvo com sucesso! ⚽
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading || success}
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
                  ) : success ? (
                    "Salvo!"
                  ) : (
                    "Salvar Perfil"
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
