let isMonitoring = false;  // 避免重复监控

// 发送Telegram消息的函数
async function sendTelegramMessage(message, TG_BOT_API, CHAT_ID) {
  const url = `https://api.telegram.org/bot${TG_BOT_API}/sendMessage`;
  const params = { chat_id: CHAT_ID, text: message };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error(`Failed to send message: ${message}`);
    console.log(`Sent message: ${message}`);
  } catch (error) {
    console.error(`Error sending Telegram message: ${error.message}`);
  }
}

// 获取WHOIS信息的函数
async function getWhoisInfo(domain, WHOIS_API_URL, CUSTOMER_ID, API_KEY) {
  const response = await fetch(`${WHOIS_API_URL}${domain}`, {
    method: 'GET',
    headers: { 'Authorization': `Basic ${btoa(`${CUSTOMER_ID}:${API_KEY}`)}` },
  });
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Unable to fetch WHOIS info for ${domain}: ${errorData}`);
  }
  return response.json();
}

// 将UTC时间转换为北京时间
function convertToShanghaiTime(utcDateString) {
  const date = new Date(utcDateString);
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 监控域名
async function monitorDomains(DOMAINS, WHOIS_API_URL, CUSTOMER_ID, API_KEY, TG_BOT_API, CHAT_ID) {
  if (isMonitoring) return;
  isMonitoring = true;
  for (const domain of DOMAINS) {
    try {
      const whoisData = await getWhoisInfo(domain, WHOIS_API_URL, CUSTOMER_ID, API_KEY);
      if (whoisData.status === 'available') {
        await sendTelegramMessage(`域名 ${domain} 可以注册。`, TG_BOT_API, CHAT_ID);
      } else if (whoisData.expires) {
        const expirationDate = new Date(whoisData.expires);
        const shanghaiTime = convertToShanghaiTime(whoisData.expires);
        const message = expirationDate - Date.now() <= 7 * 24 * 60 * 60 * 1000
          ? `域名 ${domain} 即将到期（北京时间）：${shanghaiTime}`
          : `域名 ${domain} 已注册，且有效期至（北京时间）：${shanghaiTime}`;
        await sendTelegramMessage(message, TG_BOT_API, CHAT_ID);
      } else {
        await sendTelegramMessage(`无法获取 ${domain} 的WHOIS信息，可能可以注册该域名。`, TG_BOT_API, CHAT_ID);
      }
    } catch (error) {
      await sendTelegramMessage(`检查域名 ${domain} 时出错: ${error.message}`, TG_BOT_API, CHAT_ID);
    }
  }
  isMonitoring = false;
}

// 处理请求
async function handleRequest(request, env) {
  const { TG_BOT_API, CHAT_ID, CUSTOMER_ID, API_KEY, DOMAINS } = env;
  const WHOIS_API_URL = 'https://jsonwhoisapi.com/api/v1/whois?identifier=';
  const domainList = DOMAINS.split(',');

  if (request.url.endsWith('/start')) {
    if (!isMonitoring) {
      await monitorDomains(domainList, WHOIS_API_URL, CUSTOMER_ID, API_KEY, TG_BOT_API, CHAT_ID);
      return new Response('监控任务已开始。');
    } else {
      return new Response('监控任务正在执行，请稍后再试。');
    }
  }
  return new Response('访问 /start 启动监控任务');
}

export default {
  async scheduled(event, env) {
    console.log(`定时任务触发时间: ${event.scheduledTime}`);
    await handleRequest({ url: '/start' }, env);  // 触发监控任务
  },

  async fetch(request, env) {
    return handleRequest(request, env);
  }
};
