// Файл: api/sendIssue.js
export default async function handler(req, res) {
  // 1. Настраиваем CORS для разрешения запросов с ваших доменов
  // ЗАМЕНИТЕ 'ekodompro.vercel.app' на ваш Production Domain из панели Vercel!
  const allowedOrigins = [ 'https://ekodompro.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Обрабатываем предварительный запрос OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Работаем только с POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 4. Получаем данные из формы
    const { name, phone, message, houseForm, houseArea, buildTime, purpose } = await req.json();

    // 5. Отправляем запрос в GitHub API (токен берётся из переменной окружения Vercel)
    const ghResponse = await fetch('https://api.github.com/repos/ekodompro/ekodompro/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Serverless-Function'
      },
      body: JSON.stringify({
        title: `Заявка с сайта: ${name || 'Без имени'}`,
        body: `**Контактные данные:**\n- Имя: ${name || 'Не указано'}\n- Телефон: ${phone || 'Не указан'}\n\n**Детали проекта:**\n- Форма дома: ${houseForm}\n- Площадь: ${houseArea}\n- Сроки строительства: ${buildTime}\n- Назначение: ${purpose}\n\n**Сообщение:**\n${message || 'Нет сообщения'}`
      })
    });

    const data = await ghResponse.json();

    // 6. Возвращаем ответ от GitHub клиенту
    return res.status(ghResponse.status).json(data);

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
