// 昵称列表
export const nicknames = [
  '宝宝',
  '乖乖',
  '小晴妈咪',
] as const

export type Nickname = typeof nicknames[number]

// 获取随机昵称
export function getRandomNickname(): string {
  return nicknames[Math.floor(Math.random() * nicknames.length)]
}

