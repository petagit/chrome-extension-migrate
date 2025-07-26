import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

import { prisma } from './_lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'Missing file' });
    }

    const buffer = fs.readFileSync(file.filepath);
    const base64 = buffer.toString('base64');
    const imageUrl = `data:${file.mimetype};base64,${base64}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'You are an assistant that analyses images of monthly billing statements.\n' +
              'Task:\n' +
              '1. Identify every merchant or service that appears to be a **recurring subscription**.\n' +
              '2. For each one, if the statement shows the charge amount, convert that amount to **USD**. (Use today\'s FX rate if currency is not USD).\n' +
              'Return **ONLY** a JSON array of objects in this exact shape: [{"name": "Spotify", "amountUSD": 9.99}].\n' +
              'If an amount is unknown, omit the amountUSD field or set it to null.',
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'auto',
            },
          },
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
    });

    console.log('OpenAI raw response:', completion.choices[0].message.content);

    type ExtractionItem = { name: string; amountUSD?: number | null };
    let items: ExtractionItem[] = [];
    try {
      let rawContent = (completion.choices[0].message.content || '[]').trim();
      if (rawContent.startsWith('```')) {
        rawContent = rawContent
          .replace(/```[a-zA-Z]*\s*\n?/g, '')
          .replace(/```/g, '')
          .trim();
      }
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        parsed.forEach((elem) => {
          if (typeof elem === 'string') {
            items.push({ name: elem });
          } else if (typeof elem === 'object' && elem !== null) {
            if ('name' in elem && typeof (elem as any).name === 'string') {
              let amt: number | undefined = undefined;
              const cand = (elem as any).amountUSD ?? (elem as any).amount ?? (elem as any).price;
              if (typeof cand === 'number') amt = cand;
              else if (typeof cand === 'string') {
                const num = parseFloat(cand.replace(/[^0-9.]/g, ''));
                if (!isNaN(num)) amt = num;
              }
              items.push({
                name: (elem as any).name,
                amountUSD: amt,
              });
            } else {
              const keys = Object.keys(elem);
              if (keys.length === 1) {
                const key = keys[0];
                if (typeof key === 'string') {
                  let amt: number | null = null;
                  const val = (elem as any)[key];
                  if (typeof val === 'number') amt = val;
                  else if (typeof val === 'string') {
                    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                    if (!isNaN(num)) amt = num;
                  }
                  items.push({ name: key, amountUSD: amt ?? undefined });
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('JSON parse error', err);
    }

    items = items.slice(0, 20);

    const names = items.map((i) => i.name);

    if (req.query.raw === '1') {
      return res.status(200).json({ items });
    }

    if (names.length === 0) {
      return res.status(200).json({ matches: [], items });
    }

    const services = await prisma.subscriptionService.findMany({
      where: {
        name: {
          in: names,
          mode: 'insensitive',
        },
      },
      select: { name: true, category: true, cancellationLink: true },
    });

    const matches = services.map((s) => {
      const item = items.find((i) => i.name.toLowerCase() === s.name.toLowerCase());
      return { ...s, amountUSD: item?.amountUSD ?? null };
    });

    return res.status(200).json({ matches, items });
  } catch (error) {
    console.error('[DETECT_SUBSCRIPTIONS_POST]', error);
    return res.status(500).send('Internal Server Error');
  }
}
