import sizeOf from 'image-size'
import QrCode from 'qrcode'
import get_urls from 'get-urls'
import fs from 'fs'
import fetch from 'node-fetch'
import crypto from 'crypto'
import common from '../../lib/common/common.js'
import Cfg from '../../lib/config/config.js'
import { Stream } from 'stream'

/**
* 浼犲叆鏂囦欢锛岃繑鍥濨uffer
* 鍙互鏄痟ttp://銆乫ile://銆乥ase64://銆乥uffer
* @param {file://|base64://|http://|buffer} file
* @param {object} data
  - { http:true } 鍘熸牱杩斿洖http
  - { file:true } 鍘熸牱杩斿洖file
  - { base:true } 鍘熸牱杩斿洖Base
  - { buffer:true } 鍘熸牱杩斿洖Buffer
* @param {Promise<Buffer>} Buffer
*/
Bot.Buffer = async function (file, data) {
  if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
    if (data?.buffer) return file
    return file
  } else if (file instanceof fs.ReadStream || file instanceof Stream.PassThrough) {
    return await Bot.Stream(file)
  } else if (fs.existsSync(file.replace(/^file:\/\//, ''))) {
    if (data?.file) return file
    return fs.readFileSync(file.replace(/^file:\/\//, ''))
  } else if (fs.existsSync(file.replace(/^file:\/\/\//, ''))) {
    if (data?.file) return file.replace(/^file:\/\/\//, 'file://')
    return fs.readFileSync(file.replace(/^file:\/\/\//, ''))
  } else if (file.startsWith('base64://')) {
    if (data?.base) return file
    return Buffer.from(file.replace(/^base64:\/\//, ''), 'base64')
  } else if (/^http(s)?:\/\//.test(file)) {
    if (data?.http) return file
    let res = await fetch(file)
    if (!res.ok) {
      throw new Error(`璇锋眰閿欒锛佺姸鎬佺爜: ${res.status}`)
    } else {
      return Buffer.from(await res.arrayBuffer())
    }
  } else {
    throw new Error('浼犲叆鐨勬枃浠剁被鍨嬩笉绗﹀悎瑙勫垯锛屽彧鎺ュ彈url銆乥uffer銆乫ile://璺緞鎴栬€卋ase64缂栫爜鐨勫浘鐗�')
  }
}

/**
 * 浼犲叆鏂囦欢锛岃繑鍥炰笉甯ase64://鏍煎紡鐨勫瓧绗︿覆
 * 鍙互鏄痟ttp://銆乫ile://銆乥ase64://銆乥uffer
 * @param {file://|base64://|http://|buffer} file
 * @param {object} data
  - { http:true } 鍘熸牱杩斿洖http
  - { file:true } 鍘熸牱杩斿洖file
  - { base:true } 鍘熸牱杩斿洖Base
  - { buffer:true } 鍘熸牱杩斿洖Buffer
 * @returns {Promise<string>} base64瀛楃涓�
 */
Bot.Base64 = async function (file, data) {
  if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
    if (data?.buffer) return file
    return file.toString('base64')
  } else if (file instanceof fs.ReadStream || file instanceof Stream.PassThrough) {
    return await Bot.Stream(file, { base: true })
  } else if (fs.existsSync(file.replace(/^file:\/\//, ''))) {
    if (data?.file) return file
    return fs.readFileSync(file.replace(/^file:\/\//, '')).toString('base64')
  } else if (fs.existsSync(file.replace(/^file:\/\/\//, ''))) {
    if (data?.file) return file.replace(/^file:\/\/\//, 'file://')
    return fs.readFileSync(file.replace(/^file:\/\/\//, '')).toString('base64')
  } else if (file.startsWith('base64://')) {
    if (data?.base) return file
    return file.replace(/^base64:\/\//, '')
  } else if (/^http(s)?:\/\//.test(file)) {
    if (data?.http) return file
    let res = await fetch(file)
    if (!res.ok) {
      throw new Error(`璇锋眰閿欒锛佺姸鎬佺爜: ${res.status}`)
    } else {
      return Buffer.from(await res.arrayBuffer()).toString('base64')
    }
  } else {
    throw new Error('浼犲叆鐨勬枃浠剁被鍨嬩笉绗﹀悎瑙勫垯锛屽彧鎺ュ彈url銆乥uffer銆乫ile://璺緞鎴栬€卋ase64缂栫爜鐨勫浘鐗�')
  }
}

/**
 * 浼犲叆鍙娴侊紝杩斿洖buffer銆乥ase64://
 * @param {ReadStream} file - 鍙娴�
 * @param {object} data - 鍙€夛紝榛樿杩斿洖buffer
  - { buffer:true } 杩斿洖buffer
  - { base:true } 杩斿洖Base://
 * @returns {Promise<string|Buffer>} buffer鎴朾ase64瀛楃涓�
 */
Bot.Stream = async function (file, data) {
  return new Promise((resolve, reject) => {
    const chunks = []
    file.on('data', (chunk) => chunks.push(chunk))
    file.on('end', () => data?.base ? resolve(Buffer.concat(chunks).toString('base64')) : resolve(Buffer.concat(chunks)))
    file.on('error', (err) => reject(err))
  })
}

/**
* QQ鍥惧簥
* 鏀寔http://銆乫ile://銆乥ase64://銆乥uffer
* @param file  * 澶勭悊浼犲叆鐨勫浘鐗囨枃浠讹紝杞负url
* @param uin botQQ 鍙€夛紝鏈紶鍏ュ垯璋冪敤Bot.uin
* @returns {Promise<Object>} 鍖呭惈浠ヤ笅灞炴€х殑瀵硅薄锛�
*   - {number} width - 鍥剧墖瀹藉害
*   - {number} height - 鍥剧墖楂樺害
*   - {string} url - QQ鍥惧簥url
*   - {string} md5 - 鏂囦欢鐨凪D5鍝堝笇鍊�
*/
Bot.uploadQQ = async function (file, uin = Bot.uin) {
  uin = Number(uin)
  const buffer = await Bot.Buffer(file)
  try {
    const { message_id } = await Bot[uin].pickUser(uin).sendMsg([segment.image(buffer)])
    await Bot[uin].pickUser(uin).recallMsg(message_id)
  } catch { }
  const { width, height } = sizeOf(buffer)
  const md5 = crypto.createHash('md5').update(buffer).digest('hex').toUpperCase()
  const url = `https://gchat.qpic.cn/gchatpic_new/0/0-0-${md5}/0?term=2`
  return { width, height, url, md5 }
}


/**
* 浼犲叆鏂囦欢锛岃浆涓烘湇鍔″櫒鍏綉url
* 鍙互鏄痟ttp://銆乫ile://銆乥ase64://銆乥uffer
* @param {string|Buffer} file - 浼犲叆鐨勫浘鐗囨枃浠�
* @param {image|audio|video} type - 鍙€夛紝涓嶄紶涓哄浘鐗�
* @returns {Promise<Object>} 鍖呭惈浠ヤ笅灞炴€х殑瀵硅薄锛�
*   - {number} width - 鍥剧墖瀹藉害
*   - {number} height - 鍥剧墖楂樺害
*   - {string} url - 鏈嶅姟鍣ㄥ悗鐨勫叕缃慤RL
*   - {string} md5 - 鏂囦欢鐨凪D5鍝堝笇鍊�
*/
Bot.FileToUrl = async function (file, type = 'image') {
  /** 杞负buffer */
  const buffer = await Bot.Buffer(file)
  /** 绠椾笅md5 */
  const md5 = crypto.createHash('md5').update(buffer).digest('hex').toUpperCase()
  /** 璁＄畻澶у皬 */
  const size = Buffer.byteLength(buffer) / 1024

  let File = {
    md5,
    type,
    width: 0,
    height: 0,
    size
  }

  /** 鍥剧墖闇€瑕佽绠楀涓や釜鍙傛暟 */
  if (type === 'image') {
    const { width, height } = sizeOf(buffer)
    File.width = width
    File.height = height
  }

  /** 璇煶绫诲瀷 */
  if (type === 'audio') {
    File.mime = 'audio/silk'
    File.type = 'silk'
  } else {
    /** 鍏朵粬绫诲瀷 */
    try {
      const { mime, ext } = await fileTypeFromBuffer(buffer)
      File.mime = mime
      File.type = ext
    } catch (error) {
      logger.error('鏈煡绫诲瀷锛�', error)
      File.mime = 'application/octet-stream'
      File.type = 'txt'
    }
  }

  /** 鏂囦欢鍚嶇О */
  const filename = md5 + `.${File.type}`
  /** 璺緞 */
  const path = `./temp/FileToUrl/${filename}`

  fs.writeFileSync(path, buffer)
  File.path = path
  File.filename = filename

  /** 淇濆瓨 */
  lain.Files.set(filename, File)
  /** 瀹氭椂鍒犻櫎 */
  setTimeout(() => {
    lain.Files.delete(filename)
    logger.debug(`[缂撳瓨娓呯悊] => [filename锛�${filename}]`)
  }, (Cfg.Server.InvalidTime || 30) * 1000)
  /** 鑾峰彇鍩烘湰閰嶇疆 */
  const { port, baseIP, baseUrl } = Cfg.Server
  let url = `http://${baseIP}:${port}/api/File/${filename}`
  if (baseUrl) url = baseUrl.replace(/\/$/, '') + `/api/File/${filename}`
  return { width: File.width, height: File.height, url, md5 }
}

/**
* 浼犲叆鏂囦欢锛岃繑鍥炴湰鍦拌矾寰�
* 鍙互鏄痟ttp://銆乫ile://銆乥ase64://銆乥uffer
* @param {file://|base64://|http://|buffer} file
* @param {string} _path - 鍙€夛紝涓嶄紶榛樿涓哄浘鐗�
*/
Bot.FileToPath = async function (file, _path) {
  if (!_path) _path = `./temp/FileToUrl/${Date.now()}.png`
  if (Buffer.isBuffer(file) || file instanceof Uint8Array) {
    fs.writeFileSync(_path, file)
    return _path
  } else if (file instanceof fs.ReadStream || file instanceof Stream.PassThrough) {
    const buffer = await Bot.Stream(file)
    fs.writeFileSync(_path, buffer)
    return _path
  } else if (fs.existsSync(file.replace(/^file:\/\//, ''))) {
    fs.copyFileSync(file.replace(/^file:\/\//, ''), _path)
    return _path
  } else if (fs.existsSync(file.replace(/^file:\/\/\//, ''))) {
    fs.copyFileSync(file.replace(/^file:\/\/\//, ''), _path)
    return _path
  } else if (file.startsWith('base64://')) {
    const buffer = Buffer.from(file.replace(/^base64:\/\//, ''), 'base64')
    fs.writeFileSync(_path, buffer)
    return _path
  } else if (/^http(s)?:\/\//.test(file)) {
    const res = await fetch(file)
    if (!res.ok) {
      throw new Error(`璇锋眰閿欒锛佺姸鎬佺爜: ${res.status}`)
    } else {
      const buffer = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(_path, buffer)
      return _path
    }
  } else {
    throw new Error('浼犲叆鐨勬枃浠剁被鍨嬩笉绗﹀悎瑙勫垯锛屽彧鎺ュ彈url銆乥uffer銆乫ile://璺緞鎴栬€卋ase64缂栫爜鐨勫浘鐗�')
  }
}

/**
* 澶勭悊segment涓殑鍥剧墖銆佽闊炽€佹枃浠讹紝鑾峰彇瀵瑰簲鐨勭被鍨�
* @param i 闇€瑕佸鐞嗙殑瀵硅薄
* 浼犲叆绫讳技浜� {type:"image", file:"file://...", url:"http://"}
*
* 杩斿洖 {type:<file|buffer|base64|http|error>, file=:<file://|buffer|base64://|http://|i.file>}
*
* error涓烘棤娉曞垽鏂被鍨嬶紝鐩存帴杩斿洖i.file
*/
Bot.toType = function (i) {
  if (i?.url) {
    if (i?.url?.includes('gchat.qpic.cn') && !i?.url?.startsWith('https://')) {
      i = 'https://' + i.url
    } else {
      i = i.url
    }
  } else if (typeof i === 'object') {
    i = i.file
  }

  let file
  let type = 'file'

  // 妫€鏌ユ槸鍚︽槸Buffer绫诲瀷
  if (i?.type === 'Buffer') {
    type = 'buffer'
    file = Buffer.from(i?.data)
  } else if (i?.type === 'Buffer' || i instanceof Uint8Array || Buffer.isBuffer(i?.data || i)) {
    type = 'buffer'
    file = i?.data || i
  } else if (i instanceof fs.ReadStream || i?.path || i instanceof Stream.PassThrough ) {
    // 妫€鏌ユ槸鍚︽槸ReadStream绫诲瀷
    if (fs.existsSync(i.path)) {
      file = `file://${i.path}`
    } else {
      file = `file://./${i.path}`
    }
  } else if (typeof i === 'string') {
    // 妫€鏌ユ槸鍚︽槸瀛楃涓茬被鍨�
    if (fs.existsSync(i.replace(/^file:\/\//, ''))) {
      file = i
    } else if (fs.existsSync(i.replace(/^file:\/\/\//, ''))) {
      file = i.replace(/^file:\/\/\//, 'file://')
    } else if (fs.existsSync(i)) {
      file = `file://${i}`
    } else if (/^base64:\/\//.test(i)) {
      // 妫€鏌ユ槸鍚︽槸base64鏍煎紡鐨勫瓧绗︿覆
      type = 'base64'
      file = i
    } else if (/^http(s)?:\/\//.test(i)) {
      // 濡傛灉鏄痷rl锛屽垯鐩存帴杩斿洖url
      type = 'http'
      file = i
    } else {
      common.log('Lain-plugin', '鏈煡鏍煎紡锛屾棤娉曞鐞嗭細' + i)
      type = 'error'
      file = i
    }
  } else {
    // 鐣欎釜瀹归敊
    common.log('Lain-plugin', '鏈煡鏍煎紡锛屾棤娉曞鐞嗭細' + i)
    type = 'error'
    file = i
  }

  return { type, file }
}

/**
* 澶勭悊segment涓殑i||i.file锛屼富瑕佺敤浜庝竴浜泂b瀛楁锛屾爣鍑嗗寲浠栦滑
* @param {string|object} file - i.file
*/
Bot.FormatFile = async function (file) {
  const str = function () {
    if (fs.existsSync(file.replace(/^file:\/\//, ''))) {
      return `file://${file.replace(/^file:\/\//, '')}`
    } else if (fs.existsSync(file.replace(/^file:\/\/\//, ''))) {
      return file.replace(/^file:\/\/\//, 'file://')
    } else if (fs.existsSync(file)) {
      return `file://${file}`
    }
    return file
  }

  switch (typeof file) {
    case 'object':
      /** 杩欓噷浼氭湁澶嶈杩欐牱鐨勭洿鎺ュ師鏍蜂笉鍔ㄦ妸message鍙戣繃鏉�... */
      if (file.url) {
        if (file?.url?.includes('gchat.qpic.cn') && !file?.url?.startsWith('https://')) return `https://${file.url}`
        return file.url
      }

      /** 鑰佹彃浠舵覆鏌撳嚭鏉ョ殑鍥炬湁杩欎釜瀛楁 */
      if (file?.type === 'Buffer') return Buffer.from(file?.data)
      if (Buffer.isBuffer(file) || file instanceof Uint8Array) return file

      /** 娴� */
      if (file instanceof fs.ReadStream || file instanceof Stream.PassThrough) return await Bot.Stream(file, { base: true })

      /** i.file */
      if (file.file) return str(file.file)
      return file
    case 'string':
      return str(file)
    default:
      return file
  }
}

/**
* 浼犲叆瀛楃涓� 鎻愬彇url 杩斿洖鏁扮粍
* @param {string} url 浼犲叆瀛楃涓诧紝鎻愬彇鍑烘墍鏈塽rl
* @param {array} exclude - 鍙€夛紝闇€浣跨敤璇蜂紶鍏ユ暟缁勶紝鏁扮粍鍐呬负鎺掗櫎鐨剈rl锛屽嵆涓嶈繑鍥炴暟缁勫唴鐩歌繎鐨剈rl
*/
Bot.getUrls = function (url, exclude = []) {
  if (!Array.isArray(exclude)) exclude = [exclude]
  let urls = []
  /** 涓枃涓嶇鍚坲rl瑙勮寖 */
  url = url.replace(/[\u4e00-\u9fa5]/g, '|')
  urls = get_urls(url, {
    exclude,
    /** 鍘婚櫎 WWW */
    stripWWW: false,
    /** 瑙勮寖鍖栧崗璁� */
    normalizeProtocol: false,
    /** 绉婚櫎鏌ヨ鍙傛暟 */
    removeQueryParameters: false,
    /** 绉婚櫎鍞竴鏂滄潬 */
    removeSingleSlash: false,
    /** 鏌ヨ鍙傛暟鎺掑簭 */
    sortQueryParameters: false,
    /** 鍘婚櫎璁よ瘉淇℃伅 */
    stripAuthentication: false,
    /** 鍘婚櫎鏂囨湰鐗囨 */
    stripTextFragment: false,
    /** 绉婚櫎鏈熬鏂滄潬 */
    removeTrailingSlash: false
  })
  return [...urls]
}

/**
 * Bot.Button 鏄竴涓嚱鏁帮紝鐢ㄤ簬鐢熸垚鎸夐挳鍒楄〃銆�
 * @param {Array} list - 鍖呭惈鎸夐挳淇℃伅鐨勬暟缁勩€傛瘡涓璞″彲浠ユ湁浠ヤ笅灞炴€э細
 *   @param {string} text - 鎸夐挳鐨勬樉绀烘枃鏈€�
 *   @param {number} style - 鎸夐挳鐨勬樉绀虹殑棰滆壊锛�0-鐏拌壊锛�1-钃濊壊銆�
 *   @param {string} data - 鎸夐挳鐨勮嚜瀹氫箟鍥炲鍐呭銆�
 *   @param {boolean} send - 濡傛灉涓� true锛屽垯鐩存帴鍙戦€佸唴瀹广€�
 *   @param {boolean} admin - 濡傛灉涓� true锛屽垯浠呯鐞嗗憳鍙互鐐瑰嚮姝ゆ寜閽€�
 *   @param {Array} list - 鍖呭惈鏈夋潈闄愮偣鍑绘鎸夐挳鐨勭敤鎴� id 鐨勬暟缁勩€�
 *   @param {Array} role - 鍖呭惈鏈夋潈闄愮偣鍑绘鎸夐挳鐨勭敤鎴风粍 id 鐨勬暟缁勶紙浠呴閬撳彲鐢級銆�
 *   @param {boolean} reply - 濡傛灉涓� true锛屽垯鐐瑰嚮鍚庤嚜鍔ㄦ坊鍔犲紩鐢ㄥ洖澶嶃€�
 *   @param {string} link - 鎸夐挳鐨� http 璺宠浆閾炬帴銆�
 *   浠ヤ笂鍙傛暟锛屽潎鍙嚜琛岀粍鍚堛€�
 * @param {number} [line=3] - 鎸夐挳鐨勮鏁般€�
 * @returns {Array} button - 杩斿洖鍖呭惈鎸夐挳淇℃伅鐨勬暟缁勩€�
 */
Bot.Button = function (list, line = 3) {
  let id = 0
  let index = 1
  let arr = []
  let button = []

  for (let i of list) {
    /** 澶勭悊鐢ㄦ埛id */
    if (i.list && i.list.length) {
      const list = []
      i.list.forEach(p => {
        p = p.split('-')
        p = p[1] || p[0]
        list.push(p)
      })
      i.list = list
    }

    if (Array.isArray(i)) {
      button.push(...Bot.Button(i, 10))
    } else {
      if (typeof i.permission === 'string') {
        if (i.permission === 'xxx') {
          i.list = []
        } else {
          const openid = i.permission.split('-')
          i.list = [openid[1] || openid[0]]
        }
        i.permission = false
      }
      let Button = {
        id: String(id),
        render_data: {
          label: i.text || i.label || i.link,
          style: (i.style == 0) ? 0 : 1,
          visited_label: i.text || i.label || i.link
        },
        action: {
          type: i.type || (i.link ? 0 : 2),
          reply: i.reply || false,
          permission: i.permission || {
            type: (i.admin && 1) || (i.list && '0') || (i.role && 3) || 2,
            specify_user_ids: i.list || [],
            specify_role_ids: i.role || []
          },
          data: i.data || i.input || i.callback || i.link || i.text || i.label,
          enter: i.send || i.enter || 'callback' in i || false,
          unsupport_tips: i.tips || 'err'
        }
      }
      if (i.QQBot) {
        if (i.QQBot.render_data)
          Object.assign(Button.render_data, i.QQBot.render_data)
        if (i.QQBot.action)
          Object.assign(Button.action, i.QQBot.action)
      }
      arr.push(Button)
      if (index % line == 0 || index == list.length) {
        button.push({
          type: 'button',
          buttons: arr
        })
        arr = []
      }
    }
    id++
    index++
  }
  return button
}

/** 杞崲鏂囨湰涓殑URL涓哄浘鐗� */
Bot.HandleURL = async function (msg) {
  const message = []
  if (msg?.text) msg = msg.text
  /** 闇€瑕佸鐞嗙殑url */
  let urls = Bot.getUrls(msg, Cfg.WhiteLink)

  let promises = urls.map(link => {
    return new Promise((resolve, reject) => {
      common.mark('Lain-plugin', `url鏇挎崲锛�${link}`)
      QrCode.toBuffer(link, {
        errorCorrectionLevel: 'H',
        type: 'png',
        margin: 4,
        text: link
      }, async (err, buffer) => {
        if (err) reject(err)
        const base64 = 'base64://' + buffer.toString('base64')
        const file = await common.Rending({ base64, link }, 'QRCode/QRCode')
        message.push({ type: 'image', file })
        msg = msg.replace(link, '[閾炬帴(璇锋壂鐮佹煡鐪�)]')
        msg = msg.replace(link.replace(/^http:\/\//g, ''), '[閾炬帴(璇锋壂鐮佹煡鐪�)]')
        msg = msg.replace(link.replace(/^https:\/\//g, ''), '[閾炬帴(璇锋壂鐮佹煡鐪�)]')
        resolve()
      })
    })
  })

  await Promise.all(promises)
  message.unshift({ type: 'text', text: msg })
  return message
}