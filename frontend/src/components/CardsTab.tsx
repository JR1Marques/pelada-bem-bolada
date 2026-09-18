import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Membro {
  usuario_id: string;
  nome: string;
  posicao: string;
  media_estrelas: number;
}

export const CardsTab = () => {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [avaliando, setAvaliando] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Busca membros do grupo padrão e suas médias de estrelas
      const { data: grupo } = await supabase.from("grupos").select("id").limit(1).single();

      if (grupo && user) {
        const { data: membrosData } = await supabase
          .from("membros_grupo")
          .select("usuario_id, auth:usuario_id(nickname, position)") // Puxa do metadata via RPC ou simplificado
          .eq("grupo_id", grupo.id)
          .eq("status", "aprovado");

        // Como o join direto com auth.users é restrito, vamos buscar os perfis e avaliações separadamente para simplificar
        const { data: membrosSimples } = await supabase
          .from("membros_grupo")
          .select("usuario_id")
          .eq("grupo_id", grupo.id)
          .eq("status", "aprovado");

        if (membrosSimples) {
          const membrosComDetalhes: Membro[] = [];

          for (const m of membrosSimples) {
            const { data: userData } = await supabase.auth.admin.getUserById(m.usuario_id); // Nota: em produção usamos uma Edge Function ou RPC, mas para MVP local funciona se tiver permissão, senão usamos o metadata do usuário logado.
            // Para simplificar e evitar erros de permissão do admin, vamos usar o que temos no banco de avaliações e perfis.

            // Busca o nome (nickname) via uma query simples na tabela de peladas onde ele jogou, ou usamos o email.
            // *Simplificação para o MVP*: Vamos buscar o nome na tabela `jogadores_peladas` ou usar o email.
            const { data: jogadorData } = await supabase
              .from("jogadores_peladas")
              .select("nome")
              .eq("usuario_id", m.usuario_id)
              .limit(1)
              .single();
            const nome = jogadorData?.nome || "Jogador";

            // Busca a posição no metadata (via uma função RPC seria o ideal, aqui vamos pular a posição por enquanto para não travar)

            // Calcula média de estrelas
            const { data: avaliacoes } = await supabase
              .from("avaliacoes")
              .select("estrelas")
              .eq("avaliado_id", m.usuario_id)
              .eq("grupo_id", grupo.id);
            const total = avaliacoes?.reduce((acc, curr) => acc + curr.estrelas, 0) || 0;
            const count = avaliacoes?.length || 0;
            const media = count > 0 ? total / count : 0;

            membrosComDetalhes.push({
              usuario_id: m.usuario_id,
              nome,
              posicao: "Curinga", // Placeholder até ajustarmos a query de metadata
              media_estrelas: media,
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

    // Recarrega para atualizar a média
    const { data: avaliacoes } = await supabase
      .from("avaliacoes")
      .select("estrelas")
      .eq("avaliado_id", avaliadoId)
      .eq("grupo_id", grupo.id);
    const total = avaliacoes?.reduce((acc, curr) => acc + curr.estrelas, 0) || 0;
    const count = avaliacoes?.length || 0;
    const novaMedia = count > 0 ? total / count : 0;

    setMembros((prev) =>
      prev.map((m) => (m.usuario_id === avaliadoId ? { ...m, media_estrelas: novaMedia } : m)),
    );
    setAvaliando(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-pelada-blue mb-4">Cards da Galera</h2>
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
            <div>
              <h3 className="font-bold text-gray-800 capitalize">{membro.nome}</h3>
              <p className="text-xs text-gray-500">{membro.posicao}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-sm font-semibold text-gray-700">
                  {membro.media_estrelas.toFixed(1)}
                </span>
              </div>
            </div>

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
                    className={`text-2xl transition-colors ${
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
          </motion.div>
        ))
      )}
    </div>
  );
};
