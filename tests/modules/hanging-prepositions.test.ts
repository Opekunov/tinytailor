import { HangingPrepositionsProcessor } from '../../src/modules/text-processor/hanging-prepositions';
import { TinyTailorConfig } from '../../src/types';
import { TinyTailorLogger } from '../../src/utils/logger';

describe('HangingPrepositionsProcessor', () => {
  let processor: HangingPrepositionsProcessor;
  let mockLogger: jest.Mocked<TinyTailorLogger>;
  let config: TinyTailorConfig;

  beforeEach(() => {
    mockLogger = {
      logTextProcessing: jest.fn(),
    } as any;

    config = {
      textProcessing: {
        hangingPrepositions: {
          enabled: true,
          fileExtensions: ['.html', '.vue', '.blade.php'],
          prepositions: ['в', 'на', 'и', 'а', 'с', 'для', 'от', 'до', 'за', 'под'],
        },
      },
    } as TinyTailorConfig;

    processor = new HangingPrepositionsProcessor(config, mockLogger);
  });

  describe('processText', () => {
    it('should replace spaces after prepositions with &nbsp;', () => {
      const input = 'Это текст с предлогами в начале предложения.';
      const expected = 'Это текст с&nbsp;предлогами в&nbsp;начале предложения.';
      
      const result = processor.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(2);
      expect(mockLogger.logTextProcessing).toHaveBeenCalledWith('test.html', 2, 'Hanging prepositions fixed');
    });

    it('should handle multiple prepositions correctly', () => {
      const input = 'Он работает в офисе и дома для компании.';
      const expected = 'Он работает в&nbsp;офисе и&nbsp;дома для&nbsp;компании.';
      
      const result = processor.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(3);
    });

    it('should not replace prepositions inside HTML tags', () => {
      const input = '<div class="text-center">Текст в контейнере</div>';
      const expected = '<div class="text-center">Текст в&nbsp;контейнере</div>';
      
      const result = processor.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(1);
    });

    it('should handle HTML with attributes correctly', () => {
      const input = '<a href="/link" title="Ссылка на страницу">Переход на сайт</a>';
      const expected = '<a href="/link" title="Ссылка на страницу">Переход на&nbsp;сайт</a>';
      
      const result = processor.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(1);
    });

    it('should not process when disabled', () => {
      config.textProcessing.hangingPrepositions.enabled = false;
      processor = new HangingPrepositionsProcessor(config, mockLogger);
      
      const input = 'Текст с предлогами в начале.';
      const result = processor.processText(input, 'test.html');
      
      expect(result.content).toBe(input);
      expect(result.replacements).toBe(0);
      expect(mockLogger.logTextProcessing).not.toHaveBeenCalled();
    });

    it('should handle empty prepositions list', () => {
      config.textProcessing.hangingPrepositions.prepositions = [];
      processor = new HangingPrepositionsProcessor(config, mockLogger);
      
      const input = 'Текст с предлогами в начале.';
      const result = processor.processText(input, 'test.html');
      
      expect(result.content).toBe(input);
      expect(result.replacements).toBe(0);
    });

    it('should handle complex HTML structure', () => {
      const input = `
        <div class="content">
          <p>Первый абзац с предлогом в начале.</p>
          <p>Второй абзац и еще один предлог для примера.</p>
        </div>
      `;
      
      const result = processor.processText(input, 'test.html');
      
      expect(result.content).toContain('с&nbsp;предлогом');
      expect(result.content).toContain('в&nbsp;начале');
      expect(result.content).toContain('и&nbsp;еще');
      expect(result.content).toContain('для&nbsp;примера');
      expect(result.replacements).toBe(4);
    });

    it('should not replace prepositions at the end of sentences', () => {
      const input = 'Куда ты идешь? В магазин за хлебом.';
      const expected = 'Куда ты идешь? В&nbsp;магазин за&nbsp;хлебом.';
      
      const result = processor.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(2);
    });
  });
});