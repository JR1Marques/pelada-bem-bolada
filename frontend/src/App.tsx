import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Login } from "./components/Login";
import { supabase } from "./lib/supabase";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verifica se já existe uma sessão ativa ao carregar o app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuta mudanças no estado de autenticação (login/logout em tempo real)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 3. Limpa o listener quando o componente for desmontado
    return () => subscription.unsubscribe();
  }, []);

  // Tela de carregamento inicial (Skeleton/Spinner global)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-pelada-blue border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Se não houver sessão, exibe a tela de Login
  if (!session) {
    return <Login />;
  }

  // Se houver sessão, exibe o Dashboard principal
  return <Dashboard />;
}

export default App;
