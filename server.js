import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Carrega as variáveis registradas no arquivo .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Instancia a API do Gemini usando a chave do .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Prompt de personalidade do S.E.X.T.A-.F.E.I.R.A.
const SYSTEM_PROMPT = `
Você é o S.E.X.T.A-.F.E.I.R.A., uma assistente virtual inteligente e cortês.
Responda de forma direta, concisa e natural para ser lida por voz.
Evite formatações de texto como negritos, listas ou blocos de código.
`;

// Rota para onde o seu HTML vai enviar o áudio transcrito
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: message,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Erro detalhado na API:', error);
    res.status(500).json({ reply: 'Senhor, identifiquei uma falha nos meus sistemas centrais.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🤖 S.E.X.T.A-.F.E.I.R.A. online e ouvindo na porta ${PORT}`);
});