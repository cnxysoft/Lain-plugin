import { randomUUID } from 'crypto'
import { WebSocketServer } from 'ws'
import common from '../../lib/common/common.js'
import Cfg from '../../lib/config/config.js'

class AdapterComWeChat {
  /** ����������� */
  constructor (bot, request) {
    /** ��һ�� */
    bot.request = request
    /** ����key */
    this.key = request.headers['sec-websocket-key']
    /** OneBot */
    this.OneBot = request.headers['user-agent']
    /** host */
    this.host = request.headers.host
    /** ws */
    this.bot = bot
    /** �����¼� */
    this.bot.on('message', (data) => this.event(data))
    /** �������ӹر��¼� */
    bot.on('close', () => lain.error('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> ����WebSocket�����ѶϿ�`))
    lain.info('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> �յ�����WebSocket����`)
  }

  /** ��������¼� */
  async event (data) {
    lain.debug('Lain-plugin', `ws => ${data}`)
    data = JSON.parse(data)
    /** ��echo�����������������Ӧ�����Ᵽ�� */
    if (data?.echo) return lain.echo.set(data.echo, data)

    this[data.type](data)
  }

  /** Ԫ�¼� */
  async meta (data) {
    /** �����¼� */
    switch (data.detail_type) {
      /** ���ӽ����ɹ� */
      case 'connect':
        lain.info('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> ����WebSocket���ӽ����ɹ�`)
        break
      /** ���� */
      case 'heartbeat':
        lain.debug('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> ������${JSON.stringify(data)}`)
        break
      /** ״̬���� */
      case 'status_update':
        this.id = data.status.bots[0].self.user_id
        /** ���ݾɰ汾 */
        Bot.lain.wc = this.bot
        Bot.lain.wc.uin = this.id
        await this.LoadBot()
        break
      /** δ֪�¼� */
      default:
        lain.error('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> δ֪�¼���${JSON.stringify(data)}`)
        break
    }
  }

  /** ��Ϣ�¼� */
  async message (data) {
    /** �����¼� */
    switch (data.detail_type) {
      /** ˽����Ϣ�¼� */
      case 'private':
        /** ת����Ϣ������� */
        return await Bot.emit('message', await this.ICQQMessage(data))
      /** Ⱥ����Ϣ�¼� */
      case 'group':
        /** ת����Ϣ������� */
        return await Bot.emit('message', await this.ICQQMessage(data))
      /** δ֪�¼� */
      default:
        lain.error('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> δ֪�¼���${JSON.stringify(data)}`)
        break
    }
  }

  /** �����¼� */
  async request (data) {
    /** �����¼� */
    switch (data.detail_type) {
      /** ��Ӻ������� */
      case 'wx.friend_request':
        if (Cfg.Other.ComWeChat.autoFriend) {
          const { v3, v4, nickname, user_id } = data
          await this.sendApi('wx.accept_friend', { v3, v4 })
          lain.info(this.id, `�Զ�ͬ��������룺${nickname}(${user_id})`)
        } else {
          const { v3, v4, nickname, user_id } = data
          lain.info(this.id, `<��������:${nickname}(${user_id})><v3:${v3}><v4:${v4}>`)
        }
        break
      /** δ֪�¼� */
      default:
        lain.error('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> δ֪�¼���${JSON.stringify(data)}`)
        break
    }
  }

  /** ֪ͨ�¼� */
  async notice (data) {
    /** �����¼� */
    switch (data.detail_type) {
      /** ˽����һ�� */
      case 'wx.get_private_poke':
        /** ת����Ϣ������� */
        return await Bot.emit('notice', await this.ICQQMessage(data))
      /** Ⱥ����һ�� */
      case 'wx.get_group_poke':
        /** ת����Ϣ������� */
        return await Bot.emit('notice', await this.ICQQMessage(data))
      /** δ֪�¼� */
      default:
        lain.mark('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> δ֪�¼���${JSON.stringify(data)}`)
        break
    }
  }

  /** ע��Bot */
  async LoadBot () {
    const data = await this.sendApi('get_self_info', {})
    /** ������������ */
    Bot[this.id] = {
      ws: this.bot,
      fl: new Map(),
      gl: new Map(),
      tl: new Map(),
      gml: new Map(),
      guilds: new Map(),
      nickname: Cfg.Other.ComWeChat.name || data.user_name,
      adapter: 'ComWeChat',
      uin: this.id,
      tiny_id: this.id,
      avatar: data?.['wx.avatar'],
      stat: { start_time: Date.now() / 1000, recv_msg_cnt: 0 },
      apk: Bot.lain.adapter.ComWeChat.apk,
      version: Bot.lain.adapter.ComWeChat.version,
      sendApi: async (action, params) => await this.sendApi(action, params),
      pickMember: (group_id, user_id) => this.pickMember(group_id, user_id),
      pickUser: (user_id) => this.pickFriend(user_id),
      pickFriend: (user_id) => this.pickFriend(user_id),
      pickGroup: (group_id) => this.pickGroup(group_id),
      setEssenceMessage: async (msg_id) => await this.setEssenceMessage(msg_id),
      sendPrivateMsg: async (user_id, msg) => await this.sendFriendMsg(user_id, msg),
      getGroupMemberInfo: async (group_id, user_id) => await this.getGroupMemberInfo(group_id, user_id),
      removeEssenceMessage: async (msg_id) => await this.removeEssenceMessage(msg_id),
      makeForwardMsg: async (message) => await common.makeForwardMsg(message),
      getMsg: (msg_id) => '',
      quit: (group_id) => this.quit(group_id),
      getFriendMap: () => Bot[this.id].fl,
      getGroupList: () => Bot[this.id].gl,
      getGuildList: () => Bot[this.id].tl,
      getMuteList: async (group_id) => await this.getMuteList(group_id),
      getChannelList: async (guild_id) => this.getChannelList(guild_id),
      readMsg: async () => common.recvMsg(this.id, 'ComWeChat', true),
      MsgTotal: async (type) => common.MsgTotal(this.id, 'ComWeChat', type, true)
    }
    /** ���� */
    await common.init('Lain:restart:ComWeChat')
    await this.loadRes()
    /** ����uin */
    if (!Bot.adapter.includes(this.id)) Bot.adapter.push(this.id)
  }

  /** ������Դ */
  async loadRes () {
    /** ��ȡȺ���б���~ */
    const group_list = await this.sendApi('get_group_list', {})

    for (const i of group_list) {
      i.uin = this.id
      /** �������� */
      Bot.gl.set(i.group_id, i)
      /** ������� */
      Bot[this.id].gl.set(i.group_id, i)
    }

    /** ΢�ź����б� */
    const friend_list = await this.sendApi('get_friend_list', {})
    for (const i of friend_list) {
      i.uin = this.id
      /** �������� */
      Bot.fl.set(i.user_id, i)
      /** ������� */
      Bot[this.id].fl.set(i.user_id, i)
    }
    lain.info('Lain-plugin', `<Bot:${this.OneBot}><host:${this.host}> ������${Bot[this.id].fl.size}�����ѣ�${Bot[this.id].gl.size}��Ⱥ��`)
  }

  /** �������� */
  async sendApi (action, params) {
    const echo = randomUUID()
    lain.debug(this.id, '[ws] send -> ' + JSON.stringify({ echo, action, params }))
    this.bot.send(JSON.stringify({ echo, action, params }))

    for (let i = 0; i < 1200; i++) {
      const data = await lain.echo.get(echo)
      if (data) {
        lain.echo.delete(echo)
        if (data.status === 'ok') {
          return data.data
        } else {
          lain.error(this.id, data)
          throw data
        }
      } else {
        await lain.sleep(50)
      }
    }
    const json = {
      status: 'failed',
      retcode: -1,
      wording: '��ȡ��ʱ',
      echo
    }
    throw json
  }

  /** ��Ϣת��ΪICQQ��ʽ */
  async ICQQMessage (data) {
    if (!data.message) data.message = [{ type: 'poke', data: { id: '' } }]
    let { message, ToString, raw_message, log_message } = await this.getMessage(data.message)

    /** ˽����һ�� ��Ҫ��ǰ��������ᵼ��user_id���� */
    if (data.detail_type === 'wx.get_private_poke') {
      data.target_id = data.user_id
      data.operator_id = data.from_user_id
      data.user_id = data.from_user_id
      data.action = '���˴�'
      log_message = `${data.operator_id} ���˴� ${data.target_id}`
      message = null
    }
    /** Ⱥ����һ�� */
    if (data.detail_type === 'wx.get_group_poke') {
      data.action = '���˴�'
      data.target_id = data.user_id
      data.operator_id = data.from_user_id
      log_message = `${data.operator_id} ���˴� ${data.target_id}`
      message = null
    }

    const { group_id, detail_type, message_id, user_id } = data
    const sub_type = /^private$|^wx.get_private_poke$/.test(detail_type) ? 'friend' : 'normal'

    /** ��ȡ�û����� */
    let user_name
    if (sub_type === 'friend') {
      const data = await this.sendApi('get_user_info', { user_id })
      user_name = data?.user_name || ''
    } else {
      const data = await this.sendApi('get_group_member_info', { group_id, user_id })
      user_name = data?.user_name || ''
    }

    data = {
      ...data,
      self_id: this.id,
      message,
      raw_message,
      adapter: 'ComWeChat',
      group_name: Bot[this.id]?.gl.get(group_id)?.group_name || group_id,
      post_type: 'message',
      message_type: detail_type,
      sub_type,
      seq: message_id,
      member: {
        info: {
          group_id,
          user_id,
          nickname: user_name,
          last_sent_time: data.time
        },
        group_id
      },
      sender: {
        user_id,
        nickname: user_name,
        card: user_name,
        role: 'member'
      },
      getAvatarUrl: async () => (await this.sendApi('get_group_member_info', { group_id, user_id }))?.['wx.avatar'],
      toString: () => ToString
    }

    if (detail_type === 'private' || detail_type === 'wx.get_private_poke') {
      data.friend = {
        recallMsg: () => '��δ֧��',
        makeForwardMsg: async (forwardMsg) => await common.makeForwardMsg(forwardMsg),
        getChatHistory: () => '��δ֧��',
        sendMsg: async (msg) => await this.sendFriendMsg(msg)
      }
      lain.info(this.id, `<����:${user_id}> -> ${log_message}`)
    } else {
      data.group = {
        getChatHistory: (seq, num) => '��δ֧��',
        recallMsg: () => '��δ֧��',
        sendMsg: async (msg) => await this.sendGroupMsg(msg),
        makeForwardMsg: async (forwardMsg) => await common.makeForwardMsg(forwardMsg),
        pickMember: async (id) => await this.pickMember(group_id, id)
      }
      lain.info(this.id, `<Ⱥ:${group_id}><�û�:${user_id}> -> ${log_message}`)
    }
    data.recall = () => '��δ֧��'
    data.reply = async (msg) => group_id ? await this.sendGroupMsg(group_id, msg) : await this.sendFriendMsg(user_id, msg)

    if (data.detail_type === 'wx.get_private_poke') {
      data.sub_type = 'poke'
      data.post_type = 'notice'
      data.notice_type = 'private'
    }
    /** Ⱥ����һ�� */
    if (data.detail_type === 'wx.get_group_poke') {
      data.sub_type = 'poke'
      data.post_type = 'notice'
      data.notice_type = 'group'
    }

    /** ������Ϣ���� */
    try { common.recvMsg(this.id, data.adapter) } catch { }
    return data
  }

  /** ����message */
  async getMessage (msg) {
    let message = []
    let ToString = []
    let log_message = []
    let raw_message = []
    if (!msg) return false

    for (let i of msg) {
      switch (i.type) {
        case 'text':
          message.push({ type: 'text', text: i.data.text })
          raw_message.push(i.data.text)
          log_message.push(i.data.text)
          ToString.push(i.data.text)
          break
        case 'mention':
          message.push({ type: 'at', qq: i.data.user_id })
          raw_message.push(`@${i.data.user_id}`)
          log_message.push(`<@:${i.data.user_id}>`)
          ToString.push(`{at:${i.data.user_id}}`)
          break
        case 'mention_all':
          message.push({ type: 'text', qq: 'all', id: 'all' })
          raw_message.push('@all')
          log_message.push('<@:ȫ���Ա>')
          ToString.push('{at:all}')
          break
        case 'image':
          try {
            const image = await this.sendApi('get_file', { type: 'url', file_id: i.data.file_id })
            message.push({ type: 'image', ...i.data, file: image.name, url: image.url })
            raw_message.push('[ͼƬ]')
            log_message.push(`<ͼƬ:${image.url}>`)
            ToString.push(`{image:${image.url}}`)
          } catch {
            message.push({ type: 'image', file: i.data.file_id, url: i.data.file_id })
            raw_message.push('[ͼƬ]')
            log_message.push(`<ͼƬ:${i.data.file_id}>`)
            ToString.push(`{image:${i.data.file_id}}`)
          }
          break
        case 'wx.emoji':
          message.push({ type: 'emoji', text: i.data.file_id })
          raw_message.push('[emoji]')
          log_message.push(`<emoji:${i.data.file_id}>`)
          ToString.push(`{emoji:${i.data.file_id}}`)
          break
        case 'wx.link':
          message.push({ type: 'wx.link', ...i.data })
          raw_message.push('[link]')
          log_message.push(`<link:${JSON.stringify(i)}>`)
          ToString.push(`{link:${JSON.stringify(i)}}`)
          break
        case 'voice':
        case 'audio':
        case 'video':
        case 'file':
        case 'location':
        case 'reply':
        case 'wx.app':
        default:
          raw_message.push(JSON.stringify(i))
          log_message.push(JSON.stringify(i))
          ToString.push(JSON.stringify(i))
          break
      }
    }

    ToString = ToString.join('').trim()
    raw_message = raw_message.join('').trim()
    log_message = log_message.join(' ').trim()
    return { message, ToString, raw_message, log_message }
  }

  async pickMember (group_id, user_id) {
    let info = {
      group_id,
      user_id
    }
    return {
      ...info,
      info,
      getAvatarUrl: async () => (await this.sendApi('get_group_member_info', { group_id, user_id }))?.['wx.avatar']
    }
  }

  /** ��������Ϣ */
  async sendFriendMsg (user_id, data) {
    const { message, raw_message } = await this.ComWeChatMessage(data, true)
    const params = {
      user_id,
      message,
      detail_type: 'private'
    }
    lain.info(this.id, `<������:${user_id}> => ${raw_message}`)
    return await this.sendApi('send_message', params)
  }

  /** ��Ⱥ����Ϣ */
  async sendGroupMsg (group_id, data) {
    const { message, raw_message } = await this.ComWeChatMessage(data)
    const params = {
      group_id,
      message,
      detail_type: 'group'
    }
    lain.info(this.id, `<����Ⱥ��:${group_id}> => ${raw_message}`)
    return await this.sendApi('send_message', params)
  }

  /** ת��ΪComWeChat��ʹ�õĸ�ʽ */
  async ComWeChatMessage (data, friend) {
    /** ��׼����Ϣ���� */
    data = common.array(data)
    /** ���� Shamrock��׼ message */
    let message = []
    /** ��ӡ����־ */
    let raw_message = []

    /** chatgpt-plugin */
    if (data?.[0]?.type === 'xml') data = data?.[0].msg
    for (let i of data) {
      switch (i.type) {
        case 'at':
          if (friend) break
          message.push({ type: 'mention', data: { user_id: i.qq || i.id } })
          raw_message.push(`<@:${i.qq || i.id}>`)
          break
        case 'text':
        case 'forward':
          if (String(i.text).trim()) {
            if (i.type === 'forward') i.text = String(i.text).trim() + '\n'
            message.push({ type: 'text', data: { text: i.text } })
            raw_message.push(i.text)
          }
          break
        case 'file':
        case 'record':
        case 'video':
          try {
            const data = await this.get_file_id('file', i.file)
            message.push(data)
            raw_message.push(`<�ļ�:${data.data.file_id}>`)
          } catch {
            const data = await this.get_file_id('file', i.file)
            message.push(data)
            raw_message.push(`<�ļ�:${data.data.file_id}>`)
          }
          break
        case 'image':
          try {
            if (i.file_id) {
              message.push({ type: 'image', data: { file_id: i.file_id } })
              raw_message.push(`<ͼƬ:${i.file_id}>`)
            } else {
              const data = await this.get_file_id('image', i.file)
              message.push(data)
              raw_message.push(`<ͼƬ:${data.data.file_id}>`)
            }
          } catch {
            message.push(await this.get_file_id('image', i.file))
            raw_message.push(`<ͼƬ:${data.data.file_id}>`)
          }
          break
        case 'face':
        default:
          // Ϊ�˼��ݸ����ֶΣ����ٽ������л����������п���δ֪�ֶε���Shamrock����
          message.push({ type: i.type, data: { text: JSON.stringify(i.data) } })
          raw_message.push(`[${i.type}:${JSON.stringify(i.data)}]`)
          break
      }
    }
    raw_message = raw_message.join('')
    return { message, raw_message }
  }

  /** �ϴ��ļ���ͼƬ */
  async get_file_id (type, i) {
    const file = await Bot.Base64(i)
    const buffer = await Bot.Buffer(`base64://${file}`)
    let name = `${Date.now()}.png`
    try {
      const { ext } = await fileTypeFromBuffer(buffer)
      name = `${Date.now()}.${ext}`
    } catch { }
    const { file_id } = await this.sendApi('upload_file', { type: 'data', name, data: file })

    if (!file_id) return false

    /** ���⴦������ */
    if (/.gif$/.test(name)) {
      return { type: 'wx.emoji', data: { file_id } }
    } else {
      return { type, data: { file_id } }
    }
  }

  /** Ⱥ���� */
  pickGroup (group_id) {
    return {
      is_admin: false,
      is_owner: false,
      /** ������Ϣ */
      sendMsg: async (msg) => await this.sendGroupMsg(group_id, msg),
      recallMsg: async () => '',
      /** ����ת�� */
      makeForwardMsg: async (message) => await this.makeForwardMsg(message),
      sendFile: async (filePath) => await this.get_file_id('file', filePath)
    }
  }

  /** ���Ѷ��� */
  pickFriend (user_id) {
    return {
      sendMsg: async (msg) => await this.sendFriendMsg(user_id, msg),
      recallMsg: async () => '',
      makeForwardMsg: async (message) => await this.makeForwardMsg(message),
      getAvatarUrl: () => '',
      sendFile: async (filePath) => await this.get_file_id('file', filePath)
    }
  }

  /** Ⱥ��Ա�б� */
  async getMemberMap (group_id) {
    return await this.sendApi('get_group_list', { group_id })
  }

  async getGroupMemberInfo (group_id, user_id) {
    return await this.sendApi('get_group_member_info', { group_id, user_id })
  }
}

/** ComWeChat��WebSocket������ʵ�� */
const ComWeChat = new WebSocketServer({ noServer: true })

/** ���� */
ComWeChat.on('connection', async (bot, request) => new AdapterComWeChat(bot, request))

/** ������� */
ComWeChat.on('error', async error => logger.error(error))

export default ComWeChat

lain.info('Lain-plugin', 'ComWeChat�������������')
