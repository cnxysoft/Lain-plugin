# 这里是一处Lain-Plugin备份仓库，有一定修改适配Yunzai-next
Github：
```
git clone --depth=1 -b next-pe https://github.com/cnxysoft/Lain-plugin ./plugins/Lain-plugin/
```
## Yunzai-Next安装依赖
```
yarn install
```
## 简介
`Lain-plugin`是一个围绕喵崽`Miao-Yunzai`开发的多适配器插件，让喵崽接入`QQ频道`、`微信`、`shamrock`等三方平台~，不再局限于ICQQ。

### 本插件原主开发(Zyy955)从2024年2月20日18:00:00脱离开发，宣布永久停更，并已删除/私有插件原仓库
### 支持原作者的新项目（活跃开发中）：[KarinJS/Karin](https://gitee.com/KarinJS/Karin)


## 使用
### 0. 前置：跳过云崽的ICQQ登录
不想登录ICQQ并继续使用本插件：

- 更新喵崽到最新
- 打开喵崽的`config/config/bot.yaml`文件将 `skip_login: false` 修改为 `skip_login: true`
- 如果不存在这个，自行加一行  `skip_login: true` 即可。

### 1.安装插件

在`Miao-Yunzai`根目录执行

Github：
```
git clone --depth=1 https://github.com/cnxysoft/Lain-plugin ./plugins/Lain-plugin
```

### 2.安装依赖

```
pnpm install -P
```

`安装失败再用这个：`
```
pnpm config set sharp_binary_host "https://npmmirror.com/mirrors/sharp" && pnpm config set sharp_libvips_binary_host "https://npmmirror.com/mirrors/sharp-libvips" && pnpm install -P
```

### 3.使用适配器

请点击查看对应教程~

- [标准输入](./docs/stdin.md)
- [PC微信](./docs/WeChat.md)
- [Shamrock](./docs/Shamrock.md)
- [QQBot(群和频道)](./docs/QQBot.md)
- [网页版微信](./docs/WeXin.md)
- [Lagrange.Core](./docs/Lagrange.Core.md)
- OneBotv11: 换个地址的事，都连`/OneBotv11`就完事了

## 4.设置主人

- 使用方法
  - 方法1：发送`#设置主人`，随后复制发送控制台的验证码即可成为主人
  - 方法2：发送`#设置主人@用户`，需要你是主人的情况下，指定此用户成为主人

主人可通过`#取消主人@用户`或者`#删除主人@用户`

## 插件更新

- #铃音更新
- #Lain更新

## 如何区分适配器

- `e.adapter` || `Bot[uin].adapter`
- 标准输入：`stdin`
- QQ频道：`QQGuild`
- Shamrock：`shamrock`
- PC微信：`ComWeChat`
- QQBot：`QQBot`
- 网页版微信：`WeXin`
- LagrangeCore: `LagrangeCore`
- OneBotv11: `OneBotv11`

## 适配进度
- [x] 标准输入
- [x] 跳过登录QQ
- [x] QQ频道适配器
- [x] PC微信适配器
- [x] 网页版微信适配器
- [x] Shamrock适配器
- [x] QQBot适配器
- [x] LagrangeCore
- [x] OneBotv11

## 特别鸣谢

以下排名不分先后

- [Miao-Yunzai](https://github.com/yoimiya-kokomi/Miao-Yunzai)
- [索引库](https://github.com/yhArcadia/Yunzai-Bot-plugins-index)
- [OpenShamrock](https://github.com/whitechi73/OpenShamrock)
- [ComWeChat](https://github.com/JustUndertaker/ComWeChatBotClient)
- [wechat4u](https://github.com/nodeWechat/wechat4u/blob/master/run-core.js)
- [qq-group-bot](https://github.com/lc-cn/qq-group-bot)
- [QQBot按钮库](https://gitee.com/lava081/button)
- [xiaoye12123](https://gitee.com/xiaoye12123)
- [Lagrange.Core](https://github.com/LagrangeDev/Lagrange.Core)
- [OneBotv11](https://github.com/OneBotv11/OneBotv11)
