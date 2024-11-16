export default {
  async fetch(request, env, context) {
    // 检查是否运行在 Pages Functions 环境
    const isPages = env && env.hasOwnProperty("CUSTOMER_ID");

    // 从环境变量中获取参数
    const CUSTOMER_ID = isPages ? env.CUSTOMER_ID : globalThis.CUSTOMER_ID;
    const API_KEY = isPages ? env.API_KEY : globalThis.API_KEY;
    const TG_BOT_API = isPages ? env.TG_BOT_API : globalThis.TG_BOT_API;
    const CHAT_ID = isPages ? env.CHAT_ID : globalThis.CHAT_ID;

    // 验证环境变量
    if (!CUSTOMER_ID || !API_KEY || !TG_BOT_API || !CHAT_ID) {
      return new Response("缺少必要的环境变量，请在项目配置中添加。", { status: 500 });
    }

    // 域名列表
    const domains = ["google.com", "mashiro.fun", "example.com"];

    try {
      // 执行域名监控任务
      await monitorDomains(domains, { CUSTOMER_ID, API_KEY, TG_BOT_API, CHAT_ID });
      return new Response("域名监控任务完成！");
    } catch (error) {
      return new Response(`监控任务失败：${error.message}`, { status: 500 });
    }
  },
};

// 核心逻辑函数
async function monitorDomains(domains, config) {
  const { CUSTOMER_ID, API_KEY, TG_BOT_API, CHAT_ID } = config;

  for (const domain of domains) {
    const whoisData = await fetchWhoisData(domain, CUSTOMER_ID, API_KEY);
    if (whoisData.registered) {
      const expires = new Date(whoisData.expires);
      const now = new Date();
      const timeLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
      if (timeLeft <= 30) {
        await sendTelegramMessage(TG_BOT_API, CHAT_ID, `${domain} 即将到期，剩余 ${timeLeft} 天`);
      }
    } else {
      await sendTelegramMessage(TG_BOT_API, CHAT_ID, `${domain} 当前可以注册！`);
    }
  }
}

// 获取 Whois 数据
async function fetchWhoisData(domain, customerId, apiKey) {
  const url = `https://jsonwhoisapi.com/api/v1/whois?identifier=${domain}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${btoa(`${customerId}:${apiKey}`)}`,
    },
  });

  if (!response.ok) {
    throw new Error(`获取 Whois 数据失败：${response.statusText}`);
  }

  return response.json();
}

// 发送 Telegram 消息
async function sendTelegramMessage(apiKey, chatId, message) {
  const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  });

  if (!response.ok) {
    throw new Error(`发送 Telegram 消息失败：${response.statusText}`);
  }
}
