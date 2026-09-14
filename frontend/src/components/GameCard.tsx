import { motion } from 'framer-motion';

interface GameCardProps {
  title: string;
  date: string;
  players: number;
  isLoading?: boolean;
}

export const GameCard = ({ title, date, players, isLoading = false }: GameCardProps) => {
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
      >
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer"
    >
      <h3 className="text-lg font-bold text-pelada-blue mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{date}</p>
      <span className="inline-block bg-pelada-yellow text-pelada-blue text-xs font-bold px-3 py-1 rounded-full">
        {players} jogadores
      </span>
    </motion.div>
  );
};