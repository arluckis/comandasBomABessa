import { supabase } from '@/lib/supabase';
import MenuClient from './MenuClient';

export const dynamic = 'force-dynamic';

export default async function PaginaCardapio({ params, searchParams }) {
  // Next.js 15: params e searchParams são Promises
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const resolvedSearchParams = await searchParams;
  const mesa = resolvedSearchParams?.mesa;

  // 1. Busca Cardápio
  const { data: cardapio } = await supabase
    .from('cardapios')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!cardapio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white font-sans">
        <div className="flex flex-col items-center gap-4 opacity-50">
          <span className="text-5xl">🍽️</span>
          <h1 className="text-xl font-medium tracking-tight">Experiência indisponível</h1>
        </div>
      </div>
    );
  }

  // 2. Busca Empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', cardapio.empresa_id)
    .maybeSingle();

  // 3. Busca Produtos
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, categorias(nome)')
    .eq('empresa_id', cardapio.empresa_id);

  // 4. Agrupa Produtos por Categoria
  const categorias = (produtos || []).reduce((acc, curr) => {
    const nomeCategoria = curr.categorias?.nome || 'Geral';
    if (!acc[nomeCategoria]) acc[nomeCategoria] = [];
    acc[nomeCategoria].push(curr);
    return acc;
  }, {});

  // Passa tudo para o motor visual interativo (Client Component)
  return (
    <MenuClient 
      cardapio={cardapio} 
      empresa={empresa} 
      categorias={categorias} 
      mesa={mesa} 
    />
  );
}