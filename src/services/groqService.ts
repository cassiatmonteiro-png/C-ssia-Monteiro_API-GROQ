import { ChatMessage, GroqConfig, MaterialItem, normalizeCategory, CATEGORIAS_PADRAO } from '../types';

const STORAGE_KEY_GROQ = 'escolarstock_groq_config';

export const GROQ_MODELS = [
  { id: 'openai/gpt-oss-20b', name: 'OpenAI GPT-OSS 20B (Padrão)', description: 'Modelo open-weights de 20 bilhões de parâmetros da OpenAI' },
  { id: 'gpt-oss-20b', name: 'GPT-OSS 20B', description: 'Identificador direto gpt-oss-20b' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Excelente raciocínio, rápido e ótimo em português' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Ultra-rápido para respostas imediatas' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32k contexto)', description: 'Contexto longo para inventários extensos' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', description: 'Modelo compacto e preciso da Google rodando na Groq' },
];

export class GroqService {
  private config: GroqConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  public getConfig(): GroqConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<GroqConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    try {
      localStorage.setItem(STORAGE_KEY_GROQ, JSON.stringify(this.config));
    } catch (e) {
      console.error('Erro ao salvar Groq config no localStorage', e);
    }
  }

  private loadConfig(): GroqConfig {
    const envKey = (import.meta.env.VITE_GROQ_API_KEY as string) || '';
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GROQ);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If the saved model was the old default, migrate to openai/gpt-oss-20b
        const model = (!parsed.model || parsed.model === 'llama-3.3-70b-versatile')
          ? 'openai/gpt-oss-20b'
          : parsed.model;
        return {
          apiKey: parsed.apiKey || envKey,
          model,
          temperature: parsed.temperature ?? 0.2,
        };
      }
    } catch {
      // ignore
    }

    return {
      apiKey: envKey,
      model: 'openai/gpt-oss-20b',
      temperature: 0.2,
    };
  }

  public isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.trim().length > 0);
  }

  public async testApiKey(keyToTest?: string): Promise<{ success: boolean; message: string }> {
    const key = (keyToTest || this.config.apiKey || '').trim();
    if (!key) {
      return { success: false, message: 'Chave de API do Groq não fornecida.' };
    }

    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson?.error?.message || `Status HTTP ${res.status}`;
        return { success: false, message: `Erro da API Groq: ${msg}` };
      }

      return { success: true, message: 'Chave da API Groq validada com sucesso!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Falha na conexão: ${msg}` };
    }
  }

  /**
   * Generates a structured snapshot of current inventory for the LLM
   */
  private buildInventoryContext(items: MaterialItem[]): string {
    if (items.length === 0) {
      return `[INVENTÁRIO ATUAL: O estoque está vazio. Nenhum material escolar cadastrado ainda pelo usuário.]`;
    }

    const totalItens = items.length;
    const totalUnidades = items.reduce((acc, it) => acc + it.quantidade, 0);
    const valorTotal = items.reduce((acc, it) => acc + (it.quantidade * it.preco_unitario), 0);
    const itensBaixoEstoque = items.filter((it) => it.quantidade <= it.estoque_minimo && it.quantidade > 0);
    const itensEsgotados = items.filter((it) => it.quantidade === 0);

    const categories = CATEGORIAS_PADRAO;

    const itemListSummary = items.map((it, idx) => {
      const status = it.quantidade === 0 
        ? 'ESGOTADO' 
        : it.quantidade <= it.estoque_minimo 
          ? 'ESTOQUE BAIXO' 
          : 'NORMAL';
      
      const normCat = normalizeCategory(it.categoria);
      const parts = [
        `${idx + 1}. [${normCat}] ${it.nome}`,
        it.codigo ? `(Código: ${it.codigo})` : null,
        `- Qtd: ${it.quantidade} un (Mínimo: ${it.estoque_minimo})`,
        `- Preço Unitário: R$ ${it.preco_unitario.toFixed(2)}`,
        `- Status: ${status}`,
        it.localizacao ? `- Local: ${it.localizacao}` : null,
        it.descricao ? `- Obs: ${it.descricao}` : null,
      ].filter(Boolean);

      return parts.join(' ');
    }).join('\n');

    return `
========================================
DADOS EM TEMPO REAL DO ESTOQUE (ESCOLARSTOCK):
Total de produtos cadastrados: ${totalItens}
Total de unidades físicas: ${totalUnidades}
Valor total estimado em estoque: R$ ${valorTotal.toFixed(2)}
Categorias existentes: ${categories.join(', ')}
Itens com estoque baixo (alerta de reposição): ${itensBaixoEstoque.length} produto(s)
Itens zerados (esgotados): ${itensEsgotados.length} produto(s)

LISTA COMPLETA DOS PRODUTOS CADASTRADOS:
${itemListSummary}
========================================`;
  }

  public async sendMessage(
    messages: ChatMessage[],
    currentStock: MaterialItem[],
    onDelta?: (chunk: string) => void
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Chave da API do Groq não configurada. Clique em "Configurações" para inserir sua chave.');
    }

    const inventoryContext = this.buildInventoryContext(currentStock);

    const systemPrompt = `Você é o Agente Especialista em Estoque de Materiais Escolares do sistema "EscolarStock".
Seu papel é consultar os dados em tempo real do estoque e responder dúvidas do usuário com precisão cirúrgica, cordialidade e clareza em Português do Brasil.

INSTRUÇÕES RIGOROSAS:
1. NUNCA INVENTE PRODUTOS OU DADOS FICTÍCIOS. Se o usuário perguntar por um item (ex: "tem caneta azul?", "tem compasso?") que NÃO consta na lista de produtos cadastrados abaixo, afirme claramente que o item não está cadastrado no estoque atualmente.
2. Os dados de estoque fornecidos abaixo são a ÚNICA fonte de verdade em tempo real.
3. Se o estoque estiver vazio, explique que nenhum produto foi cadastrado manualmente ainda no aplicativo.
4. Quando perguntado sobre quantidades, preços, localização ou itens para reposição (estoque baixo/esgotado), utilize exatamente os números e nomes fornecidos.
5. Formate valores monetários no padrão brasileiro (ex: R$ 12,50).
6. Utilize formatação limpa com tópicos (bullet points) e destaques em negrito para facilitar a leitura rápida de operadores de estoque e atendentes.
7. Se o usuário pedir recomendações ou montar kits com o que tem em estoque, sugira APENAS produtos que estejam com quantidade > 0 no inventário atual.

${inventoryContext}`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'llama-3.3-70b-versatile',
          messages: apiMessages,
          temperature: this.config.temperature ?? 0.2,
          stream: !!onDelta,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `Erro HTTP ${response.status} da Groq`;
        throw new Error(errMsg);
      }

      if (onDelta && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullText += delta;
                  onDelta(fullText);
                }
              } catch {
                // Ignore incomplete line parse
              }
            }
          }
        }
        return fullText;
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || 'Não foi possível gerar uma resposta.';
        return content;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Falha no agente Groq: ${msg}`);
    }
  }
}

export const groqService = new GroqService();
