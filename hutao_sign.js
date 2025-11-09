/**
 * HutaoCloud 签到 & Cookie 获取脚本
 *
 * 使用方法：
 *
 * 1. 签到模式 (定时任务):
 *    - 将此脚本配置为 Loon 的定时任务。
 *    - 脚本会读取持久化存储中的 HUTAO_COOKIE 来进行签到。
 *    - 如果 HUTAO_COOKIE 不存在或已失效，脚本会发送通知提醒您手动更新 Cookie。
 *
 * 2. 获取 Cookie 模式 (MitM):
 *    - 在 Loon 中配置 MitM，主机名指向 hutao.cloud。
 *    - 将此脚本与该 MitM 规则关联。
 *    - 使用 Safari 浏览器访问 https://hutao.cloud/user 并成功登录。
 *    - 脚本会自动捕获并存储包含 cf_clearance 的完整 Cookie 到 HUTAO_COOKIE。
 *    - 成功获取后会发送通知。
 */

// 脚本主逻辑：判断运行环境
// $request 是 Loon MitM 环境下特有的全局变量
if (typeof $request !== 'undefined' && $request) {
    // MitM 环境：执行获取 Cookie 的逻辑
    getCookie();
} else {
    // 定时任务环境：执行签到逻辑
    checkIn();
}

/**
 * 获取 Cookie 的函数
 * 在 MitM 环境下被调用
 */
function getCookie() {
    // First, check if the request is for the specific URL we care about.
    if ($request.url.indexOf("hutao.cloud/user") !== -1) {
        // --- Start Debug Logging ---
        console.log("Hutao Script Debug: Matched URL: " + $request.url);
        console.log("Hutao Script Debug: Request Headers: " + JSON.stringify($request.headers, null, 2));
        // --- End Debug Logging ---

        // Only if the URL matches, we then check for the Cookie header.
        if ($request.headers && $request.headers.cookie) {
            var capturedCookie = $request.headers.cookie;
            var storedCookie = $persistentStore.read("HUTAO_COOKIE");

            var expiryInfo = "";
            try {
                const expireInMatch = capturedCookie.match(/expire_in=([^;]+)/);
                if (expireInMatch && expireInMatch[1]) {
                    const expireInTimestamp = parseInt(expireInMatch[1], 10);
                    const expireDate = new Date(expireInTimestamp * 1000);
                    const options = {
                        timeZone: 'Asia/Shanghai',
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    };
                    const formattedDate = expireDate.toLocaleString('zh-CN', options);
                    expiryInfo = "\nCookie 过期时间: " + formattedDate;
                    console.log("Cookie 过期时间 (UTC+8): " + formattedDate);
                }
            } catch (e) {
                console.log("无法解析 Cookie 过期时间: " + e);
            }

            if (storedCookie !== capturedCookie) {
                var title = "HutaoCloud Cookie 更新成功";
                var subtitle = "新的 Cookie 已保存";
                var body = "HUTAO_COOKIE=" + capturedCookie + expiryInfo;
                console.log(title + "\n" + subtitle + "\n" + body);
                $persistentStore.write(capturedCookie, "HUTAO_COOKIE");
                $notification.post(title, subtitle, body);
                checkIn(); // Call checkIn after successful cookie update
            } else {
                var title = "HutaoCloud Cookie 获取成功";
                var subtitle = "Cookie 无变化";
                var body = "HUTAO_COOKIE=" + capturedCookie + expiryInfo;
                console.log(title + "\n" + subtitle + "\n" + body);
                $notification.post(title, subtitle, body);
                checkIn(); // Call checkIn when cookie is unchanged
            }
        } else {
            // If the URL is correct but there's no cookie, it's a genuine failure.
            var title = "HutaoCloud Cookie 获取失败";
            var subtitle = "请求头中未找到 Cookie";
            var body = "请确保您已成功登录 hutao.cloud/user。";
            console.log(title + "\n" + subtitle + "\n" + body);
            $notification.post(title, subtitle, body);
            $done({}); // Only call $done if cookie acquisition failed
        }
    } else {
        // For any other URL, do nothing and let the request proceed silently.
        $done({});
    }
}

