import { genAI, chooseSttModel, chooseTextModel } from '../lib/gemini';

describe('Gemini Module', () => {
  describe('chooseSttModel', () => {
    it('should return the default STT model', () => {
      const model = chooseSttModel();
      expect(model).toBe('gemini-pro');
    });
  });

  describe('chooseTextModel', () => {
    it('should return the default text model when no env var is set', () => {
      const model = chooseTextModel();
      expect(model).toBe('gemini-pro');
    });

    it('should return the model from env var when set', () => {
      process.env.GEMINI_MODEL = 'gemini-1.5-pro';
      const model = chooseTextModel();
      expect(model).toBe('gemini-1.5-pro');
      // Reset for other tests
      process.env.GEMINI_MODEL = 'gemini-pro';
    });
  });

  describe('genAI', () => {
    it('should be properly initialized with API key', () => {
      expect(genAI).toBeDefined();
      // The actual API key is not exposed, but we can check if the instance is created
      expect(genAI.getGenerativeModel).toBeDefined();
    });
  });
});
