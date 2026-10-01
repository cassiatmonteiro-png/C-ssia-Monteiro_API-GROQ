import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { MaterialItem, SupabaseConfig } from '../types';

const STORAGE_KEY_CONFIG = 'escolarstock_supabase_config';
const STORAGE_KEY_LOCAL_ITEMS = 'escolarstock_local_items';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private config: SupabaseConfig;

  constructor() {
    this.config = this.loadConfig();
    this.initClient();
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<SupabaseConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.error('Falha ao salvar config do Supabase no localStorage', e);
    }
    this.initClient();
  }

  private loadConfig(): SupabaseConfig {
    const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    const envTable = (import.meta.env.VITE_SUPABASE_TABLE as string) || 'materiais_escolares';

    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          url: parsed.url || envUrl,
          anonKey: parsed.anonKey || envKey,
          tableName: parsed.tableName || envTable,
          isConnected: false,
        };
      }
    } catch {
      // ignore
    }

    return {
      url: envUrl,
      anonKey: envKey,
      tableName: envTable,
      isConnected: false,
    };
  }

  public initClient(): boolean {
    if (this.channel) {
      try {
        this.channel.unsubscribe();
      } catch {
        // ignore
      }
      this.channel = null;
    }

    if (this.config.url && this.config.anonKey) {
      try {
        this.client = createClient(this.config.url.trim(), this.config.anonKey.trim(), {
          auth: { persistSession: false },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        });
        return true;
      } catch (err) {
        console.error('Erro ao inicializar Supabase Client:', err);
        this.client = null;
        return false;
      }
    } else {
      this.client = null;
      return false;
    }
  }

  public isConfigured(): boolean {
    return !!(this.client && this.config.url && this.config.anonKey);
  }

  public async testConnection(): Promise<{ success: boolean; message: string; count?: number }> {
    if (!this.client) {
      return { success: false, message: 'URL e Chave Anônima do Supabase são obrigatórias.' };
    }

    try {
      const { data, error } = await this.client
        .from(this.config.tableName)
        .select('id', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Erro na tabela "${this.config.tableName}": ${error.message}. Certifique-se de que a tabela foi criada com o script SQL.`,
        };
      }

      this.config.isConnected = true;
      return {
        success: true,
        message: 'Conectado com sucesso ao Supabase!',
        count: data?.length || 0,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Falha na requisição: ${msg}` };
    }
  }

  public subscribeToRealtime(
    onPayload: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: MaterialItem | null; old: MaterialItem | null }) => void
  ): () => void {
    if (!this.client) return () => {};

    if (this.channel) {
      this.channel.unsubscribe();
    }

    const channelName = `realtime-stock-${Date.now()}`;
    this.channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.config.tableName,
        },
        (payload) => {
          onPayload({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as MaterialItem | null,
            old: payload.old as MaterialItem | null,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Supabase Realtime] Conectado e escutando tabela ${this.config.tableName}`);
        }
      });

    return () => {
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
    };
  }

  // Local Storage Helpers
  public getLocalItems(): MaterialItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOCAL_ITEMS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveLocalItems(items: MaterialItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Erro ao salvar localmente no navegador', e);
    }
  }

  // Data Operations
  public async getItems(): Promise<{ items: MaterialItem[]; fromSupabase: boolean; error?: string }> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from(this.config.tableName)
          .select('*')
          .order('nome', { ascending: true });

        if (error) {
          console.warn('Erro ao buscar do Supabase, caindo para local:', error.message);
          return { items: this.getLocalItems(), fromSupabase: false, error: error.message };
        }

        const items: MaterialItem[] = (data || []).map((row) => ({
          id: String(row.id),
          nome: row.nome || '',
          codigo: row.codigo || '',
          categoria: row.categoria || 'Acessórios & Outros',
          quantidade: Number(row.quantidade ?? 0),
          estoque_minimo: Number(row.estoque_minimo ?? 5),
          preco_unitario: Number(row.preco_unitario ?? 0),
          localizacao: row.localizacao || '',
          descricao: row.descricao || '',
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        }));

        // Keep local storage synced as cache
        this.saveLocalItems(items);
        return { items, fromSupabase: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { items: this.getLocalItems(), fromSupabase: false, error: msg };
      }
    }

    return { items: this.getLocalItems(), fromSupabase: false };
  }

  public async addItem(
    itemData: Omit<MaterialItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ item: MaterialItem; error?: string }> {
    const now = new Date().toISOString();
    const newItem: MaterialItem = {
      ...itemData,
      id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: now,
      updated_at: now,
    };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from(this.config.tableName)
          .insert([
            {
              id: newItem.id,
              nome: newItem.nome,
              codigo: newItem.codigo,
              categoria: newItem.categoria,
              quantidade: newItem.quantidade,
              estoque_minimo: newItem.estoque_minimo,
              preco_unitario: newItem.preco_unitario,
              localizacao: newItem.localizacao,
              descricao: newItem.descricao,
              created_at: newItem.created_at,
              updated_at: newItem.updated_at,
            },
          ])
          .select()
          .single();

        if (error) {
          throw error;
        }

        const returnedItem: MaterialItem = {
          id: String(data.id),
          nome: data.nome,
          codigo: data.codigo,
          categoria: data.categoria,
          quantidade: Number(data.quantidade),
          estoque_minimo: Number(data.estoque_minimo),
          preco_unitario: Number(data.preco_unitario),
          localizacao: data.localizacao,
          descricao: data.descricao,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        // Update local cache
        const local = this.getLocalItems();
        this.saveLocalItems([returnedItem, ...local]);
        return { item: returnedItem };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Erro ao inserir no Supabase, salvando apenas localmente:', msg);
        // Fallback to local
        const local = this.getLocalItems();
        this.saveLocalItems([newItem, ...local]);
        return { item: newItem, error: `Salvo apenas localmente (erro Supabase: ${msg})` };
      }
    }

    const local = this.getLocalItems();
    this.saveLocalItems([newItem, ...local]);
    return { item: newItem };
  }

  public async updateItem(
    id: string,
    updates: Partial<Omit<MaterialItem, 'id' | 'created_at'>>
  ): Promise<{ item?: MaterialItem; error?: string }> {
    const updated_at = new Date().toISOString();
    const payloadToUpdate = { ...updates, updated_at };

    if (this.client) {
      try {
        const { data, error } = await this.client
          .from(this.config.tableName)
          .update(payloadToUpdate)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        const updated: MaterialItem = {
          id: String(data.id),
          nome: data.nome,
          codigo: data.codigo,
          categoria: data.categoria,
          quantidade: Number(data.quantidade),
          estoque_minimo: Number(data.estoque_minimo),
          preco_unitario: Number(data.preco_unitario),
          localizacao: data.localizacao,
          descricao: data.descricao,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        const local = this.getLocalItems().map((it) => (it.id === id ? updated : it));
        this.saveLocalItems(local);
        return { item: updated };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const local = this.getLocalItems().map((it) =>
          it.id === id ? { ...it, ...updates, updated_at } : it
        );
        this.saveLocalItems(local);
        const updated = local.find((it) => it.id === id);
        return { item: updated, error: `Atualizado apenas localmente (erro Supabase: ${msg})` };
      }
    }

    const local = this.getLocalItems().map((it) =>
      it.id === id ? { ...it, ...updates, updated_at } : it
    );
    this.saveLocalItems(local);
    const updated = local.find((it) => it.id === id);
    return { item: updated };
  }

  public async deleteItem(id: string): Promise<{ success: boolean; error?: string }> {
    if (this.client) {
      try {
        const { error } = await this.client
          .from(this.config.tableName)
          .delete()
          .eq('id', id);

        if (error) throw error;

        const local = this.getLocalItems().filter((it) => it.id !== id);
        this.saveLocalItems(local);
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const local = this.getLocalItems().filter((it) => it.id !== id);
        this.saveLocalItems(local);
        return { success: false, error: `Removido do cache local, falha no Supabase: ${msg}` };
      }
    }

    const local = this.getLocalItems().filter((it) => it.id !== id);
    this.saveLocalItems(local);
    return { success: true };
  }

  public async syncLocalToSupabase(): Promise<{ syncedCount: number; error?: string }> {
    if (!this.client) {
      return { syncedCount: 0, error: 'Supabase não está configurado.' };
    }

    const localItems = this.getLocalItems();
    if (localItems.length === 0) {
      return { syncedCount: 0 };
    }

    try {
      const { data, error } = await this.client
        .from(this.config.tableName)
        .upsert(localItems, { onConflict: 'id' })
        .select();

      if (error) throw error;
      return { syncedCount: data ? data.length : localItems.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { syncedCount: 0, error: msg };
    }
  }

  public getSqlSetupScript(): string {
    const table = this.config.tableName || 'materiais_escolares';
    return `-- ========================================================
-- Script SQL para criar a tabela de Estoque de Materiais Escolares
-- Copie e execute este código no SQL Editor do Supabase
-- ========================================================

create table if not exists public.${table} (
  id text primary key,
  nome text not null,
  codigo text,
  categoria text not null default 'CADERNO E PAPEIS',
  quantidade integer not null default 0,
  estoque_minimo integer not null default 5,
  preco_unitario numeric(10, 2) not null default 0.00,
  localizacao text,
  descricao text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para buscas rápidas
create index if not exists idx_${table}_nome on public.${table} (nome);
create index if not exists idx_${table}_categoria on public.${table} (categoria);
create index if not exists idx_${table}_codigo on public.${table} (codigo);

-- Trigger para atualização automática da data de modificação
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_${table}_updated_at on public.${table};
create trigger trigger_${table}_updated_at
  before update on public.${table}
  for each row
  execute function public.handle_updated_at();

-- Ativar segurança em nível de linha (RLS)
alter table public.${table} enable row level security;

-- Política de leitura e escrita anônima/pública (Anon key)
drop policy if exists "Permitir acesso completo anonimo" on public.${table};
create policy "Permitir acesso completo anonimo"
  on public.${table}
  for all
  using (true)
  with check (true);

-- Habilitar sincronização em Tempo Real (Realtime) de forma segura sem erros de duplicidade
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = '${table}'
  ) then
    alter publication supabase_realtime add table public.${table};
  end if;
end $$;
`;
  }
}

export const supabaseService = new SupabaseService();
