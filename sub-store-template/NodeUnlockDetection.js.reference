/*
 * 节点解锁查询
 * 感谢并修改自 https://raw.githubusercontent.com/KOP-XIAO/QuantumultX/master/Scripts/streaming-ui-check.js
 * 脚本功能：检查节点是否支持Dazn/Discovery/Param/Disney/Netflix/ChatGPT/YouTube解锁服务
 * 原作者：XIAO_KOP  keywos
 * 2025.6.7  修复ChatGPT检测（禁用308重定向） by dcpengx
 */
const NF_BASE_URL = "https://www.netflix.com/title/81280792";
const DISNEY_BASE_URL = "https://www.disneyplus.com";
const DISNEY_LOCATION_BASE_URL =
  "https://disney.api.edge.bamgrid.com/graph/v1/device/graphql";
const YTB_BASE_URL = "https://www.youtube.com/premium";
const Dazn_BASE_URL = "https://startup.core.indazn.com/misl/v5/Startup";
const Param_BASE_URL = "https://www.paramountplus.com/";

const Discovery_token_BASE_URL =
  "https://us1-prod-direct.discoveryplus.com/token?deviceId=d1a4a5d25212400d1e6985984604d740&realm=go&shortlived=true";
const Discovery_BASE_URL = "https://us1-prod-direct.discoveryplus.com/users/me";

const GPT_BASE_URL = "https://chat.openai.com/";
const GPT_RegionL_URL = "https://chat.openai.com/cdn-cgi/trace";

const Google_BASE_URL = "https://www.google.com/maps/timeline";

var inputParams = $environment.params;
var nodeName = inputParams.node;

let flags = new Map([
  ["AC", "🇦🇨"],
  ["AE", "🇦🇪"],
  ["AF", "🇦🇫"],
  ["AI", "🇦🇮"],
  ["AL", "🇦🇱"],
  ["AM", "🇦🇲"],
  ["AQ", "🇦🇶"],
  ["AR", "🇦🇷"],
  ["AS", "🇦🇸"],
  ["AT", "🇦🇹"],
  ["AU", "🇦🇺"],
  ["AW", "🇦🇼"],
  ["AX", "🇦🇽"],
  ["AZ", "🇦🇿"],
  ["BA", "🇧🇦"],
  ["BB", "🇧🇧"],
  ["BD", "🇧🇩"],
  ["BE", "🇧🇪"],
  ["BF", "🇧🇫"],
  ["BG", "🇧🇬"],
  ["BH", "🇧🇭"],
  ["BI", "🇧🇮"],
  ["BJ", "🇧🇯"],
  ["BM", "🇧🇲"],
  ["BN", "🇧🇳"],
  ["BO", "🇧🇴"],
  ["BR", "🇧🇷"],
  ["BS", "🇧🇸"],
  ["BT", "🇧🇹"],
  ["BV", "🇧🇻"],
  ["BW", "🇧🇼"],
  ["BY", "🇧🇾"],
  ["BZ", "🇧🇿"],
  ["CA", "🇨🇦"],
  ["CF", "🇨🇫"],
  ["CH", "🇨🇭"],
  ["CK", "🇨🇰"],
  ["CL", "🇨🇱"],
  ["CM", "🇨🇲"],
  ["CN", "🇨🇳"],
  ["CO", "🇨🇴"],
  ["CP", "🇨🇵"],
  ["CR", "🇨🇷"],
  ["CU", "🇨🇺"],
  ["CV", "🇨🇻"],
  ["CW", "🇨🇼"],
  ["CX", "🇨🇽"],
  ["CY", "🇨🇾"],
  ["CZ", "🇨🇿"],
  ["DE", "🇩🇪"],
  ["DG", "🇩🇬"],
  ["DJ", "🇩🇯"],
  ["DK", "🇩🇰"],
  ["DM", "🇩🇲"],
  ["DO", "🇩🇴"],
  ["DZ", "🇩🇿"],
  ["EA", "🇪🇦"],
  ["EC", "🇪🇨"],
  ["EE", "🇪🇪"],
  ["EG", "🇪🇬"],
  ["EH", "🇪🇭"],
  ["ER", "🇪🇷"],
  ["ES", "🇪🇸"],
  ["ET", "🇪🇹"],
  ["EU", "🇪🇺"],
  ["FI", "🇫🇮"],
  ["FJ", "🇫🇯"],
  ["FK", "🇫🇰"],
  ["FM", "🇫🇲"],
  ["FO", "🇫�"],
  ["FR", "🇫🇷"],
  ["GA", "🇬🇦"],
  ["GB", "🇬🇧"],
  ["HK", "🇭🇰"],
  ["HU", "🇭🇺"],
  ["ID", "🇮🇩"],
  ["IE", "🇮🇪"],
  ["IL", "🇮🇱"],
  ["IM", "🇮🇲"],
  ["IN", "🇮🇳"],
  ["IS", "🇮🇸"],
  ["IT", "🇮🇹"],
  ["JP", "🇯🇵"],
  ["KR", "🇰🇷"],
  ["LU", "🇱🇺"],
  ["MO", "🇲🇴"],
  ["MX", "🇲🇽"],
  ["MY", "🇲🇾"],
  ["NL", "🇳🇱"],
  ["PH", "🇵🇭"],
  ["RO", "🇷🇴"],
  ["RS", "🇷🇸"],
  ["RU", "🇷🇺"],
  ["RW", "🇷🇼"],
  ["SA", "🇸🇦"],
  ["SB", "��🇧"],
  ["SC", "🇸🇨"],
  ["SD", "🇸🇩"],
  ["SE", "🇸🇪"],
  ["SG", "🇸🇬"],
  ["TH", "🇹🇭"],
  ["TN", "🇹🇳"],
  ["TO", "🇹🇴"],
  ["TR", "🇹🇷"],
  ["TV", "🇹🇻"],
  ["TW", "🇨🇳"],
  ["UK", "🇬🇧"],
  ["UM", "🇺🇲"],
  ["US", "🇺🇸"],
  ["UY", "🇺🇾"],
  ["UZ", "🇺🇿"],
  ["VA", "🇻🇦"],
  ["VE", "🇻🇪"],
  ["VG", "🇻🇬"],
  ["VI", "🇻🇮"],
  ["VN", "🇻🇳"],
  ["ZA", "🇿🇦"],
]);

