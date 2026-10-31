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

    // Captura a data, o dia da semana E as horas/minutos atuais do sistema
    const agora = new Date();
    const dataEHoraAtual = agora.toLocaleString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const SYSTEM_PROMPT = `
Você é o J.A.R.V.I.S., o assistente virtual de inteligência artificial do Homem de Ferro.
Data e hora exatas do sistema em tempo real: ${dataEHoraAtual}.

REGRAS OBRIGATÓRIAS DE RESPOSTA:
1. Responda de forma cortês, elegante e direta, em NO MÁXIMO 1 ou 2 frases curtas.
2. Trate a usuária como "Senhorita".
3. Se perguntado sobre a data, dia ou HORÁRIO atual, responda com base exata nesta informação: ${dataEHoraAtual}. Exemplo: "Com certeza, Senhorita. Agora são..."
4. NUNCA invente horários ou datas.
5. NUNCA envie listas, números em tópicos, asteriscos (*), negritos ou parênteses como "(pausa)".
6. Responda de forma natural para ser lida por sintetizador de voz.
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