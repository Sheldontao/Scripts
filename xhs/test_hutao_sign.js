// test_hutao_sign.js
// 这是一个测试工具，用于在 Node.js 环境中运行 hutao_sign.js 脚本，
// 通过模拟 Loon 的特定 API 来验证脚本逻辑。

const path = require('path');

// --- 模拟 Loon 环境 ---

// 模拟持久化存储
global.$persistentStore = {
    data: {
        'HUTAO_EMAIL': '51hhxxttxsxt@gmail.com',
        'HUTAO_PASSWORD': 'bajzat-tuccub-4vErny'
        // HUTAO_COOKIE is intentionally not set to test the login flow
    },
    read: function(key) {
        console.log(`[Loon Mock] 读取持久化数据: ${key}`);
        return this.data[key];
    },
    write: function(value, key) {
        console.log(`[Loon Mock] 写入持久化数据: "${key}"`);
        if (key === 'HUTAO_COOKIE') {
            console.log(`[Loon Mock] 生成的模拟 Cookie 是: ${value}`);
        }
        this.data[key] = value;
        return true;
    }
};

// 模拟通知
global.$notification = {
    post: function(title, subtitle, body) {
        console.log("\n--- 📢 模拟通知 ---");
        console.log(`标题: ${title}`);
        console.log(`副标题: ${subtitle}`);
        console.log(`内容: ${body}`);
        console.log("---------------------\n");
    }
};

const https = require('https');
const { URL } = require('url');

// --- 真实 HTTP 客户端 ---
global.$httpClient = {
    get: function(options, callback) {
        console.log(`[Real HTTP] 发起 GET 请求: ${options.url}`);
        const url = new URL(options.url);
        const reqOptions = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: options.headers || {}
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`[Real HTTP] GET 请求成功: ${options.url}`);
                callback(null, { headers: res.headers }, data);
            });
        });

        req.on('error', (e) => {
            console.error(`[Real HTTP] GET 请求错误: ${e.message}`);
            callback(e, null, null);
        });

        req.end();
    },
    post: function(options, callback) {
        console.log(`[Real HTTP] 发起 POST 请求: ${options.url}`);
        const url = new URL(options.url);
        const postData = options.body || '';

        const reqOptions = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                ...options.headers,
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`[Real HTTP] POST 请求成功: ${options.url}`);
                callback(null, { headers: res.headers }, data);
            });
        });

        req.on('error', (e) => {
            console.error(`[Real HTTP] POST 请求错误: ${e.message}`);
            callback(e, null, null);
        });

        req.write(postData);
        req.end();
    }
};

// 模拟脚本结束
global.$done = function(value = {}) {
    console.log("[Loon Mock] 脚本执行完毕 $done()");
    process.exit(0);
};

// --- 脚本执行 ---

// 确保 $request 未定义，以触发定时任务 (checkIn) 逻辑
if (typeof global.$request !== 'undefined') {
    delete global.$request;
}

console.log("--- 开始测试 hutao_sign.js ---");
console.log("模拟 Loon 定时任务环境...");

// 加载并执行 hutao_sign.js
const scriptPath = path.join(__dirname, '../hutao_sign.js');

try {
    console.log(`正在加载脚本: ${scriptPath}`);
    // Requiring the script will execute its main logic, which should call checkIn()
    require(scriptPath);
} catch (e) {
    console.error(`加载或执行 hutao_sign.js 失败: ${e}`);
    process.exit(1);
}
