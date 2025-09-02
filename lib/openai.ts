// DEPRECATED: This file is kept for backward compatibility.
// Please use gemini.ts instead.

import { genAI, chooseSttModel as geminiChooseSttModel, chooseTextModel as geminiChooseTextModel } from "./gemini";

/**
 * @deprecated Use `genAI` from './gemini' instead
 */
export const openai = {
  // For backward compatibility, map to Gemini's implementation
  chat: {
    completions: {
      create: async (params: any) => {
        const model = genAI.getGenerativeModel({ model: params.model || 'gemini-pro' });
        const result = await model.generateContent(params.messages[0].content);
        const response = await result.response;
        return {
          choices: [{
            message: {
              content: response.text()
            }
          }]
        };
      }
    }
  }
};

/**
 * @deprecated Use `chooseSttModel` from './gemini' instead
 */
export function chooseSttModel() {
  return geminiChooseSttModel();
}

/**
 * @deprecated Use `chooseTextModel` from './gemini' instead
 */
export function chooseTextModel() {
  return geminiChooseTextModel();
}