let result = {
  title: "  节点解锁查询",
  YouTube: "<b>YouTube: </b>检测失败，请重试� ❗️",
  Netflix: "<b>Netflix: </b>检测失败，请重试 ❗️",
  Dazn: "<b>Dazn: </b>检测失败，请重试 ❗️",
  Disney: "<b>Disneyᐩ: </b>检测失败，请重试 ❗️",
  Paramount: "<b>Paramountᐩ: </b>检测失败，请重试 ❗️",
  Discovery: "<b>Discoveryᐩ: </b>检测失败，请重试 ❗️",
};

let arrow = " ➟ ";

Promise.all([
  ytbTest(),
  disneyLocation(),
  nfTest(),
  daznTest(),
  parmTest(),
  discoveryTest(),
  gptTest(),
])
  .then((value) => {
    let content =
      "------------------------------------</br>" +
      [
        result["Dazn"],
        result["Discovery"],
        result["Paramount"],
        result["Disney"],
        result["Netflix"],
        result["ChatGPT"],
        result["YouTube"],
      ].join("</br></br>");
    content =
      content +
      "</br>------------------------------------</br>" +
      "<font color=#CD5C5C>" +
      "<b>节点</b> ➟ " +
      nodeName +
      "</font>";
    content =
      `<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` +
      content +
      `</p>`;
    console.log(content);
    $done({ title: result["title"], htmlMessage: content });
  })
  .catch((values) => {
    console.log("reject:" + values);
    let content =
      "------------------------------------</br>" +
      [
        result["Dazn"],
        result["Discovery"],
        result["Paramount"],
        result["Disney"],
        result["Netflix"],
        result["ChatGPT"],
        result["YouTube"],
      ].join("</br></br>");
    content =
      content +
      "</br>------------------------------------</br>" +
      "<font color=#CD5C5C>" +
      "<b>节点</b> ➟ " +
      nodeName +
      "</font>";
    content =
      `<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` +
      content +
      `</p>`;
    $done({ title: result["title"], htmlMessage: content });
  });

