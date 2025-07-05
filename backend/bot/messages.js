export const messages = {
  welcome: (name) => `👋 Привіт, ${name}!\n\nЩо хочеш зробити?`,
  
  unauthorized: '❌ Цей бот доступний лише для учасників турніру. Зверніться до адміністратора: @admin_username',
  
  betting: {
    chooseType: 'Оберіть тип ставки:',
    chooseGame: 'Оберіть гру:',
    chooseTeam: 'Оберіть команду:',
    enterMvp: 'Введіть username MVP гравця (з @):',
    confirmBet: (type, game, choice) => `Підтвердіть ставку:\n\n🎮 Гра: ${game}\n🎯 Тип: ${type}\n✅ Вибір: ${choice}\n💰 Ставка: 10 балів`,
    betPlaced: 'Ставка успішно зроблена! 🎉',
    betExists: 'Ви вже зробили ставку цього типу на цю гру!',
    invalidMvp: 'Введіть коректний username (починається з @)'
  },
  
  statistics: {
    myBets: 'Мої ставки',
    topPlayers: 'ТОП вболівальників',
    tournamentResults: 'Результати турніру',
    noBets: 'Ви ще не зробили жодної ставки',
    potentialWin: (points) => `💰 Потенційний виграш: до ${points} балів`
  },
  
  admin: {
    unauthorized: '❌ Ви не маєте прав адміністратора',
    menu: 'Панель адміністратора',
    uploadSuccess: 'Файл успішно завантажено',
    winnersSet: 'Переможці встановлені',
    mvpSet: 'MVP встановлено',
    calculationComplete: 'Розрахунок завершено'
  },
  
  error: {
    general: '❌ Виникла помилка. Спробуйте ще раз.',
    database: '❌ Помилка бази даних',
    fileUpload: '❌ Помилка завантаження файлу'
  }
};