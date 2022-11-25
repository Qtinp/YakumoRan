import { decode } from 'html-entities'
import { Bot } from '../event'

export interface Damaku {
  username: string
  avatar: string
  message: string
  color: string
  gender: number
  timestamp: number
}

export default (message: string) => {
  if (message.slice(0, 1) === '=') {
    const tmp = message.slice(1).split('>')
    if (tmp.length === 8) {
      const msg = {
        username: decode(tmp[0]),
        message: tmp[1],
        color: tmp[2],
        gender: Number(tmp[4]),
        avatar: tmp[5],
        timestamp: Number(tmp[6])
      }

      Bot.emit('damaku', msg)
      return true
    }
  }
}
