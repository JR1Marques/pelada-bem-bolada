import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface PeladaDetailsModalProps {
  peladaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface Jogador {
  id: string;
  nome: string;
  confirmou: boolean;
  pagou: boolean;
}

export const PeladaDetailsModal = ({ peladaId, isOpen, onClose }: PeladaDetailsModalProps) => {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (isOpen && peladaId) {
      fetchJogadores();
    }
  }, [isOpen, peladaId]);

  const fetchJogadores = async () => {
    if (!peladaId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('jogadores_peladas')
      .select('*')
      .eq('pelada_id', peladaId);

    if (!error && data) {
      setJogadores(data);
    }
    setLoading(false);
  };

  const handleConfirmar = async () => {
    if (!peladaId) return;
    
    setConfirming(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setConfirming(false);
      return;
    }

    // Verifica se já está na lista
    const jaConfirmou = jogadores.find(j => j.usuario_id === user.id);

    if (jaConfirmou) {
      // Remove o jogador (desfazer confirmação)
      await supabase
        .from('jogadores_peladas')
        .delete()
        .eq('id', jaConfirmou.id);
    } else {
      // Adiciona o jogador
      await supabase
        .from('jogadores_peladas')
        .insert({
          pelada_id: peladaId,
          usuario_id: user.id,
          nome: user.email || 'Jogador',
          confirmou: true,
          pagou: false,
        });
    }

    await fetchJogadores(); // Atualiza a lista
    setConfirming(false);
  };

  const jaConfirmou = jogadores.some(j => j.usuario_id === 'current-user-id'); // Simplificado para demonstração

  return (
    <AnimatePresence>
      {isOpen && peladaId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-x-4 bottom-4 top-auto md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6 max-h-[90vh] overflow-y-auto"
          >
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

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Jogadores Confirmados</h3>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : jogadores.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum jogador confirmado ainda.</p>
                ) : (
                  <ul className="space-y-2">
                    {jogadores.map(jogador => (
                      <li key={jogador.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">{jogador.nome}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Confirmou
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <motion.button
                type="button"
                onClick={handleConfirmar}
                disabled={confirming}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-pelada-yellow text-pelada-blue font-bold py-3 rounded-lg shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {confirming ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-5 h-5 border-2 border-pelada-blue border-t-transparent rounded-full"
                  />
                ) : (
                  'Confirmar Presença'
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};