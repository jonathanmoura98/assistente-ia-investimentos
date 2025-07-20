// Importa as bibliotecas React e os hooks useState e useEffect.
import React, { useState, useEffect } from 'react';

// Define o componente principal da aplicação.
const App = () => {
  // Estado para armazenar a pergunta do usuário.
  const [perguntaUsuario, setPerguntaUsuario] = useState('');
  // Estado para armazenar a resposta da IA para a pergunta geral.
  const [respostaIA, setRespostaIA] = useState('');
  // Estado para controlar o estado de carregamento (enquanto a IA está processando).
  const [estaCarregando, setEstaCarregando] = useState(false);
  // Estado para exibir mensagens de erro.
  const [erro, setErro] = useState('');
  // Estado para armazenar as vozes disponíveis para síntese de fala.
  const [vozes, setVozes] = useState([]);

  // Novos estados para a funcionalidade de estratégia de investimento.
  const [toleranciaRisco, setToleranciaRisco] = useState('Médio'); // Tolerância ao risco padrão
  const [objetivoInvestimento, setObjetivoInvestimento] = useState('Crescimento a Longo Prazo'); // Objetivo de investimento padrão
  const [estrategiaInvestimento, setEstrategiaInvestimento] = useState(''); // Resposta da IA para a estratégia
  const [estaCarregandoEstrategia, setEstaCarregandoEstrategia] = useState(false); // Estado de carregamento para a estratégia

  // Novos estados para a funcionalidade de calculadora de independência financeira.
  const [despesasAnuaisAlvo, setDespesasAnuaisAlvo] = useState(48000); // Despesas anuais alvo para independência (R$ 4.000/mês)
  const [valorAplicadoMensalmente, setValorAplicadoMensalmente] = useState(500); // Valor aplicado mensalmente
  const [poupancaInicial, setPoupancaInicial] = useState(0); // Novo estado: Capital inicial
  const [tipoInvestimento, setTipoInvestimento] = useState('CDI'); // Tipo de investimento padrão
  const [retornoAnualPersonalizado, setRetornoAnualPersonalizado] = useState(0.07); // Novo estado: Taxa de retorno anual personalizada (padrão 7%)
  const [taxaInflacao, setTaxaInflacao] = useState(0.04); // Novo estado: Taxa de inflação anual (padrão 4%)
  const [resultadoAnosFI, setResultadoAnosFI] = useState(''); // Resultado em anos para independência financeira
  const [estaCarregandoCalculadoraFI, setEstaCarregandoCalculadoraFI] = useState(false); // Estado de carregamento para a calculadora FI

  // Mapeamento das taxas de retorno anuais estimadas por tipo de investimento.
  // Estes são valores de exemplo e podem variar significativamente na realidade.
  const retornosAnuaisEstimados = {
    'Poupanca': 0.06, // Ex: 6% ao ano
    'CDI': 0.08,     // Ex: 8% ao ano (próximo ao CDI, como Caixinha)
    'FIIs': 0.10,    // Ex: 10% ao ano
    'Acoes': 0.12,    // Ex: 12% ao ano
    'Personalizado': retornoAnualPersonalizado // Usa a taxa personalizada se selecionado
  };

  // useEffect para carregar as vozes disponíveis quando o componente é montado.
  useEffect(() => {
    // Função para obter e definir as vozes.
    const popularListaDeVozes = () => {
      if ('speechSynthesis' in window) {
        const vozesDisponiveis = window.speechSynthesis.getVoices();
        setVozes(vozesDisponiveis);
      }
    };

    // Popula a lista de vozes imediatamente.
    popularListaDeVozes();

    // Adiciona um listener para o evento 'voiceschanged' para garantir que as vozes sejam carregadas
    // mesmo que demorem a estar disponíveis.
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = popularListaDeVozes;
    }

    // Limpa o listener quando o componente é desmontado.
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []); // Executa apenas uma vez na montagem do componente.

  // Função para falar o texto fornecido.
  const falarTexto = (texto) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(texto);

      // Tenta encontrar uma voz em português do Brasil.
      const ptBrVoice = vozes.find(
        (voice) => voice.lang === 'pt-BR' && voice.localService
      ) || vozes.find((voice) => voice.lang === 'pt-BR');

      if (ptBrVoice) {
        utterance.voice = ptBrVoice;
      } else {
        utterance.lang = 'pt-BR';
      }

      utterance.rate = 1.0; // Ajuste a velocidade da fala aqui
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('A API de Síntese de Fala não é suportada neste navegador.');
    }
  };

  // Função para lidar com o envio da pergunta geral do usuário.
  const lidarComPerguntaIA = async (perguntaParaFazer = perguntaUsuario) => { // Aceita uma query opcional
    setErro('');
    setRespostaIA('');
    setEstaCarregando(true);
    setPerguntaUsuario(perguntaParaFazer); // Atualiza o campo de texto com a query se for de um tópico comum

    try {
      let historicoChat = [];
      const prompt = Você é um assistente de IA focado em educar pequenos investidores sobre conceitos financeiros e de investimento. Forneça explicações claras, concisas e fáceis de entender. Evite jargões complexos e concentre-se em fundamentos. Responda à seguinte pergunta: "${perguntaParaFazer}";
      historicoChat.push({ role: "user", parts: [{ text: prompt }] });

      const payload = { contents: historicoChat };
      const apiKey = "YOUR_API_KEY"; // Substitua pelo sua chave de API
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro da API: ${errorData?.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setRespostaIA(text);
        falarTexto(text); // Falar a resposta
      } else {
        setRespostaIA('Não foi possível obter uma resposta. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao chamar a API Gemini (pergunta geral):', err);
      setErro(`Ocorreu um erro: ${err.message}. Por favor, tente novamente.`);
    } finally {
      setEstaCarregando(false);
    }
  };

  // Nova função para gerar a estratégia de investimento.
  const lidarComGeracaoEstrategia = async () => {
    setErro('');
    setEstrategiaInvestimento('');
    setEstaCarregandoEstrategia(true);

    try {
      let historicoChat = [];
      const prompt = Você é um consultor financeiro de IA para pequenos investidores. Com base na tolerância ao risco de "${toleranciaRisco}" e no objetivo de investimento de "${objetivoInvestimento}", forneça uma estratégia de investimento geral e clara. Explique os princípios-chave e dê exemplos de tipos de ativos adequados. Mantenha a linguagem simples e focada em educação.;
      historicoChat.push({ role: "user", parts: [{ text: prompt }] });

      const payload = { contents: historicoChat };
      const apiKey = "YOUR_API_KEY"; // Substitua pelo sua chave de API
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro da API: ${errorData?.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setEstrategiaInvestimento(text);
        falarTexto(text); // Falar a estratégia
      } else {
        setEstrategiaInvestimento('Não foi possível gerar uma estratégia. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao chamar a API Gemini (estratégia):', err);
      setErro(`Ocorreu um erro ao gerar a estratégia: ${err.message}. Por favor, tente novamente.`);
    } finally {
      setEstaCarregandoEstrategia(false);
    }
  };

  // Função para calcular a independência financeira.
  const calcularIndependenciaFinanceira = () => {
    setErro('');
    setResultadoAnosFI('');
    setEstaCarregandoCalculadoraFI(true);

    // Validação de entrada
    if (valorAplicadoMensalmente <= 0 || despesasAnuaisAlvo <= 0 || poupancaInicial < 0 || (tipoInvestimento === 'Personalizado' && retornoAnualPersonalizado <= 0) || taxaInflacao < 0) {
      setErro('Por favor, insira valores válidos e positivos para todos os campos da calculadora.');
      setEstaCarregandoCalculadoraFI(false);
      return;
    }

    const annualRate = tipoInvestimento === 'Personalizado' ? retornoAnualPersonalizado : retornosAnuaisEstimados[tipoInvestimento];

    let currentSavings = poupancaInicial;
    let months = 0;
    let currentTargetAnnualExpenses = despesasAnuaisAlvo; // Despesas anuais ajustadas pela inflação

    // A "Regra dos 4%" sugere que o capital necessário é 25x as despesas anuais.
    // No entanto, para ajustar a inflação, precisamos que o capital cresça na mesma proporção das despesas.
    // A taxa de retorno real é (1 + taxa nominal) / (1 + taxa de inflação) - 1
    // Para simplificar a simulação mês a mês com inflação, ajustamos as despesas alvo.

    while (months < 1200) { // Limite de 100 anos (1200 meses) para evitar loops infinitos
      // Ajusta as despesas anuais alvo pela inflação a cada ano
      if (months > 0 && months % 12 === 0) {
        currentTargetAnnualExpenses *= (1 + taxaInflacao);
      }

      const targetFI = currentTargetAnnualExpenses * 25; // Capital alvo ajustado pela inflação

      if (currentSavings >= targetFI) {
        break; // Atingiu a independência financeira
      }

      currentSavings += valorAplicadoMensalmente;
      currentSavings *= (1 + annualRate / 12); // Crescimento do capital com base na taxa de retorno nominal
      months++;
    }

    const years = (months / 12).toFixed(1);
    let resultText = '';

    if (months >= 1200) {
      resultText = Com um investimento mensal de R$ ${valorAplicadoMensalmente.toLocaleString('pt-BR')} e capital inicial de R$ ${poupancaInicial.toLocaleString('pt-BR')} em ${tipoInvestimento} (retorno de ${(annualRate * 100).toFixed(1)}% a.a., inflação de ${(taxaInflacao * 100).toFixed(1)}% a.a.), pode levar mais de 100 anos para atingir a independência financeira com despesas anuais alvo de R$ ${despesasAnuaisAlvo.toLocaleString('pt-BR')}. Considere aumentar o investimento ou reduzir as despesas.;
    } else {
      resultText = Com um investimento mensal de R$ ${valorAplicadoMensalmente.toLocaleString('pt-BR')} e capital inicial de R$ ${poupancaInicial.toLocaleString('pt-BR')} em ${tipoInvestimento} (retorno de ${(annualRate * 100).toFixed(1)}% a.a., inflação de ${(taxaInflacao * 100).toFixed(1)}% a.a.), levaria aproximadamente ${years} anos para atingir a independência financeira, considerando despesas anuais alvo de R$ ${despesasAnuaisAlvo.toLocaleString('pt-BR')}.;
    }

    setResultadoAnosFI(resultText);
    falarTexto(resultText);
    setEstaCarregandoCalculadoraFI(false);
  };

  // Tópicos comuns para facilitar o acesso
  const topicosComuns = [
    "O que é inflação?",
    "Como começar a investir?",
    "O que são ações?",
    "O que são fundos de investimento?",
    "Benefícios da diversificação",
    "Risco e retorno em investimentos",
    "O que é renda fixa?",
    "Como funciona a bolsa de valores?",
  ];

  // Glossário de termos
  const glossarioTermos = [
    { term: "Ações", definition: "Pequenas partes de uma empresa que podem ser compradas e vendidas na bolsa de valores. Ao comprar ações, você se torna sócio da empresa." },
    { term: "FIIs (Fundos de Investimento Imobiliário)", definition: "Fundos que investem em empreendimentos imobiliários, como shoppings, escritórios e galpões. Você compra cotas do fundo e recebe rendimentos mensais dos aluguéis ou vendas." },
    { term: "Renda Fixa", definition: "Investimentos onde as regras de remuneração são definidas no momento da aplicação, como CDBs, Tesouro Direto e LCIs/LCAs. Geralmente são mais seguros." },
    { term: "Renda Variável", definition: "Investimentos cujo retorno não é previsível e pode variar, como ações e fundos de ações. Apresentam maior risco e maior potencial de retorno." },
    { term: "Diversificação", definition: "Estratégia de investimento que consiste em não colocar todos os ovos na mesma cesta, ou seja, investir em diferentes tipos de ativos para reduzir riscos." },
    { term: "Inflação", definition: "Aumento generalizado dos preços de bens e serviços, que resulta na diminuição do poder de compra do dinheiro ao longo do tempo." },
    { term: "CDI (Certificado de Depósito Interbancário)", definition: "Taxa de juros de referência para muitas aplicações de renda fixa no Brasil. Geralmente, as 'caixinhas' e CDBs rendem um percentual do CDI." },
    { term: "Liquidez", definition: "A facilidade e rapidez com que um investimento pode ser convertido em dinheiro sem perda significativa de valor." },
    { term: "Volatilidade", definition: "A intensidade e frequência das variações de preço de um ativo. Ativos mais voláteis têm maior risco e maior potencial de retorno." },
    { term: "Corretora de Investimentos", definition: "Instituição financeira que intermedeia a compra e venda de investimentos, como ações, FIIs e títulos de renda fixa." },
  ];


  return (
    // Contêiner principal com estilos Tailwind CSS para layout e fundo.
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-600 p-4 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-2xl w-full transform transition-all duration-500 hover:scale-105">
        {/* Título do aplicativo. */}
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4 animate-fade-in">
          Assistente de IA para Investidores
        </h1>
        {/* Descrição do aplicativo. */}
        <p className="text-lg text-gray-600 mb-6">
          Faça suas perguntas sobre investimentos, gere uma estratégia personalizada ou calcule sua independência financeira.
        </p>

        {/* Seção de Tópicos Comuns */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Tópicos Comuns para Iniciantes 💡</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topicosComuns.map((topic, index) => (
              <button
                key={index}
                onClick={() => lidarComPerguntaIA(topic)} // Passa o tópico para a função
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg shadow-md hover:bg-gray-200 transition-all duration-200 text-left text-sm"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Seção de Pergunta Geral */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Perguntas Livres ✨</h2>
          <div className="mb-6">
            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-y min-h-[100px]"
              placeholder="Ex: Qual a diferença entre ações e títulos?"
              value={perguntaUsuario}
              onChange={(e) => setPerguntaUsuario(e.target.value)}
              rows="4"
            ></textarea>
          </div>
          <button
            onClick={() => lidarComPerguntaIA()} // Chama sem argumento para usar o perguntaUsuario do estado
            disabled={estaCarregando || !perguntaUsuario.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {estaCarregando ? 'Aguarde...' : 'Perguntar à IA'}
          </button>

          {respostaIA && (
            <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg text-left shadow-inner">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Resposta da IA:</h2>
              <p className="text-gray-800 whitespace-pre-wrap">{respostaIA}</p>
            </div>
          )}
        </div>

        {/* Seção de Gerador de Estratégia de Investimento */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gerador de Estratégia de Investimento ✨</h2>
          <div className="mb-4 text-left">
            <label htmlFor="toleranciaRisco" className="block text-gray-700 text-sm font-bold mb-2">
              Sua Tolerância ao Risco:
            </label>
            <select
              id="toleranciaRisco"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={toleranciaRisco}
              onChange={(e) => setToleranciaRisco(e.target.value)}
            >
              <option value="Baixo">Baixo (Conservador)</option>
              <option value="Médio">Médio (Moderado)</option>
              <option value="Alto">Alto (Agressivo)</option>
            </select>
          </div>
          <div className="mb-6 text-left">
            <label htmlFor="objetivoInvestimento" className="block text-gray-700 text-sm font-bold mb-2">
              Seu Objetivo de Investimento:
            </label>
            <select
              id="objetivoInvestimento"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={objetivoInvestimento}
              onChange={(e) => setObjetivoInvestimento(e.target.value)}
            >
              <option value="Crescimento a Longo Prazo">Crescimento a Longo Prazo (Ex: Aposentadoria)</option>
              <option value="Renda Passiva">Renda Passiva (Ex: Dividendos)</option>
              <option value="Preservação de Capital">Preservação de Capital (Ex: Reserva de Emergência)</option>
              <option value="Comprar Casa">Comprar Casa</option>
              <option value="Educação dos Filhos">Educação dos Filhos</option>
            </select>
          </div>
          <button
            onClick={lidarComGeracaoEstrategia}
            disabled={estaCarregandoEstrategia}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {estaCarregandoEstrategia ? 'Gerando Estratégia...' : 'Gerar Estratégia de Investimento ✨'}
          </button>

          {estrategiaInvestimento && (
            <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg text-left shadow-inner">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Estratégia Sugerida pela IA:</h2>
              <p className="text-gray-800 whitespace-pre-wrap">{estrategiaInvestimento}</p>
            </div>
          )}
        </div>

        {/* Seção: Calculadora de Independência Financeira */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Calculadora de Independência Financeira 💰</h2>
          <p className="text-md text-gray-600 mb-4">
            Estime em quantos anos você pode atingir a independência financeira.
            <br/> <span className="text-sm text-red-500 font-semibold">Atenção: As taxas de retorno são estimativas e podem variar.</span>
          </p>
          <div className="mb-4 text-left">
            <label htmlFor="despesasAnuaisAlvo" className="block text-gray-700 text-sm font-bold mb-2">
              Despesas Anuais Alvo (R$):
            </label>
            <input
              type="number"
              id="despesasAnuaisAlvo"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={despesasAnuaisAlvo}
              onChange={(e) => setDespesasAnuaisAlvo(parseFloat(e.target.value) || 0)}
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: Se suas despesas mensais forem R$ 4.000, o anual seria R$ 48.000.</p>
          </div>
          <div className="mb-4 text-left">
            <label htmlFor="poupancaInicial" className="block text-gray-700 text-sm font-bold mb-2">
              Capital Inicial (R$):
            </label>
            <input
              type="number"
              id="poupancaInicial"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={poupancaInicial}
              onChange={(e) => setPoupancaInicial(parseFloat(e.target.value) || 0)}
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">O valor que você já tem guardado para investir.</p>
          </div>
          <div className="mb-4 text-left">
            <label htmlFor="tipoInvestimento" className="block text-gray-700 text-sm font-bold mb-2">
              Tipo de Investimento:
            </label>
            <select
              id="tipoInvestimento"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={tipoInvestimento}
              onChange={(e) => setTipoInvestimento(e.target.value)}
            >
              <option value="CDI">Caixinha / CDI (aprox. 8% a.a.)</option>
              <option value="Poupanca">Poupança (aprox. 6% a.a.)</option>
              <option value="FIIs">FIIs (Fundos Imobiliários) (aprox. 10% a.a.)</option>
              <option value="Acoes">Ações (aprox. 12% a.a.)</option>
              <option value="Personalizado">Personalizado (Definir Taxa)</option>
            </select>
            {tipoInvestimento === 'FIIs' && (
              <p className="text-xs text-gray-500 mt-1">
                Exemplos de FIIs populares: MXRF11, HGLG11, KNRI11. (Não são recomendações de investimento).
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              As taxas de retorno são estimativas e podem variar no mercado real.
            </p>
          </div>
          {tipoInvestimento === 'Personalizado' && (
            <div className="mb-4 text-left">
              <label htmlFor="retornoAnualPersonalizado" className="block text-gray-700 text-sm font-bold mb-2">
                Taxa de Retorno Anual Personalizada (%):
              </label>
              <input
                type="number"
                id="retornoAnualPersonalizado"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={(retornoAnualPersonalizado * 100).toFixed(2)}
                onChange={(e) => setRetornoAnualPersonalizado(parseFloat(e.target.value) / 100 || 0)}
                min="0"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">Insira a taxa de retorno anual esperada (ex: 7 para 7%).</p>
            </div>
          )}
          <div className="mb-4 text-left">
            <label htmlFor="taxaInflacao" className="block text-gray-700 text-sm font-bold mb-2">
              Taxa de Inflação Anual (%):
            </label>
            <input
              type="number"
              id="taxaInflacao"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={(taxaInflacao * 100).toFixed(2)}
              onChange={(e) => setTaxaInflacao(parseFloat(e.target.value) / 100 || 0)}
              min="0"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">Ajuste o cálculo para o poder de compra futuro (ex: 4 para 4%).</p>
          </div>
          <div className="mb-6 text-left">
            <label htmlFor="valorAplicadoMensalmente" className="block text-gray-700 text-sm font-bold mb-2">
              Valor Aplicado Mensalmente (R$):
            </label>
            <input
              type="number"
              id="valorAplicadoMensalmente"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={valorAplicadoMensalmente}
              onChange={(e) => setValorAplicadoMensalmente(parseFloat(e.target.value) || 0)}
              min="0"
            />
          </div>
          <button
            onClick={calcularIndependenciaFinanceira}
            disabled={estaCarregandoCalculadoraFI || valorAplicadoMensalmente < 0 || despesasAnuaisAlvo <= 0 || poupancaInicial < 0 || (tipoInvestimento === 'Personalizado' && retornoAnualPersonalizado <= 0) || taxaInflacao < 0}
            className="w-full px-6 py-3 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {estaCarregandoCalculadoraFI ? 'Calculando...' : 'Calcular Independência Financeira 🚀'}
          </button>

          {resultadoAnosFI && (
            <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg text-left shadow-inner">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Resultado:</h2>
              <p className="text-gray-800 whitespace-pre-wrap">{resultadoAnosFI}</p>
            </div>
          )}
        </div>

        {/* Nova Seção: Glossário de Termos Financeiros */}
        <div className="mb-8 p-6 border border-gray-200 rounded-lg shadow-sm text-left">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Glossário de Termos Financeiros 📚</h2>
          <p className="text-md text-gray-600 mb-4">
            Entenda os termos essenciais do mundo dos investimentos de forma simples.
          </p>
          <div className="space-y-4">
            {glossarioTermos.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{item.term}</h3>
                <p className="text-gray-700">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nova Seção: Dicas de Segurança e Alertas de Risco */}
        <div className="p-6 border border-red-300 bg-red-50 rounded-lg shadow-sm text-left">
          <h2 className="text-2xl font-semibold text-red-700 mb-4">Dicas de Segurança e Alertas de Risco ⚠</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>
              *Estude e Pesquise:* Nunca invista em algo que você não entende. Dedique tempo para aprender sobre os ativos.
            </li>
            <li>
              *Diversifique:* Não coloque todo o seu dinheiro em um único investimento. Espalhe seus investimentos para reduzir riscos.
            </li>
            <li>
              *Cuidado com Promessas de Ganhos Fáceis:* Se parece bom demais para ser verdade, provavelmente é. Desconfie de retornos muito altos e garantidos.
            </li>
            <li>
              *Entenda os Riscos:* Todo investimento tem risco. Compreenda os riscos associados a cada tipo de ativo antes de investir.
            </li>
            <li>
              *Comece Pequeno:* Para iniciantes, é recomendado começar com valores menores e investimentos mais conservadores.
            </li>
            <li>
              *Tenha uma Reserva de Emergência:* Antes de investir, certifique-se de ter uma reserva de dinheiro para imprevistos, equivalente a 6 a 12 meses das suas despesas.
            </li>
            <li>
              *Consulte um Profissional:* Para um planeamento financeiro mais complexo e personalizado, considere procurar um consultor financeiro certificado.
            </li>
          </ul>
        </div>

        {/* Área para exibir mensagens de erro globais */}
        {erro && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-bold">Erro:</p>
            <p>{erro}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Exporta o componente App como o padrão.
export default App;
