import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Membro {
  usuario_id: string;
  nome: string;
  posicao: string;
  media_estrelas: number;
  categoria: string;
  papel: string;
}

export const CardsTab = () => {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ehAdmin, setEhAdmin] = useState(false);
  const [avaliando, setAvaliando] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data: grupo } = await supabase.from("grupos").select("id").limit(1).single();

      if (grupo && user) {
        // Verifica se é admin
        const { data: meuMembro } = await supabase
          .from("membros_grupo")
          .select("papel")
          .eq("grupo_id", grupo.id)
          .eq("usuario_id", user.id)
          .single();

        setEhAdmin(meuMembro?.papel === "admin" || meuMembro?.papel === "co-admin");

        // Busca membros
        const { data: membrosSimples } = await supabase
          .from("membros_grupo")
          .select("usuario_id, categoria, papel")
          .eq("grupo_id", grupo.id)
          .eq("status", "aprovado");

        if (membrosSimples) {
          const membrosComDetalhes: Membro[] = [];

          for (const m of membrosSimples) {
            const { data: jogadorData } = await supabase
              .from("jogadores_peladas")
              .select("nome")
              .eq("usuario_id", m.usuario_id)
              .limit(1)
              .single();
            const nome = jogadorData?.nome || "Jogador";

            const { data: avaliacoes } = await supabase
              .from("avaliacoes")
              .select("estrelas")
              .eq("avaliado_id", m.usuario_id)
              .eq("grupo_id", grupo.id);
            const total =
              avaliacoes?.reduce(
                (acc: number, curr: { estrelas: number }) => acc + curr.estrelas,
                0,
              ) || 0;
            const count = avaliacoes?.length || 0;
            const media = count > 0 ? total / count : 0;

            membrosComDetalhes.push({
              usuario_id: m.usuario_id,
              nome,
              posicao: "Curinga",
              media_estrelas: media,
              categoria: m.categoria || "comum",
              papel: m.papel || "membro",
            });
          }
          setMembros(membrosComDetalhes);
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleAvaliar = async (avaliadoId: string, estrelas: number) => {
    if (!currentUserId) return;
    setAvaliando(avaliadoId);

    const { data: grupo } = await supabase.from("grupos").select("id").limit(1).single();

    await supabase.from("avaliacoes").upsert(
      {
        avaliador_id: currentUserId,
        avaliado_id: avaliadoId,
        grupo_id: grupo.id,
        estrelas,
      },
      { onConflict: "avaliador_id,avaliado_id,grupo_id" },
    );

    const { data: avaliacoes } = await supabase
      .from("avaliacoes")
      .select("estrelas")
      .eq("avaliado_id", avaliadoId)
      .eq("grupo_id", grupo.id);
    const total =
      avaliacoes?.reduce((acc: number, curr: { estrelas: number }) => acc + curr.estrelas, 0) || 0;
    const count = avaliacoes?.length || 0;
    const novaMedia = count > 0 ? total / count : 0;

    setMembros((prev) =>
      prev.map((m) => (m.usuario_id === avaliadoId ? { ...m, media_estrelas: novaMedia } : m)),
    );
    setAvaliando(null);
  };

  const handleMudarCategoria = async (usuarioId: string, novaCategoria: string) => {
    const { data: grupo } = await supabase.from("grupos").select("id").limit(1).single();

    await supabase
      .from("membros_grupo")
      .update({ categoria: novaCategoria })
      .eq("grupo_id", grupo.id)
      .eq("usuario_id", usuarioId);

    setMembros((prev) =>
      prev.map((m) => (m.usuario_id === usuarioId ? { ...m, categoria: novaCategoria } : m)),
    );
  };

  const formatarCategoria = (cat: string) => {
    if (cat === "mensalista") return "Mensalista";
    if (cat === "premium") return "Avulso Premium";
    return "Avulso Comum";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-pelada-blue">Cards da Galera</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : membros.length === 0 ? (
        <p className="text-gray-500 text-center py-10">Nenhum membro no grupo ainda.</p>
      ) : (
        membros.map((membro) => (
          <motion.div
            key={membro.usuario_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800 capitalize">{membro.nome}</h3>
                {membro.papel === "admin" && (
                  <span className="text-xs bg-pelada-yellow text-pelada-blue px-2 py-0.5 rounded-full font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{membro.posicao}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-sm font-semibold text-gray-700">
                  {membro.media_estrelas.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {ehAdmin && membro.usuario_id !== currentUserId && (
                <select
                  value={membro.categoria}
                  onChange={(e) => handleMudarCategoria(membro.usuario_id, e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-pelada-blue outline-none"
                >
                  <option value="mensalista">Mensalista</option>
                  <option value="premium">Avulso Premium</option>
                  <option value="comum">Avulso Comum</option>
                </select>
              )}
              {!ehAdmin && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">
                  {formatarCategoria(membro.categoria)}
                </span>
              )}

              {membro.usuario_id !== currentUserId && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((estrela) => (
                    <motion.button
                      key={estrela}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAvaliar(membro.usuario_id, estrela)}
                      disabled={avaliando === membro.usuario_id}
                      className={`text-xl transition-colors ${
                        estrela <= Math.round(membro.media_estrelas)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};