/**
 * 签到函数
 * 在定时任务环境下被调用
 */
function checkIn() {
    var storedCookie = $persistentStore.read("HUTAO_COOKIE");

    if (!storedCookie) {
        var title = "HutaoCloud 签到失败";
        var subtitle = "Cookie 未设置";
        var body = "请先使用浏览器登录 hutao.cloud/user 并运行此脚本的 MitM 模式获取 Cookie。";
        console.log(title + "\n" + subtitle + "\n" + body);
        $notification.post(title, subtitle, body);
        $done();
        return;
    }

    var expiryInfo = "";
    try {
        const expireInMatch = storedCookie.match(/expire_in=([^;]+)/);
        if (expireInMatch && expireInMatch[1]) {
            const expireInTimestamp = parseInt(expireInMatch[1], 10);
            const expireDate = new Date(expireInTimestamp * 1000);
            const options = {
                timeZone: 'Asia/Shanghai',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            };
            const formattedDate = expireDate.toLocaleString('zh-CN', options);
            expiryInfo = "\nCookie 过期时间: " + formattedDate;
            console.log("Cookie 过期时间 (UTC+8): " + formattedDate);
        }
    } catch (e) {
        console.log("无法解析 Cookie 过期时间: " + e);
    }

    var baseHeaders = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Connection": "keep-alive",
        "Referer": "https://hutao.cloud/user",
        "Cookie": storedCookie
    };

    var req = {
        url: "https://hutao.cloud/user/checkin",
        headers: baseHeaders,
        method: "POST"
    };

    $httpClient.post(req, function(err, resp, data) {
        if (err) {
            var title = "HutaoCloud 签到请求失败";
            var subtitle = "";
            var body = err + expiryInfo;
            console.log(title + "\n" + subtitle + "\n" + body);
            $notification.post(title, subtitle, body);
            $done();
            return;
        }

        try {
            var jsonData = JSON.parse(data);
            if (jsonData.ret === 1) {
                var msg = "签到成功: " + jsonData.msg + "\n总流量: " + jsonData.traffic + "\n今日已用: " + jsonData.trafficInfo.todayUsedTraffic + "\n总共已用: " + jsonData.trafficInfo.lastUsedTraffic + "\n剩余流量: " + jsonData.trafficInfo.unUsedTraffic + expiryInfo;
                console.log("HutaoCloud 签到结果\n" + msg);
                $notification.post("HutaoCloud 签到结果", "", msg);
            } else if (jsonData.msg && jsonData.msg.indexOf("已经签到") !== -1) {
                var title = "HutaoCloud 签到结果";
                var subtitle = "";
                var body = jsonData.msg + expiryInfo;
                console.log(title + "\n" + subtitle + "\n" + body);
                $notification.post(title, subtitle, body);
            } else {
                // 签到失败，很可能是 Cookie 过期
                var title = "HutaoCloud 签到失败";
                var subtitle = "Cookie 可能已过期";
                var body = "请使用浏览器重新登录 hutao.cloud/user 并运行此脚本的 MitM 模式更新 Cookie。" + expiryInfo;
                console.log(title + "\n" + subtitle + "\n" + body);
                $notification.post(title, subtitle, body);
            }
        } catch (e) {
            // 响应不是 JSON，说明被重定向到了登录页或 Cloudflare 验证页，Cookie 失效
            var title = "HutaoCloud 签到失败";
            var subtitle = "Cookie 已失效";
            var body = "请使用浏览器重新登录 hutao.cloud/user 并运行此脚本的 MitM 模式更新 Cookie。错误: " + e.toString() + expiryInfo;
            console.log(title + "\n" + subtitle + "\n" + body);
            $notification.post(title, subtitle, body);
        }
        $done();
    });
}
