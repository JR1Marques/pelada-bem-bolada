import { motion } from "framer-motion";
import { useState } from "react";
import { GroupSettingsModal } from "./GroupSettingsModal";

export const AdminTab = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-pelada-blue">Área do Administrador</h2>
      </div>

      {/* Configurações do Grupo */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsSettingsOpen(true)}
        className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 text-left hover:border-pelada-blue transition-colors"
      >
        <div className="w-12 h-12 bg-pelada-blue/10 rounded-lg flex items-center justify-center text-2xl">
          ⚙️
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">Configurações do Grupo</h3>
          <p className="text-sm text-gray-500">Valores, categorias e regras financeiras</p>
        </div>
        <span className="text-gray-400 text-xl">›</span>
      </motion.button>

      {/* Agendamento de Partidas (Placeholder) */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 opacity-70"
      >
        <div className="w-12 h-12 bg-pelada-yellow/20 rounded-lg flex items-center justify-center text-2xl">
          📅
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">Agendamento de Partidas</h3>
          <p className="text-sm text-gray-500">
            Criar peladas, definir cotas e gerenciar lista de espera
          </p>
          <span className="inline-block mt-1 text-xs bg-pelada-yellow text-pelada-blue px-2 py-0.5 rounded-full font-bold">
            Em breve
          </span>
        </div>
        <span className="text-gray-400 text-xl">›</span>
      </motion.div>

      {/* Controle Financeiro (Placeholder) */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 opacity-70"
      >
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
          💰
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">Controle Financeiro</h3>
          <p className="text-sm text-gray-500">Receber comprovantes e confirmar pagamentos</p>
          <span className="inline-block mt-1 text-xs bg-pelada-yellow text-pelada-blue px-2 py-0.5 rounded-full font-bold">
            Em breve
          </span>
        </div>
        <span className="text-gray-400 text-xl">›</span>
      </motion.div>

      <GroupSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
