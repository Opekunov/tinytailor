// Jest setup to mock problematic modules
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

jest.mock('chalk', () => {
  const mockFunction = (str: string) => str;
  mockFunction.bold = mockFunction;
  return {
    __esModule: true,
    default: mockFunction,
    blue: mockFunction,
    cyan: { bold: mockFunction },
    green: mockFunction,
    red: mockFunction,
    yellow: mockFunction,
    bold: mockFunction,
    gray: mockFunction
  };
});

jest.mock('ora', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    start: jest.fn(() => ({
      succeed: jest.fn(),
      fail: jest.fn(),
      stop: jest.fn()
    })),
    succeed: jest.fn(),
    fail: jest.fn(),
    stop: jest.fn()
  }))
}));