import { supabase } from './supabase'; // Ajuste o path para a sua instância do Supabase

export async function criarCardapio(empresaId, nomeEmpresa) {
  // Gerar slug limpo: "Nome Empresa" -> "nome-empresa"
  const slugBase = (nomeEmpresa || 'catalogo')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  // Sufixo aleatório curto para garantir unicidade na URL
  const sufixo = Math.random().toString(36).substring(2, 6);
  const slugFinal = `${slugBase}-${sufixo}`;

  // Insere no banco na tabela que criamos
  const { data, error } = await supabase
    .from('cardapios')
    .insert([
      { 
        empresa_id: empresaId, 
        slug: slugFinal,
        tema: { corPrimaria: "#18181b", layout: "grid", mostrarPreco: true }
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}