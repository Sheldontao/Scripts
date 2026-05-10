const { type, name } = $arguments;
const compatible_outbound = {
  tag: "COMPATIBLE",
  type: "direct",
};

let compatible;
let config = JSON.parse($files[0]);
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? "collection" : "subscription",
  platform: "sing-box",
  produceType: "internal",
});

config.outbounds.push(...proxies);

config.outbounds.map((i) => {
  if (["all"].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies));
  }
  if (["hk-auto"].includes(i.tag)) {
    i.outbounds.push(
      ...getTags(
        proxies,
        /^(?!.*(?:网站|网址|获取|订阅|流量|到期|余量|续费|过期|重置)).*(\b(hk|hong.*kong)\b|港|香港|🇭🇰)/i,
      ),
    );
  }
  if (["tw-auto"].includes(i.tag)) {
    i.outbounds.push(
      ...getTags(
        proxies,
        /^(?!.*(?:网站|网址|获取|订阅|流量|到期|余量|续费|过期|重置)).*(\b(tw|taiwan)\b|🇹🇼|台|台湾)/i,
      ),
    );
  }
  if (["jp-auto"].includes(i.tag)) {
    i.outbounds.push(
      ...getTags(
        proxies,
        /^(?!.*(?:网站|网址|获取|订阅|流量|到期|余量|续费|过期|重置)).*(\b(jp|japan)\b|日本|日|🇯🇵)/i,
      ),
    );
  }
  if (["sg-auto"].includes(i.tag)) {
    i.outbounds.push(
      ...getTags(
        proxies,
        /^(?!.*(?:网站|网址|获取|订阅|流量|到期|余量|续费|过期|重置)).*(\b(sg|singapore)\b|🇸🇬|新加坡|新)/i,
      ),
    );
  }
  if (["us-auto"].includes(i.tag)) {
    i.outbounds.push(
      ...getTags(
        proxies,
        /^(?!.*(?:网站|网址|获取|订阅|流量|到期|余量|续费|过期|重置)).*(\b(us|united.*states)\b|美|美国|🇺🇸)/i,
      ),
    );
  }
  if (["noCN-auto"].includes(i.tag)) {
    i.outbounds.push(
      ...getTags(
        proxies,
        /^(?!.*(?:网站|网址|获取|订阅|流量|到期|余量|续费|过期|重置|\b(hk|hongkong|Hong Kong|TW|Taiwan)\b|港|香港|🇭🇰|🇹🇼|台|台湾)).*(yt)/i,
      ),
    );
  }
});

config.outbounds.forEach((outbound) => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound);
      compatible = true;
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

$content = JSON.stringify(config, null, 2);

function getTags(proxies, regex) {
  return (regex ? proxies.filter((p) => regex.test(p.tag)) : proxies).map(
    (p) => p.tag,
  );
}
