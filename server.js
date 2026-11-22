process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

import express from 'express'; //WWWWOOOOOOOWW comando express que faz o servidor funcionar!
import cors from 'cors'; // Esse é o comando cors que permite que o servidor aceite requisições de diferentes origens
import dotenv from 'dotenv'; // Esse é o comando dotenv que permite que o servidor leia variáveis de ambiente de um arquivo .env (que é oarquivo da chave groq e openrouter, a ia principal e a reserva)

dotenv.config(); //configuracoes do dotenv pra ler o arquivo .env

const app = express();
app.use(cors());
app.use(express.json());

function gerarSystemPrompt() {
  const agora = new Date();
  const horaEDataAtual = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' de ' + agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
Você é o JARVIS, o assistente e companheiro pessoal de inteligência artificial do Homem de Ferro.
Data e hora exatas do sistema em tempo real: ${horaEDataAtual}.

PERSONALIDADE E TOM DE VOZ:
- Humano, acolhedor, elegante e atencioso, com um toque suave de humor britânico e empatia.
- Trate a usuária sempre como "Senhorita", de maneira carinhosa, respeitosa e natural, como um parceiro de confiança.
- Fale como um amigo próximo e inteligente: ouça com atenção, seja empático e vá direto ao ponto sem formalidades robóticas ou frias.

REGRAS OBRIGATÓRIAS DE COMUNICAÇÃO (LEITURA POR VOZ):
1. Mantenha a resposta em NO MÁXIMO 1 a 2 frases curtas e conversacionais.
2. Inicie diretamente com a resposta ou solução, conversando de forma fluida (evite frases robóticas como "Como posso ajudar?").
3. Se perguntado sobre data, hora ou status, informe com base nos dados reais do sistema: ${horaEDataAtual}.
4. Escreva números, horas e datas de forma clara e por extenso para soar natural ao ser lido por voz (ex: "dez horas e quinze minutos").
5. PROIBIDO usar Markdown, negritos (**), listas numeradas, tópicos, parênteses ou marcadores de ação como "(pausa)" e "*risos*".
6. Responda apenas com texto limpo, aquecido e fluido, ideal para sintetizador de voz.
`;
}

async function consultarIA({ url, apiKey, model, systemPrompt, userMessage }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 800
    })
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Erro HTTP ${response.status}`);
  }

  const texto = data.choices?.[0]?.message?.content;

  if (!texto) {
    throw new Error('O modelo retornou uma resposta vazia.');
  }

  return texto;
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ reply: 'Senhorita, não consegui ouvir o que você disse.' });
  }

  const systemPrompt = gerarSystemPrompt();

  //Aqui tem as ia's disponiveis, se a primeira falhar, ele tenta a segunda (reserva)
  const provedores = [
    {
      nome: 'Groq (Principal)',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
    },
    {
      nome: 'OpenRouter (Reserva)',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'openrouter/free'
    }
  ];

  for (const provedor of provedores) {
    if (!provedor.apiKey) continue;

    try {
      const respostaBruta = await consultarIA({
        url: provedor.url,
        apiKey: provedor.apiKey,
        model: provedor.model,
        systemPrompt,
        userMessage: message
      });

      const replyLimpa = respostaBruta
        .replace(/[*#_~`"“”]/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();

      return res.json({ reply: replyLimpa });

    } catch (erro) {
      console.warn(`⚠️ Falha no provedor ${provedor.nome}: ${erro.message}. Tentando próximo...`);
    }
  }

  return res.status(500).json({
    reply: 'Senhorita, todos os meus servidores de inteligência estão temporariamente inacessíveis.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 J.A.R.V.I.S. online e ouvindo na porta ${PORT}`);
});