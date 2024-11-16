export default {
    async fetch(request, env, context) {
      // 从环境变量中读取信息
      const CUSTOMER_ID = env.CUSTOMER_ID;
      const API_KEY = env.API_KEY;
      const TG_BOT_API = env.TG_BOT_API;
      const CHAT_ID = env.CHAT_ID;
  
      // 检查环境变量是否正确配置
      if (!CUSTOMER_ID || !API_KEY || !TG_BOT_API || !CHAT_ID) {
        return new Response('缺少环境变量，请在 Cloudflare Pages 的设置中添加。', { status: 500 });
      }
  
      // 要监控的域名列表
      const domains = ['google.com', 'mashiro.fun', 'example.com'];
  
      try {
        // 开始监控域名状态
        await monitorDomains(domains, { CUSTOMER_ID, API_KEY, TG_BOT_API, CHAT_ID });
        return new Response('域名监控任务完成。', { status: 200 });
      } catch (error) {
        return new Response(`监控任务出错：${error.message}`, { status: 500 });
      }
    },
  };
  
  // 监控域名的状态
  async function monitorDomains(domains, { CUSTOMER_ID, API_KEY, TG_BOT_API, CHAT_ID }) {
    for (const domain of domains) {
      try {
        const whoisData = await getWhoisInfo(domain, CUSTOMER_ID, API_KEY);
  
        // 检查注册状态
        if (whoisData.status === 'available') {
          await sendTelegramMessage(`域名 ${domain} 可以注册。`, TG_BOT_API, CHAT_ID);
        } else if (whoisData.expires) {
          const expirationDate = whoisData.expires;
          const shanghaiTime = convertToShanghaiTime(expirationDate); // 转换为上海时间
          const timeDiff = new Date(expirationDate) - Date.now();
  
          if (timeDiff <= 7 * 24 * 60 * 60 * 1000) {
            await sendTelegramMessage(`域名 ${domain} 即将到期（北京时间）：${shanghaiTime}`, TG_BOT_API, CHAT_ID);
          } else {
            await sendTelegramMessage(`域名 ${domain} 已注册，有效期至（北京时间）：${shanghaiTime}`, TG_BOT_API, CHAT_ID);
          }
        } else {
          await sendTelegramMessage(`无法获取 ${domain} 的清晰 WHOIS 信息。`, TG_BOT_API, CHAT_ID);
        }
      } catch (error) {
        await sendTelegramMessage(`检测域名 ${domain} 出错：${error.message}`, TG_BOT_API, CHAT_ID);
      }
    }
  }
  
  // 获取 WHOIS 信息
  async function getWhoisInfo(domain, CUSTOMER_ID, API_KEY) {
    const WHOIS_API_URL = `https://jsonwhoisapi.com/api/v1/whois?identifier=${domain}`;
    const response = await fetch(WHOIS_API_URL, {
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + btoa(`${CUSTOMER_ID}:${API_KEY}`),
      },
    });
  
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`无法获取 ${domain} 的 WHOIS 信息: ${errorData}`);
    }
  
    return await response.json();
  }
  
  // 转换 UTC 时间为上海时间
  function convertToShanghaiTime(utcDateString) {
    const date = new Date(utcDateString);
    const options = {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return date.toLocaleString('zh-CN', options);
  }
  
  // 发送 Telegram 消息
  async function sendTelegramMessage(message, TG_BOT_API, CHAT_ID) {
    const url = `https://api.telegram.org/bot${TG_BOT_API}/sendMessage`;
    const params = {
      chat_id: CHAT_ID,
      text: message,
    };
  
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }
  