// Файл: api/sendIssue.js
export default async function handler(req, res) {
  console.log('=== Функция sendIssue запущена ===');
  console.log('Метод запроса:', req.method);
  console.log('Заголовки Origin:', req.headers.origin);
  
  // 1. Настраиваем CORS
  const allowedOrigins = [
    'https://gkekodompro.ru', 
    'https://ekodompro.vercel.app',
    'https://ekodompro-git-main-shweds-projects.vercel.app',
    'https://ekodompro-klnu6y8rx-shweds-projects.vercel.app',
    'http://localhost:3000' // для локального тестирования
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // 2. OPTIONS запрос
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS запрос обработан');
    return res.status(200).end();
  }

  // 3. Только POST
  if (req.method !== 'POST') {
    console.log('Метод не POST:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Пытаемся прочитать тело запроса...');
    
    // Читаем тело запроса (правильный способ для Vercel)
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    
    console.log('Тело запроса (сырое):', body);
    
    // Парсим JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.error('Ошибка парсинга JSON:', parseError);
      return res.status(400).json({ error: 'Invalid JSON', details: parseError.message });
    }
    
    console.log('Полученные данные:', JSON.stringify(parsedBody, null, 2));
    
    const { name, phone, message, houseForm, houseArea, buildTime, purpose } = parsedBody;

    // 4. Проверяем наличие токена
    console.log('GH_TOKEN существует?:', !!process.env.GH_TOKEN);
    if (!process.env.GH_TOKEN) {
      console.error('GitHub токен не найден!');
      throw new Error('GitHub токен не найден в переменных окружения');
    }

    // 5. Формируем тело запроса для GitHub
    const issueTitle = `Заявка с сайта: ${name || 'Без имени'}`;
    const issueBody = `**Контактные данные:**\n- Имя: ${name || 'Не указано'}\n- Телефон: ${phone || 'Не указан'}\n\n**Детали проекта:**\n- Форма дома: ${houseForm || 'Не указана'}\n- Площадь: ${houseArea || 'Не указана'}\n- Сроки строительства: ${buildTime || 'Не указаны'}\n- Назначение: ${purpose || 'Не указано'}\n\n**Сообщение:**\n${message || 'Нет сообщения'}`;
    
    console.log('Отправляем в GitHub Issues...');
    console.log('Репозиторий: EkoDomPro/ekodompro');
    console.log('Заголовок issue:', issueTitle);

    // 6. Отправляем запрос в GitHub API
    const ghResponse = await fetch('https://api.github.com/repos/EkoDomPro/ekodompro/issues', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Serverless-Function',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        title: issueTitle,
        body: issueBody,
        labels: ['заявка-с-сайта']
      })
    });

    console.log('GitHub ответ статус:', ghResponse.status);
    console.log('GitHub ответ OK?:', ghResponse.ok);
    
    const data = await ghResponse.json();
    console.log('GitHub ответ тело:', JSON.stringify(data, null, 2));

    if (!ghResponse.ok) {
      console.error('GitHub API вернул ошибку:', data);
      return res.status(ghResponse.status).json({
        error: 'GitHub API error',
        details: data.message || 'Unknown error',
        documentation_url: data.documentation_url || ''
      });
    }

    // 7. Возвращаем успешный ответ
    console.log('Успешно создан Issue:', data.number);
    return res.status(200).json({
      success: true,
      message: 'Заявка успешно создана!',
      issueNumber: data.number,
      issueUrl: data.html_url,
      issueId: data.id
    });

  } catch (error) {
    console.error('ОШИБКА в функции:', error.message);
    console.error('Стек ошибки:', error.stack);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
