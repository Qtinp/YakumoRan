import config from '../../config'
import * as api from '../../lib/api'
import { FileRepository } from './tools'

export interface RankingType {
  uid: string
  name: string
  money: number
}

export class Wallet {
  uid: string = ''
  name: string = ''
  money: number = 0
  count: number = 0
  highest: number = 0
}

const botName = '\\s*(?:' + [
  `\\s+\\[\\*${config.account.username}\\*\\]\\s+`,
  config.app.name,
  config.app.nickname
].join('|') + ')'

const initalMoney: number = 100
const MinMoney: number = 1
let MaxRound: number = 8

const gameStore = new FileRepository<RankingType>('gambling')
const walletStore = new FileRepository<Wallet>('gambling/users')
const rankings = gameStore.getData('rankings', {
  uid: '0',
  name: '',
  money: 0
})

const regTake = '(?:压|押|壓|\\$)\\s*(完|\\d+(?:\\.\\d+)?)\\s*(?:(?:×|x|X|\\*|连|乘)\\s*(\\d+))?'
api.command(RegExp(`^${botName}\\s*${regTake}\\s*$`), '', (m, e, reply) => {
  const wallet = walletStore.getData(e.uid, new Wallet())
  wallet.uid = e.uid
  wallet.name = e.username
  let money = wallet.money
  let round = 1

  if (m[2]) {
    round = Number(m[2]) > MaxRound ? MaxRound : Number(m[2])
  }

  while (round > 0) {
    round -= 1
    const bet = (m[1] === '完') ? money : Number(m[1])

    if (!money || money < bet) {
      reply(` [*${e.username}*]   :  抱歉  ,  您的余额不足  ,  您的当前余额为  :  ${money} 钞`, e.color)
      round = 0
      return null
    }

    if (bet < MinMoney) {
      reply(` [*${e.username}*]   :  押注金额必须大于等于 ${MinMoney}`, e.color)
      round = 0
      return null
    }

    if (Math.round(Math.random())) {
      money = Math.round((money + bet) * 1000) / 1000
      reply(` [*${e.username}*]   :  余额 + ${bet} 钞   ✔️   ,   💰 ${money} 钞`, e.color)
    } else {
      money = Math.round((money - bet) * 1000) / 1000
      reply(` [*${e.username}*]   :  余额 - ${bet} 钞   ❌   ,   💰 ${money} 钞`, e.color)
    }

    if (money > wallet.highest) {
      wallet.highest = money
    }
    wallet.money = money
    walletStore.setData(e.uid, wallet)
  }

  if (money > rankings.money) {
    const former = rankings.uid
    rankings.uid = e.uid
    rankings.name = e.username
    rankings.money = money
    gameStore.setData('rankings', rankings)
    if (e.uid === former) {
      return // 同一人
    }
    reply([
      '[gambling]',
      ` [*${e.username}*]  :  恭喜你打破最高记录!!!`,
      '艾特加[查看排行榜]查询'
    ].join('\n'), config.app.color)
  }
})

api.command(/\/gambling setMaxRound\s*(\d+)\s*$/, 'gambling.admin.setMaxRound', (m, e, reply) => {
  if (e.uid === config.app.master_uid) {
    MaxRound = Number(m[1])
    reply([
      ` [gambling] 连压次数最大限制为 : ${MaxRound.toString()} 次`,
      '注：连压次数设置为 0 次 即为禁赌'
    ].join('\n'), e.color)
  }
})

api.command(RegExp(`^${botName}(强制)?(刷新|重启钱包)$`), 'gambling.user.flushed', (m, e, reply) => {
  const wallet = walletStore.getData(e.uid, new Wallet())
  wallet.uid = e.uid
  wallet.name = e.username
  if (!m[1] && wallet.money > initalMoney) {
    reply(`您当前余额为  :  ${wallet.money} 钞，是否强制${m[2]}？`, config.app.color)
    return
  }
  wallet.count += 1
  wallet.money = initalMoney
  walletStore.setData(e.uid, wallet)
  reply(` [*${e.username}*]  :  已${m[2]}，余额  :  ${initalMoney.toString()} 钞`, config.app.color)
})

api.command(RegExp(`^${botName}\\s*(查询|查看)(钱包|余额|小钱钱)$`), 'gambling.user.check', (m, e, reply) => {
  const wallet = walletStore.getData(e.uid, new Wallet())
  wallet.uid = e.uid
  wallet.name = e.username
  reply([
    '[gambling]',
    `用户 : [*${e.username}*] `,
    `您的当前余额为 : ${wallet.money} 钞`,
    `您的最高记录为 : ${wallet.highest} 钞`,
    `您的破产记录为 : ${wallet.count} 次`,
    '请再接再厉!'
  ].join('\n'), e.color)
})

api.command(RegExp(`^${botName}\\s*(查询|查看)(排名|排行榜|财富榜)$`), 'gambling.user.rankings', (m, e, reply) => {
  const userWallets = walletStore.findAll()
  const rankings = userWallets.sort((a, b) => {
    return b.highest - a.highest
  })[0]
  if (!rankings) {
    reply('[gambling] 暂无记录')
    return
  }
  const list = userWallets.sort((a, b) => {
    return b.money - a.money
  }).map(e => {
    return `> [*${e.name}*]  :  💰${e.money}`
  })
  reply([
    '[gambling]',
    `历史最高  :  ${rankings.name}`,
    `> [@${rankings.uid}@]  :  💰${rankings.money}`,
    '',
    '当前财富榜  :  '
  ].concat(list.splice(0, 10)).join('\n'), config.app.color)
})