function disneyLocation() {
  return new Promise((resolve, reject) => {
    let params = {
      url: DISNEY_LOCATION_BASE_URL,
      node: nodeName,
      timeout: 5000, //ms
      headers: {
        "Accept-Language": "en",
        Authorization:
          "ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84",
        "Content-Type": "application/json",
        "User-Agent": "UA",
      },
      body: JSON.stringify({
        query:
          "mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }",
        variables: {
          input: {
            applicationRuntime: "chrome",
            attributes: {
              browserName: "chrome",
              browserVersion: "94.0.4606",
              manufacturer: "microsoft",
              model: null,
              operatingSystem: "windows",
              operatingSystemVersion: "10.0",
              osDeviceIds: [],
            },
            deviceFamily: "browser",
            deviceLanguage: "en",
            deviceProfile: "windows",
          },
        },
      }),
    };
    $httpClient.post(params, (errormsg, response, data) => {
      console.log("----------disney--------------");
      if (errormsg) {
        result["Discovery"] = "<b>Disneyᐩ:</b>检测失败 ❗️";
        resolve("disney request failed:" + errormsg);
        return;
      }
      if (response.status == 200) {
        console.log("disney request result:" + response.status);
        let resData = JSON.parse(data);
        if (resData?.extensions?.sdk?.session != null) {
          let {
            inSupportedLocation,
            location: { countryCode },
          } = resData?.extensions?.sdk?.session;
          if (inSupportedLocation == false) {
            result["Disney"] =
              "<b>Disneyᐩ:</b> 即将登陆 ➟ " +
              "⟦" +
              flags.get(countryCode.toUpperCase()) +
              "⟧ ⚠️";
            resolve();
          } else {
            result["Disney"] =
              "<b>Disneyᐩ:</b> 支持 ➟ " +
              "⟦" +
              flags.get(countryCode.toUpperCase()) +
              "⟧ 🎉";
            resolve({ inSupportedLocation, countryCode });
          }
        } else {
          result["Disney"] = "<b>Disneyᐩ:</b> 未支持 🚫 ";
          resolve();
        }
      } else {
        result["Discovery"] = "<b>Disneyᐩ:</b>检测失败 ❗️";
        resolve();
      }
    });
  });
}

function disneyHomePage() {
  return new Promise((resolve, reject) => {
    let params = {
      url: DISNEY_BASE_URL,
      node: nodeName,
      timeout: 5000, //ms
      headers: {
        "Accept-Language": "en",
        "User-Agent": UA,
      },
    };
    $httpClient.get(params, (errormsg, response, data) => {
      if (errormsg) {
        resolve(errormsg);
        return;
      }
      if (response.status != 200 || data.indexOf("unavailable") != -1) {
        resolve();
      } else {
        let match = data.match(/Region: ([A-Za-z]{2})[\s\S]*?CNBL: ([12])/);
        if (!match) {
          resolve();
        } else {
          let region = match[1];
          let cnbl = match[2];
          //console.log("homepage"+region+cnbl)
          resolve({ region, cnbl });
        }
      }
    });
  });
}

function ytbTest() {
  return new Promise((resolve, reject) => {
    let params = {
      url: YTB_BASE_URL,
      node: nodeName,
      timeout: 10000, //ms
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36",
      },
    };
    $httpClient.get(params, (errormsg, response, data) => {
      console.log("----------YTB--------------");
      if (errormsg) {
        console.log("YTB request failed:" + errormsg);
        result["YouTube"] = "<b>YouTube Premium: </b>检测失败 ❗️";
        resolve(errormsg);
        return;
      }
      if (response.status !== 200) {
        result["YouTube"] = "<b>YouTube Premium: </b>检测失败 ❗️";
        resolve(response.status);
      } else {
        console.log("YTB request data:" + response.status);
        if (data.indexOf("Premium is not available in your country") !== -1) {
          result["YouTube"] = "<b>YouTube Premium: </b>未支持 🚫";
          resolve("YTB test failed");
        } else if (
          data.indexOf("Premium is not available in your country") == -1
        ) {
          let region = "";
          let re = new RegExp('"GL":"(.*?)"', "gm");
          let ret = re.exec(data);
          if (ret != null && ret.length === 2) {
            region = ret[1];
          } else if (data.indexOf("www.google.cn") !== -1) {
            region = "CN";
          } else {
            region = "US";
          }
          console.log("YTB region:" + region);
          result["YouTube"] =
            "<b>YouTube Premium: </b>支持 " +
            arrow +
            "⟦" +
            flags.get(region.toUpperCase()) +
            "⟧ 🎉";
          resolve(region);
        } else {
          result["YouTube"] = "<b>YouTube Premium: </b>检测超时 🚦";
          resolve("timeout");
        }
      }
    });
  });
}

