# Regimon
一个基于**Cloudflare workers**和 **TG Bot** 的域名注册查询工具。   
定时查询whois信息判断域名**是否可以注册**和标记到期时间。  
用于检测你喜欢的域名的**到期时间**  
方便你在这个域名到期时去注册 (前人不续期的话)    
并将信息发送到TG。    

**效果展示**  
![1000125295.jpg](https://img.yukino.top/file/1731826036649_1000125295.jpg)

## 1.准备工作  
1. 申请TG机器人并获取**BOT_TOKEN**和**CHAT_ID**  
**暂略**

2. 注册**免费**域名查询api网站并获取token和账号id  
这个网站提供**每个月1000次**的api查询，足够我们个人使用了  
[网址在这里](https://jsonwhoisapi.com "点击前往注册")  
![aa](https://img.yukino.top/file/1731828022705_%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202024-11-17%20140942.png)


## 2.开始配置cloudflare workers
1. 创建workers项目  
首先打开我们搭大善人cloudflare
![2024-11-17-165245.png](https://img.yukino.top/file/1731833748994_2024-11-17-165245.png)  
2. 编辑代码
![2024-11-17_165424.png](https://img.yukino.top/file/1731833748465_2024-11-17_165424.png)
3. 复制代码进去并保存
[代码在这](https://github.com/ccity3/RegiMon/blob/main/workers.js)
![2024-11-17_170024.png](https://img.yukino.top/file/1731834168506_2024-11-17_170024.png)
4. 添加环境变量  
   `TG_BOT_API`：你的tg_bot的token  
   `CHAT_ID`：你的账号或群组、频道的chat_id  
   `CUSTOMER_ID`：域名查询api的账号  
   `API_KEY`：刚刚注册的域名查询的api  
   `DOMAINS`：要查询的域名
   ![变量](https://img.yukino.top/file/1731828028498_%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202024-11-17%20142257.png)
   **要查询的域名像这样添加**
   ![域名添加](https://img.yukino.top/file/1731828027293_%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202024-11-17%20143949.png)
1. 添加定时任务  
   使用cron表达式添加定时任务
   ![定时任务](https://img.yukino.top/file/1731828025618_%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202024-11-17%20142350.png)

## 3.检查是否部署成功
这个项目提供了**两种手动触发**查询方式
1. 在编辑代码处手动触发
   - 点击**设置时间**
   - 再点击**触发计划事件**
   - 触发之后前往tg查看是否收到消息。
   ![查询](https://img.yukino.top/file/1731828030871_%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202024-11-17%20142418.png)
2. 在网址后加`/start`手动触发扫描
   - 不需要添加自定义域名
   - 使用大善人分配到的workers.dev域名即可
   - 在后面添加`/start`即可手动开始一次任务
   ![2024-11-17_171956.png](https://img.yukino.top/file/1731835257354_2024-11-17_171956.png)

## 4.效果展示  
![1000125295.jpg](https://img.yukino.top/file/1731826036649_1000125295.jpg)
