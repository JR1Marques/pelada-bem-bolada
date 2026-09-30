import { motion } from "framer-motion";

interface GameCardProps {
  title: string;
  date: string;
  dataHoraIso?: string; // Novo prop para calcular o limite
  players: number;
  isLoading?: boolean;
  recorrencia?: string;
  onClick?: () => void;
}

export const GameCard = ({
  title,
  date,
  dataHoraIso,
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

  // Calcula o horário limite (60 minutos antes)
  const getHorarioLimite = () => {
    if (!dataHoraIso) return null;
    const data = new Date(dataHoraIso);
    data.setMinutes(data.getMinutes() - 60);
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const horarioLimite = getHorarioLimite();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md p-5 cursor-pointer border border-gray-100 hover:border-pelada-blue transition-colors relative"
    >
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

      {horarioLimite && (
        <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold mb-2 bg-orange-50 w-fit px-2 py-1 rounded-md">
          <span>⏰</span>
          <span>Confirmações até: {horarioLimite}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>👥</span>
        <span>
          {players} {players === 1 ? "jogador confirmado" : "jogadores confirmados"}
        </span>
      </div>
    </motion.div>
  );
};
