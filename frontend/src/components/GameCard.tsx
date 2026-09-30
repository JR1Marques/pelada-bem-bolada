import { motion } from "framer-motion";

interface GameCardProps {
  title: string;
  date: string;
  players: number;
  isLoading?: boolean;
  recorrencia?: string;
  onClick?: () => void;
}

export const GameCard = ({
  title,
  date,
  players,
  isLoading,
  recorrencia,
  onClick,
}: GameCardProps) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-md p-5 animate-pulse"
      >
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md p-5 cursor-pointer border border-gray-100 hover:border-pelada-blue transition-colors relative"
    >
      {/* Selo de Recorrência */}
      {recorrencia && (
        <div className="absolute top-3 right-3 bg-pelada-blue text-white text-xs font-bold px-2 py-1 rounded-full">
          🔄 {recorrencia}
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-800 mb-2 capitalize">{title}</h3>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
        <span>📅</span>
        <span>{date}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>👥</span>
        <span>
          {players} {players === 1 ? "jogador confirmado" : "jogadores confirmados"}
        </span>
      </div>
    </motion.div>
  );
};
