const { type, name } = $arguments
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}

let compatible
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

config.outbounds.push(...proxies)

config.outbounds.map(i => {
  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies))
  }
  if (['hk', 'hk-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?=.*(🇭🇰|香港|(\b(HK|HKG|Hong)(\d+)?\b)))(?!.*(回国|校园|游戏|🎮|(\b(GAME)\b))).*$/i))
  }
  if (['tw', 'tw-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?=.*(🇹🇼|台湾|(\b(TW|TWN|Tai|Taiwan)(\d+)?\b)))(?!.*(回国|校园|游戏|🎮|(\b(GAME)\b))).*$/i))
  }
  if (['jp', 'jp-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?=.*(🇯🇵|日本|川日|东京|大阪|泉日|埼玉|(\b(JP|JPN|Japan)(\d+)?\b)))(?!.*(回国|校园|游戏|🎮|(\b(GAME)\b))).*$/i))
  }
  if (['sg', 'sg-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?=.*(🇸🇬|新加坡|狮|(\b(SG|SGP|Singapore)(\d+)?\b)))(?!.*(回国|校园|游戏|🎮|(\b(GAME)\b))).*$/i))
  }
  if (['us', 'us-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?=.*(🇺🇸|美国|us|united.*states|(\b(US|USA|United States)(\d+)?\b)))(?!.*(回国|校园|游戏|🎮|(\b(GAME)\b))).*$/i))
  }
  if (['noCN-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?=.*(港|hk|hongkong|Hong Kong|🇭🇰|台|🇹🇼|TW|Taiwan))/i))
}})

config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}