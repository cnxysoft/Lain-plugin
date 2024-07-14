import YamlParse from '../model/YamlHandler.js'
import { execSync } from 'child_process'
import { xiaofei_music } from '../adapter/shamrock/xiaofei/music.js'
import { xiaofei_weather } from '../adapter/shamrock/xiaofei/weather.js'

export class Lain extends plugin {
  constructor () {
    super({
      name: '铃音基本设置',
      priority: -50,
      rule: [
        {
          reg: /^#(Lain|铃音)(强制)?更新(日志)?$/gi,
          fnc: 'update',
          permission: 'master'
        },
        {
          reg: /^#(我的|当前)?(id|信息)$/gi,
          fnc: 'user_id'
        },
        {
          reg: /^#(重载|重新加载)资源/,
          fnc: 'loadRes',
          permission: 'master'
        }
      ]
    })
  }

  async update (e) {
    let new_update = new Update()
    new_update.e = e
    new_update.reply = this.reply
    const name = 'Lain-plugin'
    if (e.msg.includes('更新日志')) {
      if (new_update.getPlugin(name)) {
        this.e.reply(await new_update.getLog(name))
      }
    } else {
      if (new_update.getPlugin(name)) {
        if (this.e.msg.includes('强制')) { execSync('git reset --hard', { cwd: `${process.cwd()}/plugins/${name}/` }) }
        await new_update.runUpdate(name)
        if (new_update.isUp) { setTimeout(() => new_update.restart(), 2000) }
      }
    }
    return true
  }

  async user_id (e) {
    const msg = []
    if (e.isMaster) msg.push(`Bot＄1�7${e.self_id}`)
    msg.push(`您的个人ID＄1�7${e.user_id}`)
    e.guild_id ? msg.push(`当前频道ID＄1�7${e.guild_id}`) : ''
    e.channel_id ? msg.push(`当前子频道ID＄1�7${e.channel_id}`) : ''
    e.group_id ? msg.push(`当前群聊ID＄1�7${e.group_id}`) : ''
    if (e.isMaster && e?.adapter === 'QQGuild') msg.push('\n温馨提示：\n使用本体黑白名单请使用��群聊ID」\n使用插件黑白名单请按照配置文件说明进行添加~')

    /** at用户 */
    if (e.isMaster && e.at) msg.push(`\n目标用户ID＄1�7${e.at}`)
    return await e.reply(`\n${msg.join('\n')}`, true, { at: true })
  }

  /** 微信椰奶状��自定义名称 */
  async ComName (e) {
    const msg = e.msg.replace('#微信修改名称', '').trim()
    const cfg = new YamlParse(Bot.lain._path + '/config.yaml')
    cfg.set('name', msg)
    Bot[Bot.lain.wc.uin].nickname = msg
    return await e.reply(`修改成功，新名称为：${msg}`, false, { at: true })
  }

  /** shamrock重载资源 */
  // async loadRes (e) {
  //   await e.reply('弢�始重载，请稍筄1�7...', true)
  //   let res = (await import('../adapter/shamrock/bot.js')).default
  //   res = new res(e.self_id)
  //   const msg = await res.LoadList()
  //   return await e.reply(msg, true)
  // }
}

export { xiaofei_music, xiaofei_weather }
