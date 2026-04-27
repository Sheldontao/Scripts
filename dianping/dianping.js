const url = $request.url;

if (url.includes("/dpmobile") || url.includes("/goodsawardpic")) {
    const header = $request.headers;
    const traceKey1 = Object.keys(header).find(key => /^m-(shark-)?traceid$/i.test(key));
    const traceKey2 = Object.keys(header).find(key => /^(ai|dt|al|u)$/i.test(key));
    const headopt1 = traceKey1 ? header[traceKey1] : null;
    const headopt2 = traceKey2 ? header[traceKey2] : null;

    if (headopt1 && !headopt2) {
        $done({body: "", headers: "", status: "HTTP/1.1 404 Not Found"});
    } else if (url.includes(".gif")) {
        const hexString = "47494638396101000100800000000000ffffff21f90401000000002c000000000100010000020144003b";
        const respHeader = {};
        respHeader["Content-Type"] = "image/gif";
        respHeader["Content-length"] = 42;
        respHeader["Connection"] = "close";
        $done({bodyBytes: hexStringToArrayBuffer(hexString), headers: respHeader, status: "HTTP/1.1 200 OK"});
    } else {
        $done({});
    }
} else if (url.includes("/picassovc")) {
    if (!$response.body) $done({});
    const body = $response.body;

    if (typeof body === "string") {
        let modified = body;
        if (modified.includes("WedgetCard")) {
            modified = modified.replace(/function WedgetCard/g, "function WedgetCard0");
            modified = modified.replace(/WedgetCard\s*=/g, "WedgetCard0=");
            modified = modified.replace(/new WedgetCard/g, "new WedgetCard0");
        }
        $done({body: modified});
    } else if (body instanceof Uint8Array) {
        $done({});
    } else {
        $done({});
    }
} else {
    const adPatterns = [
        "adunionulandpage",
        "peanutfloat",
        "peanutalert",
        "peanutbubble",
        "homegrowthhacking",
        "floataudioplay",
        "floataudioplayer",
        "floatfeedcomment",
        "checkin-float",
        "brand-marketing"
    ];

    for (const pattern of adPatterns) {
        if (url.includes(pattern)) {
            $done({});
            return;
        }
    }

    if ($response && $response.body && url.includes("mapi.dianping.com")) {
        const body = $response.body;
        if (typeof body === "string") {
            try {
                const json = JSON.parse(body);
                const cleaned = removeAdData(json);
                if (cleaned !== json) {
                    $done({body: JSON.stringify(cleaned)});
                    return;
                }
            } catch (e) {}
        }
    }

    $done({});
}

function removeAdData(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) {
        const filtered = obj.filter(item => {
            if (!item || typeof item !== "object") return true;
            const s = JSON.stringify(item).toLowerCase();
            return !s.includes("\u5e7f\u544a") &&
                   !s.includes("isad") &&
                   !s.includes("is_ad") &&
                   !(item.isAd === true) &&
                   !(item.is_ad === true) &&
                   !(item.type === "ad") &&
                   !(item.adType);
        }).map(item => removeAdData(item));
        return filtered;
    }
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === "object" && val !== null) {
            obj[key] = removeAdData(val);
        }
    }
    return obj;
}

function hexStringToArrayBuffer(hexString) {
    const cleanHex = hexString.replace(/[^0-9A-Fa-f]/g, "");
    const buffer = new ArrayBuffer(cleanHex.length / 2);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < cleanHex.length; i += 2) {
        view[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return buffer;
}