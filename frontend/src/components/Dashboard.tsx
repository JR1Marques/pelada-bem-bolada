import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AdminTab } from "./AdminTab";
import { CardsTab } from "./CardsTab";
import { CreatePeladaModal } from "./CreatePeladaModal";
import { GameCard } from "./GameCard";
import { PaymentTab } from "./PaymentTab";
import { PeladaDetailsModal } from "./PeladaDetailsModal";
import { ProfileModal } from "./ProfileModal";

interface Pelada {
  id: string;
  titulo: string;
  data_hora: string;
  local: string;
  valor_por_jogador: number;
  recorrencia: string;
  grupo_recurrencia_id: string | null;
  jogadores_peladas?: { confirmou: boolean; pagou: boolean; usuario_id: string }[];
}

type TabType = "peladas" | "cards" | "admin" | "pagamento";

export const Dashboard = () => {
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPeladaId, setSelectedPeladaId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userNickname, setUserNickname] = useState("Jogador");
  const [activeTab, setActiveTab] = useState<TabType>("peladas");
  const [ehAdmin, setEhAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.user_metadata?.nickname) {
        setUserNickname(user.user_metadata.nickname);
      } else if (user?.email) {
        setUserNickname(user.email.split("@")[0]);
      }

      // Verifica se é admin
      const { data: grupo } = await supabase.from("grupos").select("id").limit(1).single();
      if (grupo && user) {
        const { data: meuMembro } = await supabase
          .from("membros_grupo")
          .select("papel")
          .eq("grupo_id", grupo.id)
          .eq("usuario_id", user.id)
          .single();
        setEhAdmin(meuMembro?.papel === "admin" || meuMembro?.papel === "co-admin");
      }

      // Busca peladas futuras (a partir de agora)
      const agora = new Date().toISOString();
      const { data, error } = await supabase
        .from("peladas")
        .select("*, jogadores_peladas(confirmou, pagou, usuario_id)")
        .gte("data_hora", agora)
        .order("data_hora", { ascending: true });

      if (!error && data) {
        // Filtrar: para cada grupo_recurrencia_id, manter apenas a PRÓXIMA pelada
        const gruposRecorrentesVistos = new Set<string>();
        const peladasFiltradas: Pelada[] = [];

        for (const pelada of data) {
          if (pelada.grupo_recurrencia_id) {
            // É parte de uma série recorrente
            if (gruposRecorrentesVistos.has(pelada.grupo_recurrencia_id)) {
              // Já vimos essa série, pular
              continue;
            }
            gruposRecorrentesVistos.add(pelada.grupo_recurrencia_id);
          }
          peladasFiltradas.push(pelada);
        }

        setPeladas(peladasFiltradas);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const tabs: { key: TabType; label: string; show: boolean }[] = [
    { key: "peladas", label: "Peladas", show: true },
    { key: "cards", label: "Cards", show: true },
    { key: "admin", label: "Admin", show: ehAdmin },
    { key: "pagamento", label: "Pagamento", show: !ehAdmin },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  const formatarRecorrencia = (rec: string) => {
    if (rec === "semanal") return "Semanal";
    if (rec === "quinzenal") return "Quinzenal";
    if (rec === "mensal") return "Mensal";
    return null;
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 max-w-md mx-auto relative"
    >
      <header className="flex justify-between items-center mb-6">

        /* NOVA LINHA: Número da versão visível no topo direito */}
        <span className="absolute top-0 right-0 text-[10px] text-gray-400 font-mono bg-gray-100 px-1 rounded">
          BUILD: v.14
        </span>

        <div className="flex items-center gap-3">
          <img src="/brasao.png" alt="Logo" className="w-12 h-12 drop-shadow-md" />
          <div>
            <h1 className="text-xl font-extrabold text-pelada-blue">Pelada Bem Bolada</h1>
            <p className="text-xs text-pelada-yellow font-semibold">Confirma, divide e joga!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="text-sm font-semibold text-pelada-blue hover:text-blue-800 transition-colors flex items-center gap-1"
          >
            👤 {userNickname}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Seletor de Abas Dinâmico */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.key ? "bg-white text-pelada-blue shadow-sm" : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === "peladas" && (
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
            peladas.map((pelada) => {
              const totalConfirmados =
                pelada.jogadores_peladas?.filter((j) => j.confirmou).length || 0;

              const recorrenciaLabel = formatarRecorrencia(pelada.recorrencia);

              return (
                <GameCard
                  key={pelada.id}
                  title={pelada.titulo}
                  date={new Date(pelada.data_hora).toLocaleString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  dataHoraIso={pelada.data_hora}
                  players={totalConfirmados}
                  recorrencia={recorrenciaLabel || undefined}
                  onClick={() => setSelectedPeladaId(pelada.id)}
                />
              );
            })
          )}
        </section>
      )}

      {activeTab === "cards" && <CardsTab />}
      {activeTab === "admin" && <AdminTab />}
      {activeTab === "pagamento" && <PaymentTab />}

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
        onSuccess={() => {
          // Recarregar peladas
          const agora = new Date().toISOString();
          supabase
            .from("peladas")
            .select("*, jogadores_peladas(confirmou, pagou, usuario_id)")
            .gte("data_hora", agora)
            .order("data_hora", { ascending: true })
            .then(({ data }) => {
              if (data) {
                const gruposRecorrentesVistos = new Set<string>();
                const peladasFiltradas: Pelada[] = [];

                for (const pelada of data) {
                  if (pelada.grupo_recurrencia_id) {
                    if (gruposRecorrentesVistos.has(pelada.grupo_recurrencia_id)) {
                      continue;
                    }
                    gruposRecorrentesVistos.add(pelada.grupo_recurrencia_id);
                  }
                  peladasFiltradas.push(pelada);
                }

                setPeladas(peladasFiltradas);
              }
            });
        }}
      />

      <PeladaDetailsModal
        peladaId={selectedPeladaId}
        valorPorJogador={peladas.find((p) => p.id === selectedPeladaId)?.valor_por_jogador || 0}
        isOpen={!!selectedPeladaId}
        onClose={() => setSelectedPeladaId(null)}
      />

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </motion.main>
  );
};

export default Dashboard;