function daznTest() {
  return new Promise((resolve, reject) => {
    const extra = `{
            "LandingPageKey":"generic",
            "Platform":"web",
            "PlatformAttributes":{},
            "Manufacturer":"",
            "PromoCode":"",
            "Version":"2"
          }`;
    let params = {
      url: Dazn_BASE_URL,
      node: nodeName,
      timeout: 5000, //ms
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36",
        "Content-Type": "application/json",
      },
      body: extra,
    };
    $httpClient.post(params, (errormsg, response, data) => {
      console.log("----------DAZN--------------");
      if (errormsg) {
        console.log("Dazn request error:" + errormsg);
        result["Dazn"] = "<b>Dazn: </b>检测失败 ❗️";
        resolve(errormsg);
        return;
      }
      if (response.status == 200) {
        console.log("Dazn request data:" + response.status);
        let region = "";
        let re = new RegExp('"GeolocatedCountry":"(.*?)"', "gm");
        let ret = re.exec(data);
        if (ret != null && ret.length === 2) {
          region = ret[1];
          result["Dazn"] =
            "<b>Dazn: </b>支持 " +
            arrow +
            "⟦" +
            flags.get(region.toUpperCase()) +
            "⟧ 🎉";
        } else {
          result["Dazn"] = "<b>Dazn: </b>未支持 🚫";
        }
        resolve(region);
      } else {
        result["Dazn"] = "<b>Dazn: </b>检测失败 ❗️";
        resolve(response.status);
      }
    });
  });
}

function parmTest() {
  return new Promise((resolve, reject) => {
    let params = {
      url: Param_BASE_URL,
      node: nodeName,
      timeout: 5000, //ms
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36",
      },
    };
    $httpClient.get(params, (errormsg, response, data) => {
      console.log("----------PARAM--------------");
      if (errormsg) {
        console.log("Param request error:" + errormsg);
        result["Paramountᐩ"] = "<b>Paramountᐩ: </b>检测失败 ❗️";
        resolve(errormsg);
        return;
      }
      console.log("param result:" + response.status);
      if (response.status == 200) {
        result["Paramount"] = "<b>Paramountᐩ: </b>支持 🎉 ";
        resolve();
      } else if (response.status == 302) {
        result["Paramount"] = "<b>Paramountᐩ: </b>未支持 🚫";
        resolve();
      } else {
        result["Paramount"] = "<b>Paramountᐩ: </b>检测失败 ❗️";
        resolve();
      }
    });
  });
}

function discoveryTest() {
  return new Promise((resolve, reject) => {
    let params = {
      url: Discovery_token_BASE_URL,
      node: nodeName,
      timeout: 5000, //ms
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36",
      },
    };
    $httpClient.get(params, (errormsg, response, data) => {
      if (errormsg) {
        console.log("Discovery token request error:" + errormsg);
        resolve(errormsg);
        return;
      }
      if (response.status == 200) {
        console.log("----------Discory token--------------");
        console.log("discovery_token request result:" + data);
        let d = JSON.parse(data);
        let token = d["data"]["attributes"]["token"];
        const cookievalid = `_gcl_au=1.1.858579665.1632206782; _rdt_uuid=1632206782474.6a9ad4f2-8ef7-4a49-9d60-e071bce45e88; _scid=d154b864-8b7e-4f46-90e0-8b56cff67d05; _pin_unauth=dWlkPU1qWTRNR1ZoTlRBdE1tSXdNaTAwTW1Nd0xUbGxORFV0WWpZMU0yVXdPV1l6WldFeQ; _sctr=1|1632153600000; aam_fw=aam%3D9354365%3Baam%3D9040990; aam_uuid=24382050115125439381416006538140778858; st=${token}; gi_ls=0; _uetvid=a25161a01aa711ec92d47775379d5e4d; AMCV_BC501253513148ED0A490D45%40AdobeOrg=-1124106680%7CMCIDTS%7C18894%7CMCMID%7C24223296309793747161435877577673078228%7CMCAAMLH-1633011393%7C9%7CMCAAMB-1633011393%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1632413793s%7CNONE%7CvVersion%7C5.2.0; ass=19ef15da-95d6-4b1d-8fa2-e9e099c9cc38.1632408400.1632406594`;

        let p = {
          url: Discovery_BASE_URL,
          node: nodeName,
          timeout: 5000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36",
            Cookie: cookievalid,
          },
        };
        $httpClient.get(p, (emsg, res, resData) => {
          console.log("----------Discory--------------");
          if (emsg) {
            console.log("Discovery request error:" + errormsg);
            result["Discovery"] = "<b>Discoveryᐩ: </b>检测失败 ❗️";
            resolve(emsg);
            return;
          }
          if (res.status == 200) {
            console.log("Discovery request result:" + resData);
            let resD = JSON.parse(resData);
            let locationd =
              resD["data"]["attributes"]["currentLocationTerritory"];
            if (locationd == "us") {
              result["Discovery"] = "<b>Discoveryᐩ: </b>支持 🎉 ";
              resolve();
            } else {
              result["Discovery"] = "<b>Discoveryᐩ: </b>未支持 🚫";
              resolve();
            }
          } else {
            result["Discovery"] = "<b>Discoveryᐩ: </b>检测失败 ❗️";
            resolve(res.status);
          }
        });
      } else {
        result["Discovery"] = "<b>Discoveryᐩ: </b>检测失败 ❗️";
        resolve(response.status);
      }
    });
  });
}

