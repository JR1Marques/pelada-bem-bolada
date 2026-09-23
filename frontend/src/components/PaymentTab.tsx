import { motion } from "framer-motion";

export const PaymentTab = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-pelada-blue">Meu Pagamento</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          💳
        </div>
        <h3 className="font-bold text-gray-800 mb-2">Confirmação de Pagamento</h3>
        <p className="text-sm text-gray-500 mb-4">
          Em breve você poderá confirmar seu pagamento e enviar comprovantes diretamente por aqui.
        </p>
        <span className="inline-block text-xs bg-pelada-yellow text-pelada-blue px-3 py-1 rounded-full font-bold">
          Em breve
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
      >
        <h4 className="font-bold text-gray-700 mb-2 text-sm">Como vai funcionar:</h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex gap-2">
            <span className="text-pelada-blue font-bold">1.</span>
            Você confirma sua presença na pelada.
          </li>
          <li className="flex gap-2">
            <span className="text-pelada-blue font-bold">2.</span>
            Envia o comprovante de pagamento por aqui.
          </li>
          <li className="flex gap-2">
            <span className="text-pelada-blue font-bold">3.</span>O administrador recebe e confirma
            o pagamento.
          </li>
        </ul>
      </motion.div>
    </div>
  );
};
