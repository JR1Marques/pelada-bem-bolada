import { useState, useEffect } from 'react';
import { GameCard } from './components/GameCard';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula uma requisição ao backend (Supabase)
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto">
      <header className="mb-8 text-center">
        <img src="/brasao.png" alt="Pelada Bem Bolada" className="w-28 h-28 mx-auto mb-3 drop-shadow-md" />
        <h1 className="text-3xl font-extrabold text-pelada-blue tracking-tight">Pelada Bem Bolada</h1>
        <p className="text-pelada-yellow font-semibold mt-1">Confirma, divide e joga!</p>
      </header>

      <section className="space-y-4">
        {loading ? (
          <>
            <GameCard title="" date="" players={0} isLoading={true} />
            <GameCard title="" date="" players={0} isLoading={true} />
          </>
        ) : (
          <>
            <GameCard title="Rachão da Galera" date="Terça, 15/09 às 20:00" players={14} />
            <GameCard title="Pelada dos Veteranos" date="Quinta, 17/09 às 19:30" players={8} />
          </>
        )}
      </section>
    </main>
  );
}

export default App;