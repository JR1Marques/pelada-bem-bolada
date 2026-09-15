import type { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { GameCard } from "./components/GameCard";
import { Login } from "./components/Login";
import { supabase } from "./lib/supabase";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  if (!session) {
    return <Login />;
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto">
      <header className="mb-8 text-center">
        <img
          src="/brasao.png"
          alt="Pelada Bem Bolada"
          className="w-28 h-28 mx-auto mb-3 drop-shadow-md"
        />
        <h1 className="text-3xl font-extrabold text-pelada-blue tracking-tight">
          Pelada Bem Bolada
        </h1>
        <p className="text-pelada-yellow font-semibold mt-1">Confirma, divide e joga!</p>
      </header>

      <section className="space-y-4">
        <GameCard title="Rachão da Galera" date="Terça, 15/09 às 20:00" players={14} />
        <GameCard title="Pelada dos Veteranos" date="Quinta, 17/09 às 19:30" players={8} />
      </section>
    </main>
  );
}

export default App;
