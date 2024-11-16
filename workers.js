// 发送Telegram消息的函数
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
  
  // 获取WHOIS信息的函数
  async function getWhoisInfo(domain, CUSTOMER_ID, API_KEY) {
    const WHOIS_API_URL = 'https://jsonwhoisapi.com/api/v1/whois?identifier=';
    const response = await fetch(`${WHOIS_API_URL}${domain}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${CUSTOMER_ID}:${API_KEY}`),  // 使用Basic认证
      },
    });
  
    console.log(`Requesting Whois for ${domain}...`);
    console.log(`Response status: ${response.status}`);
  
    if (!response.ok) {
      const errorData = await response.text();  // 获取详细的错误信息
      console.log('Error response data:', errorData);
      throw new Error(`无法获取 ${domain} 的WHOIS信息: ${errorData}`);
    }
  
    const data = await response.json();
    console.log(`WHOIS Data for ${domain}:`, JSON.stringify(data, null, 2));
  
    return data;
  }
  
  // 将UTC时间转换为北京时间
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
  
  // 监控多个域名的状态
  async function monitorDomains(domains, env) {
    const { CUSTOMER_ID, API_KEY, TG_BOT_API, CHAT_ID } = env;
  
    for (const domain of domains) {
      try {
        const whoisData = await getWhoisInfo(domain, CUSTOMER_ID, API_KEY);
  
        // 检查注册状态
        if (whoisData.status && whoisData.status === 'available') {
          await sendTelegramMessage(`域名 ${domain} 可以注册。`, TG_BOT_API, CHAT_ID);
        } else if (whoisData.expires) {
          const expirationDate = whoisData.expires;
          const shanghaiTime = convertToShanghaiTime(expirationDate);  // 将过期时间转换为上海时间
          console.log('Expiration Date in Shanghai Time:', shanghaiTime);
  
          // 如果域名将在7天内到期
          if (new Date(expirationDate) - Date.now() <= 7 * 24 * 60 * 60 * 1000) {
            await sendTelegramMessage(`域名 ${domain} 即将到期（北京时间）：${shanghaiTime}`, TG_BOT_API, CHAT_ID);
          } else {
            await sendTelegramMessage(`域名 ${domain} 已注册，且有效期至（北京时间）：${shanghaiTime}`, TG_BOT_API, CHAT_ID);
          }
        } else {
          await sendTelegramMessage(`无法获取 ${domain} 的清晰WHOIS信息，可能可以注册该域名。`, TG_BOT_API, CHAT_ID);
        }
      } catch (error) {
        await sendTelegramMessage(`检查域名 ${domain} 的WHOIS信息时出错: ${error.message}`, TG_BOT_API, CHAT_ID);
      }
    }
  }
  
  // Cloudflare Worker请求事件监听器
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
  
  // 处理请求的函数
  async function handleRequest(request) {
    const env = {
      CUSTOMER_ID: CUSTOMER_ID,  // 从环境变量获取customer_id
      API_KEY: API_KEY,          // 从环境变量获取api_key
      TG_BOT_API: TG_BOT_API,    // 从环境变量获取Telegram机器人API
      CHAT_ID: CHAT_ID           // 从环境变量获取聊天ID
    };
    
    const domains = ['google.com', 'mashiro.fun', 'example.com'];  // 需要监测的域名
    await monitorDomains(domains, env);  // 执行监控任务
    return new Response('域名监控已完成。');
  }
  