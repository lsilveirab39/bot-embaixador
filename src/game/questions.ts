export interface Question {
  id: string;
  theme: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export const VALID_THEMES = [
  "machine-learning",
  "deep-learning",
  "sistemas-de-recomendacao",
  "algoritmos-de-jogos",
  "llms",
  "prompt-engineering",
  "ai-agents",
  "mcp",
  "modelos-locais",
  "rag",
  "langchain",
  "classificacao-de-intencoes",
  "memoria-e-persistencia",
  "seguranca",
  "graphrag",
  "multimodal-e-monitoramento",
] as const;

export type Theme = (typeof VALID_THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  "machine-learning": "Machine Learning",
  "deep-learning": "Deep Learning",
  "sistemas-de-recomendacao": "Sistemas de Recomendação",
  "algoritmos-de-jogos": "Algoritmos de Jogos",
  "llms": "LLMs",
  "prompt-engineering": "Prompt Engineering",
  "ai-agents": "AI Agents",
  "mcp": "MCP (Model Context Protocol)",
  "modelos-locais": "Modelos Locais e OpenRouter",
  "rag": "RAG",
  "langchain": "LangChain",
  "classificacao-de-intencoes": "Classificação de Intenções",
  "memoria-e-persistencia": "Memória e Persistência",
  "seguranca": "Segurança",
  "graphrag": "GraphRAG com Neo4j",
  "multimodal-e-monitoramento": "Multimodal e Monitoramento",
};

const ALL_QUESTIONS: Question[] = [
  // ── Machine Learning ──
  {
    id: "ml-1",
    theme: "machine-learning",
    question: "O que é Machine Learning?",
    options: [
      "Um tipo de banco de dados",
      "Um campo da IA que permite máquinas aprenderem com dados",
      "Uma linguagem de programação",
      "Um sistema operacional",
    ],
    correctIndex: 1,
  },
  {
    id: "ml-2",
    theme: "machine-learning",
    question: "Qual é a diferença principal entre supervised e unsupervised learning?",
    options: [
      "Supervised usa mais dados",
      "Supervised usa dados rotulados, unsupervised não",
      "Unsupervised é mais rápido",
      "Supervised só funciona com imagens",
    ],
    correctIndex: 1,
  },
  {
    id: "ml-3",
    theme: "machine-learning",
    question: "O que é overfitting em Machine Learning?",
    options: [
      "Quando o modelo performa bem em dados novos",
      "Quando o modelo memoriza os dados de treino e generalize mal",
      "Quando o modelo é muito simples",
      "Quando o dataset é muito pequeno",
    ],
    correctIndex: 1,
  },

  // ── Deep Learning ──
  {
    id: "dl-1",
    theme: "deep-learning",
    question: "O que são Redes Neurais Artificiais?",
    options: [
      "Programas que seguem regras fixas",
      "Modelos inspirados no cérebro humano com camadas de neurônios",
      "Bancos de dados distribuídos",
      "Sistemas de cache",
    ],
    correctIndex: 1,
  },
  {
    id: "dl-2",
    theme: "deep-learning",
    question: "Qual é a função de ativação mais usada em camadas intermediárias?",
    options: [
      "Sigmoid",
      "ReLU (Rectified Linear Unit)",
      "Softmax",
      "Linear",
    ],
    correctIndex: 1,
  },
  {
    id: "dl-3",
    theme: "deep-learning",
    question: "O que é Transfer Learning?",
    options: [
      "Mover dados entre servidores",
      "Reutilizar um modelo pré-treinado para uma nova tarefa",
      "Aumentar o tamanho do dataset",
      "Reduzir o número de camadas",
    ],
    correctIndex: 1,
  },

  // ── Sistemas de Recomendação ──
  {
    id: "rec-1",
    theme: "sistemas-de-recomendacao",
    question: "Qual é a abordagem baseada em conteúdo em sistemas de recomendação?",
    options: [
      "Recomendar baseado no histórico de compras",
      "Recomendar itens similares ao que o usuário já gostou",
      "Recomendar apenas itens populares",
      "Usar apenas filtros colaborativos",
    ],
    correctIndex: 1,
  },
  {
    id: "rec-2",
    theme: "sistemas-de-recomendacao",
    question: "O que é filtragem colaborativa?",
    options: [
      "Filtrar spam de e-mails",
      "Preferências de usuários similares para recomendar itens",
      "Filtrar dados duplicados",
      "Um tipo de criptografia",
    ],
    correctIndex: 1,
  },

  // ── Algoritmos de Jogos ──
  {
    id: "game-1",
    theme: "algoritmos-de-jogos",
    question: "O que é o algoritmo Minimax?",
    options: [
      "Um algoritmo de ordenação",
      "Um algoritmo para jogos de dois jogadores com jogadas alternadas",
      "Um algoritmo de busca em grafos",
      "Um algoritmo de compressão",
    ],
    correctIndex: 1,
  },
  {
    id: "game-2",
    theme: "algoritmos-de-jogos",
    question: "O que é poda alfa-beta?",
    options: [
      "Um método para treinar redes neurais",
      "Uma otimização do Minimax que reduz nós avaliados",
      "Um algoritmo de pathfinding",
      "Um tipo de machine learning",
    ],
    correctIndex: 1,
  },
  {
    id: "game-3",
    theme: "algoritmos-de-jogos",
    question: "Na árvore de jogo, o que representa a 'profundidade'?",
    options: [
      "O número total de jogadas possíveis",
      "O número de turnos/plays à frente que o algoritmo avalia",
      "O tamanho do tabuleiro",
      "A velocidade do processador",
    ],
    correctIndex: 1,
  },

  // ── LLMs ──
  {
    id: "llm-1",
    theme: "llms",
    question: "O que é uma Large Language Model (LLM)?",
    options: [
      "Um banco de dados de linguagens naturais",
      "Um modelo de IA treinado em grandes volumes de texto para gerar linguagem",
      "Um compilador de múltiplas linguagens",
      "Um framework de web scraping",
    ],
    correctIndex: 1,
  },
  {
    id: "llm-2",
    theme: "llms",
    question: "O que é 'temperature' em LLMs?",
    options: [
      "A velocidade de processamento",
      "Um parâmetro que controla a criatividade/aleatoriedade da geração",
      "O tamanho do contexto",
      "O número de camadas do modelo",
    ],
    correctIndex: 1,
  },
  {
    id: "llm-3",
    theme: "llms",
    question: "O que é tokenização em LLMs?",
    options: [
      "Criar tokens de acesso",
      "Dividir texto em unidades menores (tokens) para processamento",
      "Criptografar mensagens",
      "Fazer backup de dados",
    ],
    correctIndex: 1,
  },

  // ── Prompt Engineering ──
  {
    id: "pe-1",
    theme: "prompt-engineering",
    question: "O que é Few-Shot Prompting?",
    options: [
      "Dar ao modelo acesso a poucos dados",
      "Fornecer exemplos no prompt para guiar a resposta do modelo",
      "Treinar o modelo com poucos dados",
      "Limitar a resposta a poucas palavras",
    ],
    correctIndex: 1,
  },
  {
    id: "pe-2",
    theme: "prompt-engineering",
    question: "O que é Chain-of-Thought (CoT) prompting?",
    options: [
      "Conectar múltiplos prompts em sequência",
      "Pedir ao modelo que mostre o passo a passo do raciocínio",
      "Criar uma cadeia de prompts para differentes tarefas",
      "Encadear múltiplas LLMs",
    ],
    correctIndex: 1,
  },
  {
    id: "pe-3",
    theme: "prompt-engineering",
    question: "O que é um System Prompt?",
    options: [
      "Um prompt que só funciona no sistema operacional",
      "Instrução de sistema que define o comportamento e personalidade do modelo",
      "Um prompt para configurar o servidor",
      "Um prompt de emergência",
    ],
    correctIndex: 1,
  },

  // ── AI Agents ──
  {
    id: "agent-1",
    theme: "ai-agents",
    question: "O que define um AI Agent?",
    options: [
      "Um chatbot simples de perguntas e respostas",
      "Um sistema autônomo que percebe, decide e age para atingir objetivos",
      "Um assistente virtual que só responde perguntas",
      "Um robô físico com sensores",
    ],
    correctIndex: 1,
  },
  {
    id: "agent-2",
    theme: "ai-agents",
    question: "O que é 'tool use' em AI Agents?",
    options: [
      "Usar ferramentas físicas como martelo e chave",
      "Capacidade do agente de chamar APIs e funções externas",
      "O agente consertar bugs no código",
      "Usar múltiplos monitores",
    ],
    correctIndex: 1,
  },
  {
    id: "agent-3",
    theme: "ai-agents",
    question: "O que é um agente ReAct?",
    options: [
      "Um agente que reage apenas a mensagens",
      "Um agente que alterna entre raciocínio (Reason) e ação (Act)",
      "Um agente que só age sem pensar",
      "Um agente de relações públicas",
    ],
    correctIndex: 1,
  },

  // ── MCP ──
  {
    id: "mcp-1",
    theme: "mcp",
    question: "O que é o Model Context Protocol (MCP)?",
    options: [
      "Um protocolo de rede para IoT",
      "Um padrão aberto para conectar LLMs a fontes de dados e ferramentas",
      "Um protocolo de criptografia",
      "Um sistema de versionamento",
    ],
    correctIndex: 1,
  },
  {
    id: "mcp-2",
    theme: "mcp",
    question: "Qual a principal vantagem do MCP?",
    options: [
      "Aumentar a velocidade da internet",
      "Padronizar a integração entre LLMs e ferramentas externas",
      "Substituir APIs REST",
      " Criptografar comunicações",
    ],
    correctIndex: 1,
  },

  // ── Modelos Locais e OpenRouter ──
  {
    id: "local-1",
    theme: "modelos-locais",
    question: "O que é o OpenRouter?",
    options: [
      "Um roteador de rede doméstico",
      "Uma plataforma que unifica acesso a múltiplos provedores de LLMs",
      "Um sistema operacional para servidores",
      "Um framework de machine learning",
    ],
    correctIndex: 1,
  },
  {
    id: "local-2",
    theme: "modelos-locais",
    question: "Qual a vantagem de rodar modelos localmente?",
    options: [
      "Melhor performance de rede",
      "Privacidade dos dados e sem custo por token",
      "Maior qualidade que modelos na nuvem",
      "Não precisa de hardware",
    ],
    correctIndex: 1,
  },

  // ── RAG ──
  {
    id: "rag-1",
    theme: "rag",
    question: "O que é RAG (Retrieval-Augmented Generation)?",
    options: [
      "Um tipo de banco de dados relacional",
      "Técnica que combina recuperação de documentos com geração de texto por LLM",
      "Um algoritmo de ordenação",
      "Um framework de testes automatizados",
    ],
    correctIndex: 1,
  },
  {
    id: "rag-2",
    theme: "rag",
    question: "O que são embeddings no contexto de RAG?",
    options: [
      "Arquivos embutidos em páginas web",
      "Representações vetoriais numéricas de texto para busca semântica",
      "Código embutido em scripts",
      "Links de referência",
    ],
    correctIndex: 1,
  },
  {
    id: "rag-3",
    theme: "rag",
    question: "O que é chunking em RAG?",
    options: [
      "Dividir o modelo em pedaços",
      "Dividir documentos em trechos menores para indexação vetorial",
      "Compactar arquivos de mídia",
      "Fragmentar a rede em sub-redes",
    ],
    correctIndex: 1,
  },

  // ── LangChain ──
  {
    id: "lc-1",
    theme: "langchain",
    question: "O que é o LangChain?",
    options: [
      "Uma blockchain para IA",
      "Um framework para construir aplicações com LLMs usando cadeias e agentes",
      "Uma rede neural convolucional",
      "Um sistema de versionamento de código",
    ],
    correctIndex: 1,
  },
  {
    id: "lc-2",
    theme: "langchain",
    question: "O que é LangGraph?",
    options: [
      "Uma ferramenta para criar gráficos estatísticos",
      "Um framework para criar fluxos de agentes com estados e ciclos",
      "Um banco de dados grafos",
      "Uma biblioteca de visualização",
    ],
    correctIndex: 1,
  },

  // ── Classificação de Intenções ──
  {
    id: "intent-1",
    theme: "classificacao-de-intencoes",
    question: "O que é classificação de intenções (intent classification)?",
    options: [
      "Classificar usuários por perfil",
      "Determinar o propósito/goal da mensagem do usuário",
      "Categorizar e-mails por remetente",
      "Classificar imagens por cor",
    ],
    correctIndex: 1,
  },
  {
    id: "intent-2",
    theme: "classificacao-de-intencoes",
    question: "Por que a classificação de intenções é importante em chatbots?",
    options: [
      "Para o bot responder mais rápido",
      "Para direcionar a mensagem para o handler correto",
      "Para economizar memória",
      "Para criptografar as respostas",
    ],
    correctIndex: 1,
  },

  // ── Memória e Persistência ──
  {
    id: "mem-1",
    theme: "memoria-e-persistencia",
    question: "O que é memória de curto prazo em LLMs?",
    options: [
      "Cache no disco rígido",
      "O contexto da conversa atual (janela de contexto)",
      "Banco de dados relacional",
      "Arquivos de log",
    ],
    correctIndex: 1,
  },
  {
    id: "mem-2",
    theme: "memoria-e-persistencia",
    question: "O que é memória de longo prazo em agentes de IA?",
    options: [
      "Armazenar dados em cache RAM",
      "Persistir informações entre sessões em banco de dados ou vetorial",
      "Usar pen drive para backup",
      "Comprimir dados antigos",
    ],
    correctIndex: 1,
  },

  // ── Segurança ──
  {
    id: "sec-1",
    theme: "seguranca",
    question: "O que é prompt injection?",
    options: [
      "Injetar código SQL em formulários",
      "Manipular o prompt para fazer o modelo ignorar instruções originais",
      "Instalar vírus via prompts",
      "Criptografar mensagens com senhas",
    ],
    correctIndex: 1,
  },
  {
    id: "sec-2",
    theme: "seguranca",
    question: "O que é um guard LLM?",
    options: [
      "Um firewall para redes neurais",
      "Um modelo que valida se a entrada/saída é segura e adequada",
      "Um guarda-costas virtual",
      "Um sistema de backup",
    ],
    correctIndex: 1,
  },

  // ── GraphRAG com Neo4j ──
  {
    id: "graph-1",
    theme: "graphrag",
    question: "O que é GraphRAG?",
    options: [
      "Um sistema de gerenciamento de grafos",
      "RAG que usa grafos de conhecimento para enriquecer a recuperação",
      "Um tipo de banco de dados NoSQL",
      "Um framework de visualização",
    ],
    correctIndex: 1,
  },
  {
    id: "graph-2",
    theme: "graphrag",
    question: "O que é o Neo4j no contexto de GraphRAG?",
    options: [
      "Um framework de machine learning",
      "Um banco de dados de grafos usado para armazenar relações semânticas",
      "Um compilador de linguagens",
      "Um servidor web",
    ],
    correctIndex: 1,
  },

  // ── Multimodal e Monitoramento ──
  {
    id: "multi-1",
    theme: "multimodal-e-monitoramento",
    question: "O que são modelos multimodais?",
    options: [
      "Modelos que funcionam em múltiplos servidores",
      "Modelos que processam diferentes tipos de dados (texto, imagem, áudio)",
      "Modelos com múltiplas camadas",
      "Modelos que rodam em múltiplos dispositivos",
    ],
    correctIndex: 1,
  },
  {
    id: "multi-2",
    theme: "multimodal-e-monitoramento",
    question: "O que é LangSmith no contexto de monitoramento?",
    options: [
      "Um banco de dados para LLMs",
      "Uma plataforma para rastrear, avaliar e depurar aplicações com LLMs",
      "Um framework de testes unitários",
      "Um editor de código",
    ],
    correctIndex: 1,
  },
];

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i]!;
    a[i] = a[j]!;
    a[j] = temp;
  }
  return a;
}

