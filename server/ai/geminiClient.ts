/**
 * Google Gemini GenAI Client Configuration
 */

import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export const geminiClient = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
