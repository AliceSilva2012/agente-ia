process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error('OPENROUTER_API_KEY não foi encontrada no arquivo .env');
      return res.status(500).json({ reply: 'Senhorita, a chave de acesso do OpenRouter não foi configurada.' });
    }

    // Captura data e hora local em português
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

    const SYSTEM_PROMPT = `
Você é o J.A.R.V.I.S., o assistente e companheiro pessoal de inteligência artificial do Homem de Ferro.
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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-1b-instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Erro detalhado na API:', data.error);
      return res.status(500).json({ reply: 'Senhorita, identifiquei uma falha nos meus sistemas centrais.' });
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({ reply: 'Senhorita, identifiquei uma falha nos meus sistemas centrais.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🤖 J.A.R.V.I.S. online e ouvindo na porta ${PORT}`);
});