export function getThemes(): Theme[] {
  return [...VALID_THEMES];
}

export function isValidTheme(theme: string): theme is Theme {
  return VALID_THEMES.includes(theme as Theme);
}

export function getRandomTheme(): Theme {
  return VALID_THEMES[Math.floor(Math.random() * VALID_THEMES.length)]!;
}

export async function getQuestions(
  guildId: string,
  theme: Theme | null,
  count: number,
): Promise<Question[]> {
  const { getAskedQuestionIds, saveAskedQuestions } = await import("./ranking.js");

  let pool: Question[];

  if (theme) {
    pool = ALL_QUESTIONS.filter((q) => q.theme === theme);
  } else {
    pool = [...ALL_QUESTIONS];
  }

  const askedIds = await getAskedQuestionIds(guildId);
  const available = pool.filter((q) => !askedIds.has(q.id));

  let selected: Question[];

  if (available.length >= count) {
    const shuffled = shuffle(available);
    selected = shuffled.slice(0, count);
  } else {
    selected = [...available];
    const remaining = count - selected.length;
    if (remaining > 0) {
      const usedOrSelected = new Set([...askedIds, ...selected.map((s) => s.id)]);
      const fallback = ALL_QUESTIONS.filter((q) => !usedOrSelected.has(q.id));
      const extra = shuffle(fallback).slice(0, remaining);
      selected = [...selected, ...extra];
    }
  }

  await saveAskedQuestions(guildId, selected.map((q) => q.id));

  return selected.map((q) => {
    const optionOrder = shuffle([0, 1, 2, 3]);
    const newCorrectIndex = optionOrder.indexOf(q.correctIndex);
    return {
      ...q,
      options: optionOrder.map((i) => q.options[i]) as [string, string, string, string],
      correctIndex: newCorrectIndex,
    };
  });
}

export function getThemeStats(
  answers: Map<string, { theme: string; correct: boolean }[]>,
): { theme: string; correct: number; total: number }[] {
  const stats = new Map<string, { correct: number; total: number }>();

  for (const entries of answers.values()) {
    for (const entry of entries) {
      const existing = stats.get(entry.theme) ?? { correct: 0, total: 0 };
      existing.total++;
      if (entry.correct) existing.correct++;
      stats.set(entry.theme, existing);
    }
  }

  return Array.from(stats.entries())
    .map(([theme, s]) => ({
      theme: THEME_LABELS[theme as Theme] ?? theme,
      correct: s.correct,
      total: s.total,
    }))
    .sort((a, b) => b.correct / b.total - a.correct / a.total);
}
