FROM node:18-alpine

WORKDIR /app

# Встановлюємо необхідні інструменти для компіляції нативних модулів
RUN apk add --no-cache python3 make g++

# Копіюємо package файли
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --only=production

# Перебудовуємо нативні модулі для поточного середовища
RUN npm rebuild

# Копіюємо вихідний код
COPY . .

# Будуємо фронтенд
RUN npm run build

# Створюємо директорії для логів
RUN mkdir -p logs uploads

# Встановлюємо права
RUN chmod -R 755 /app

EXPOSE 3000

# Запускаємо сервер
CMD ["node", "backend/server.js"]