function nfTest() {
  return new Promise((resolve, reject) => {
    let params = {
      url: NF_BASE_URL,
      node: nodeName,
      timeout: 6000, //ms
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
      },
    };

    $httpClient.get(params, (errormsg, response, data) => {
      console.log("----------NetFlix--------------");
      if (errormsg) {
        console.log("NF request failed: " + errormsg);
        result["Netflix"] = "<b>Netflix: </b>检测失败 ❗️";
        resolve(errormsg);
        return;
      }
      if (response.status == 403) {
        result["Netflix"] = "<b>Netflix: </b>未支持 🚫";
        resolve("403 Not Available");
      } else if (response.status == 404) {
        result["Netflix"] = "<b>Netflix: </b>支持自制剧集 ⚠️";
        resolve("404 Not Found");
      } else if (response.status == 200) {
        console.log("NF request result:" + JSON.stringify(response.headers));
        let ourl = response.headers["X-Originating-URL"];
        if (ourl == undefined) {
          ourl = response.headers["X-Originating-Url"];
        }
        if (ourl == undefined) {
          ourl = response.headers["x-originating-url"];
        }
        if (ourl == undefined) {
          console.log("未知地区");
          result["Netflix"] =
            "<b>Netflix: </b>完整支持" + arrow + "⟦未知地区⟧ 🎉";
          resolve(region);
        } else {
          console.log("X-Originating-URL:" + ourl);
          let region = ourl.split("/")[3];
          region = region.split("-")[0];
          if (region == "title") {
            region = "us";
          }
          result["Netflix"] =
            "<b>Netflix: </b>完整支持" +
            arrow +
            "⟦" +
            flags.get(region.toUpperCase()) +
            "⟧ 🎉";
          resolve(region);
        }
      } else {
        result["Netflix"] = "<b>Netflix: </b>检测失败 ❗️";
        resolve(response.status);
      }
    });
  });
}

//chatgpt
support_countryCodes = [
  "T1",
  "XX",
  "AL",
  "DZ",
  "AD",
  "AO",
  "AG",
  "AR",
  "AM",
  "AU",
  "AT",
  "AZ",
  "BS",
  "BD",
  "BB",
  "BE",
  "BZ",
  "BJ",
  "BT",
  "BA",
  "BW",
  "BR",
  "BG",
  "BF",
  "CV",
  "CA",
  "CL",
  "CO",
  "KM",
  "CR",
  "HR",
  "CY",
  "DK",
  "DJ",
  "DM",
  "DO",
  "EC",
  "SV",
  "EE",
  "FJ",
  "FI",
  "FR",
  "GA",
  "GM",
  "GE",
  "DE",
  "GH",
  "GR",
  "GD",
  "GT",
  "GN",
  "GW",
  "GY",
  "HT",
  "HN",
  "HU",
  "IS",
  "IN",
  "ID",
  "IQ",
  "IE",
  "IL",
  "IT",
  "JM",
  "JP",
  "JO",
  "KZ",
  "KE",
  "KI",
  "KW",
  "KG",
  "LV",
  "LB",
  "LS",
  "LR",
  "LI",
  "LT",
  "LU",
  "MG",
  "MW",
  "MY",
  "MV",
  "ML",
  "MT",
  "MH",
  "MR",
  "MU",
  "MX",
  "MC",
  "MN",
  "ME",
  "MA",
  "MZ",
  "MM",
  "NA",
  "NR",
  "NP",
  "NL",
  "NZ",
  "NI",
  "NE",
  "NG",
  "MK",
  "NO",
  "OM",
  "PK",
  "PW",
  "PA",
  "PG",
  "PE",
  "PH",
  "PL",
  "PT",
  "QA",
  "RO",
  "RW",
  "KN",
  "LC",
  "VC",
  "WS",
  "SM",
  "ST",
  "SN",
  "RS",
  "SC",
  "SL",
  "SG",
  "SK",
  "SI",
  "SB",
  "ZA",
  "ES",
  "LK",
  "SR",
  "SE",
  "CH",
  "TH",
  "TG",
  "TO",
  "TT",
  "TN",
  "TR",
  "TV",
  "UG",
  "AE",
  "US",
  "UY",
  "VU",
  "ZM",
  "BO",
  "BN",
  "CG",
  "CZ",
  "VA",
  "FM",
  "MD",
  "PS",
  "KR",
  "TW",
  "TZ",
  "TL",
  "GB",
];

