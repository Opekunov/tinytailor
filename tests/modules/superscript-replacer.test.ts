import { SuperscriptReplacer } from '../../src/modules/text-processor/superscript-replacer';
import { TinyTailorConfig } from '../../src/types';
import { TinyTailorLogger } from '../../src/utils/logger';

describe('SuperscriptReplacer', () => {
  let replacer: SuperscriptReplacer;
  let mockLogger: jest.Mocked<TinyTailorLogger>;
  let config: TinyTailorConfig;

  beforeEach(() => {
    mockLogger = {
      logTextProcessing: jest.fn(),
    } as any;

    config = {
      textProcessing: {
        superscriptReplacements: {
          enabled: true,
          replacements: [
            { from: 'м2', to: 'м<sup>2</sup>' },
            { from: 'м3', to: 'м<sup>3</sup>' },
            { from: 'км2', to: 'км<sup>2</sup>' },
            { from: 'см2', to: 'см<sup>2</sup>' },
          ],
        },
      },
    } as TinyTailorConfig;

    replacer = new SuperscriptReplacer(config, mockLogger);
  });

  describe('processText', () => {
    it('should replace м2 with superscript version', () => {
      const input = 'Площадь квартиры составляет 85 м2.';
      const expected = 'Площадь квартиры составляет 85 м<sup>2</sup>.';
      
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(1);
      expect(mockLogger.logTextProcessing).toHaveBeenCalledWith('test.html', 1, 'Superscript replacements');
    });

    it('should replace multiple units in same text', () => {
      const input = 'Площадь 100 м2, объем 300 м3, участок 5000 км2.';
      const expected = 'Площадь 100 м<sup>2</sup>, объем 300 м<sup>3</sup>, участок 5000 км<sup>2</sup>.';
      
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(3);
    });

    it('should handle case sensitivity', () => {
      const input = 'Размеры: 10 М2 и 5 м2.';
      const expected = 'Размеры: 10 м<sup>2</sup> и 5 м<sup>2</sup>.';
      
      const result = replacer.processText(input, 'test.html');
      
      // Should replace both uppercase and lowercase versions (case-insensitive by default)
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(2);
    });

    it('should not replace inside HTML tags', () => {
      const input = '<div data-area="м2">Площадь составляет 50 м2</div>';
      const expected = '<div data-area="м2">Площадь составляет 50 м<sup>2</sup></div>';
      
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(1);
    });

    it('should not replace if already in superscript tags', () => {
      const input = 'Площадь <sup>м2</sup> уже в теге, но эти 100 м2 нужно заменить.';
      const expected = 'Площадь <sup>м2</sup> уже в теге, но эти 100 м<sup>2</sup> нужно заменить.';
      
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(1);
    });

    it('should use word boundaries to avoid partial matches', () => {
      const input = 'Строка с частичным вхождением: зам2 и м2онстр, но есть и нормальные 15 м2.';
      const expected = 'Строка с частичным вхождением: зам2 и м2онстр, но есть и нормальные 15 м<sup>2</sup>.';
      
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(1);
    });

    it('should not process when disabled', () => {
      config.textProcessing.superscriptReplacements.enabled = false;
      replacer = new SuperscriptReplacer(config, mockLogger);
      
      const input = 'Площадь 100 м2.';
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toBe(input);
      expect(result.replacements).toBe(0);
      expect(mockLogger.logTextProcessing).not.toHaveBeenCalled();
    });

    it('should handle complex HTML with multiple replacements', () => {
      const input = `
        <div class="property">
          <h3>Квартира площадью 120 м2</h3>
          <p>Жилая площадь: 80 м2</p>
          <p>Кухня: 15 м2</p>
          <small>Объем помещения: 300 м3</small>
        </div>
      `;
      
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toContain('120 м<sup>2</sup>');
      expect(result.content).toContain('80 м<sup>2</sup>');
      expect(result.content).toContain('15 м<sup>2</sup>');
      expect(result.content).toContain('300 м<sup>3</sup>');
      expect(result.replacements).toBe(4);
    });

    it('should handle empty replacements array', () => {
      config.textProcessing.superscriptReplacements.replacements = [];
      replacer = new SuperscriptReplacer(config, mockLogger);
      
      const input = 'Площадь 100 м2.';
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toBe(input);
      expect(result.replacements).toBe(0);
    });

    it('should handle custom replacements', () => {
      config.textProcessing.superscriptReplacements.replacements = [
        { from: 'ft2', to: 'ft<sup>2</sup>' },
        { from: 'in2', to: 'in<sup>2</sup>' },
      ];
      replacer = new SuperscriptReplacer(config, mockLogger);
      
      const input = 'Area: 1000 ft2 and smaller area 144 in2.';
      const expected = 'Area: 1000 ft<sup>2</sup> and smaller area 144 in<sup>2</sup>.';
      
      const result = replacer.processText(input, 'test.html');
      
      expect(result.content).toBe(expected);
      expect(result.replacements).toBe(2);
    });
  });
});