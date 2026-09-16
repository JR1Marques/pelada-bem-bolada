import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { GameCard } from './GameCard';
import { CreatePeladaModal } from './CreatePeladaModal';
import { PeladaDetailsModal } from './PeladaDetailsModal';

interface Pelada {
  id: string;
  titulo: string;
  data_hora: string;
  local: string;
  valor_por_jogador: number;
}

export const Dashboard = () => {
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPeladaId, setSelectedPeladaId] = useState<string | null>(null);

  const fetchPeladas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('peladas')
      .select('*')
      .order('data_hora', { ascending: true });

    if (!error && data) {
      setPeladas(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPeladas();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 max-w-md mx-auto relative"
    >
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <img src="/brasao.png" alt="Logo" className="w-12 h-12 drop-shadow-md" />
          <div>
            <h1 className="text-xl font-extrabold text-pelada-blue">Pelada Bem Bolada</h1>
            <p className="text-xs text-pelada-yellow font-semibold">Confirma, divide e joga!</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          Sair
        </button>
      </header>

      <section className="space-y-4">
        {loading ? (
          <>
            <GameCard title="" date="" players={0} isLoading={true} />
            <GameCard title="" date="" players={0} isLoading={true} />
          </>
        ) : peladas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 text-gray-500"
          >
            <p>Nenhuma pelada marcada ainda.</p>
            <p className="text-sm mt-2">Que tal organizar a primeira?</p>
          </motion.div>
        ) : (
          peladas.map((pelada) => (
            <GameCard
              key={pelada.id}
              title={pelada.titulo}
              date={new Date(pelada.data_hora).toLocaleString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
              players={0}
              onClick={() => setSelectedPeladaId(pelada.id)}
            />
          ))
        )}
      </section>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 bg-pelada-yellow text-pelada-blue font-bold w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl z-30"
        onClick={() => setIsCreateModalOpen(true)}
      >
        +
      </motion.button>

      <CreatePeladaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchPeladas}
      />

      <PeladaDetailsModal
        peladaId={selectedPeladaId}
        isOpen={!!selectedPeladaId}
        onClose={() => setSelectedPeladaId(null)}
      />
    </motion.main>
  );
};