import { messages } from '../backend/bot/messages.js';

describe('Bot Messages Tests', () => {
  test('повинен мати всі необхідні повідомлення', () => {
    expect(messages.welcome).toBeDefined();
    expect(messages.unauthorized).toBeDefined();
    expect(messages.betting).toBeDefined();
    expect(messages.statistics).toBeDefined();
    expect(messages.admin).toBeDefined();
    expect(messages.error).toBeDefined();
  });

  test('повідомлення привітання повинно бути функцією', () => {
    expect(typeof messages.welcome).toBe('function');
    expect(messages.welcome('Тест')).toContain('Тест');
  });

  test('повинен мати всі типи ставок', () => {
    expect(messages.betting.chooseType).toBeDefined();
    expect(messages.betting.chooseGame).toBeDefined();
    expect(messages.betting.chooseTeam).toBeDefined();
    expect(messages.betting.enterMvp).toBeDefined();
    expect(messages.betting.confirmBet).toBeDefined();
    expect(messages.betting.betPlaced).toBeDefined();
    expect(messages.betting.betExists).toBeDefined();
  });

  test('повинен мати всі адмін повідомлення', () => {
    expect(messages.admin.unauthorized).toBeDefined();
    expect(messages.admin.menu).toBeDefined();
    expect(messages.admin.calculationComplete).toBeDefined();
  });

  test('повинен мати всі повідомлення помилок', () => {
    expect(messages.error.general).toBeDefined();
    expect(messages.error.database).toBeDefined();
  });
});