function gptTest() {
  return new Promise((resolve, reject) => {
    let params = {
      url: GPT_BASE_URL,
      node: nodeName,
      timeout: 5000, //ms
      "auto-redirect": false, //  关闭自动重定向
    };
    $httpClient.get(params, (errormsg, response, data) => {
      console.log("----------GPT--------------");
      if (errormsg) {
        console.log("GPT request failed:!!! " + errormsg);
        result["ChatGPT"] = "<b>ChatGPT: </b>未支持 🚫";
        // resolve(errormsg);
        resolve("不支持 ChatGPT");
        return;
      }
      let resp = JSON.stringify(response);
      console.log("ChatGPT Main Test");
      let jdg = resp.indexOf("text/plain");
      if (jdg == -1) {
        let p = {
          url: GPT_RegionL_URL,
          node: nodeName,
          timeout: 5000, //ms
        };
        $httpClient.get(p, (emsg, resheader, resData) => {
          console.log("----------GPT RegionL--------------");
          if (emsg) {
            console.log("GPT RegionL request error:" + errormsg);
            result["ChatGPT"] = "<b>ChatGPT: </b>检测失败 ❗️";
            resolve(emsg);
            return;
          }

          console.log("ChatGPT Region Test");
          let region = resData.split("loc=")[1].split("\n")[0];
          console.log("ChatGPT Region: " + region);
          let res = support_countryCodes.indexOf(region);
          if (res != -1) {
            result["ChatGPT"] =
              "<b>ChatGPT: </b>支持 " +
              arrow +
              "⟦" +
              flags.get(region.toUpperCase()) +
              "⟧ 🎉";
            console.log("支持 ChatGPT");
            resolve(region);
          } else {
            result["ChatGPT"] = "<b>ChatGPT: </b>未支持 🚫";
            console.log("不支持 ChatGPT");
            resolve("不支持 ChatGPT");
          }
        });
      } else {
        result["ChatGPT"] = "<b>ChatGPT: </b>未支持 🚫";
        console.log("不支持 ChatGPT");
        resolve("不支持 ChatGPT");
      }
    });
  });
}

//google送中
function googleToCN() {
  return new Promise((resolve, reject) => {
    let params = {
      url: Google_BASE_URL,
      node: nodeName,
      timeout: 3000, //ms
      headers: {
        "Accept-Encoding": `gzip, deflate, br`,
        Connection: `keep-alive`,
        Accept: `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`,
        Host: `www.google.com`,
        "User-Agent": `Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1`,
        "Accept-Language": `zh-CN,zh-Hans;q=0.9`,
      },
    };

    $httpClient.get(params, (errormsg, response, data) => {
      console.log("----------Google2CN--------------");
      if (errormsg) {
        console.log("Google2CN request failed:" + errormsg);
        result["Google2CN"] = "<b>2CN: </b>检测失败 ❗️";
        resolve(errormsg);
        return;
      }
      if (response.status == 400) {
        result["Google2CN"] = "<b>2CN: </b>已被送中";
        resolve("404 Not Found");
      } else {
        result["Google2CN"] = "<b>2CN: </b>未被送中";
        resolve(response.status);
      }
    });
  });
}
