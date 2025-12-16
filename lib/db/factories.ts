// 数据工厂 - 用于创建测试数据和默认值
import { 
  type DrizzleNewMessage, 
  type DrizzleNewPhoto, 
  type DrizzleNewCustomQuote,
  DEFAULT_VALUES,
  CONSTRAINTS
} from './types'

// 颜色选项
const NOTE_COLORS = [
  '#FFE4E1', // 淡粉
  '#FFF0F5', // 薰衣草红
  '#FFB6C1', // 浅粉红
  '#FFDAB9', // 桃色
  '#FFE4B5', // 淡黄
  '#E6E6FA', // 薰衣草
] as const

// 消息工厂
export class MessageFactory {
  static create(overrides: Partial<DrizzleNewMessage> = {}): DrizzleNewMessage {
    return {
      content: '这是一条测试留言',
      color: this.getRandomColor(),
      ...overrides,
    }
  }

  static createValid(content: string, color?: string): DrizzleNewMessage {
    return {
      content: content.trim(),
      color: color || this.getRandomColor(),
    }
  }

  static createInvalid(): {
    empty: DrizzleNewMessage
    tooLong: DrizzleNewMessage
    invalidColor: DrizzleNewMessage
  } {
    return {
      empty: { content: '', color: DEFAULT_VALUES.MESSAGE_COLOR },
      tooLong: { 
        content: 'a'.repeat(CONSTRAINTS.MAX_CONTENT_LENGTH + 1), 
        color: DEFAULT_VALUES.MESSAGE_COLOR 
      },
      invalidColor: { content: '测试内容', color: 'invalid-color' },
    }
  }

  static getRandomColor(): string {
    return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
  }

  static createBatch(count: number): DrizzleNewMessage[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({ content: `测试留言 ${i + 1}` })
    )
  }
}

// 照片工厂
export class PhotoFactory {
  static create(overrides: Partial<DrizzleNewPhoto> = {}): DrizzleNewPhoto {
    return {
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop',
      caption: '测试照片',
      isCustom: true,
      ...overrides,
    }
  }

  static createValid(url: string, caption?: string, isCustom = true): DrizzleNewPhoto {
    return {
      url,
      caption: caption || DEFAULT_VALUES.PHOTO_CAPTION,
      isCustom,
    }
  }

  static createInvalid(): {
    emptyUrl: DrizzleNewPhoto
    invalidUrl: DrizzleNewPhoto
    longCaption: DrizzleNewPhoto
  } {
    return {
      emptyUrl: { 
        url: '', 
        caption: '测试', 
        isCustom: true 
      },
      invalidUrl: { 
        url: 'not-a-url', 
        caption: '测试', 
        isCustom: true 
      },
      longCaption: { 
        url: 'https://example.com/test.jpg', 
        caption: 'a'.repeat(CONSTRAINTS.MAX_CAPTION_LENGTH + 1), 
        isCustom: true 
      },
    }
  }

  static createDefault(): DrizzleNewPhoto[] {
    return [
      {
        url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop',
        caption: '添加你们的美好回忆 💕',
        isCustom: false,
      },
      {
        url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=400&fit=crop',
        caption: '记录每一个甜蜜瞬间 🌸',
        isCustom: false,
      },
      {
        url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=400&fit=crop',
        caption: '珍藏两人的温馨时光 ✨',
        isCustom: false,
      },
    ]
  }

  static createBatch(count: number): DrizzleNewPhoto[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({ 
        url: `https://example.com/photo-${i + 1}.jpg`,
        caption: `测试照片 ${i + 1}` 
      })
    )
  }
}

// 情话工厂
export class QuoteFactory {
  static create(overrides: Partial<DrizzleNewCustomQuote> = {}): DrizzleNewCustomQuote {
    return {
      text: '这是一条测试情话',
      ...overrides,
    }
  }

  static createValid(text: string): DrizzleNewCustomQuote {
    return {
      text: text.trim(),
    }
  }

  static createInvalid(): {
    empty: DrizzleNewCustomQuote
    tooLong: DrizzleNewCustomQuote
  } {
    return {
      empty: { text: '' },
      tooLong: { text: 'a'.repeat(CONSTRAINTS.MAX_CONTENT_LENGTH + 1) },
    }
  }

  static createSample(): DrizzleNewCustomQuote[] {
    return [
      { text: '遇见你是我最美好的意外' },
      { text: '你是我心中永远的温柔' },
      { text: '和你在一起的每一天都很幸福' },
      { text: '想把世界上最好的都给你' },
      { text: '余生很长，我想和你一起走过' },
    ]
  }

  static createBatch(count: number): DrizzleNewCustomQuote[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({ text: `测试情话 ${i + 1}` })
    )
  }
}

// 通用工厂函数
export function createTestData() {
  return {
    messages: MessageFactory.createBatch(5),
    photos: PhotoFactory.createBatch(3),
    quotes: QuoteFactory.createBatch(4),
  }
}

export function createDefaultData() {
  return {
    photos: PhotoFactory.createDefault(),
    quotes: QuoteFactory.createSample(),
  }
}

// 随机数据生成器
export class RandomDataGenerator {
  private static readonly SAMPLE_CONTENTS = [
    '今天天气真好',
    '想你了',
    '爱你每一天',
    '和你在一起很开心',
    '你是我的小幸运',
    '永远爱你',
    '想要和你一起看日出',
    '你的笑容最美',
  ]

  private static readonly SAMPLE_CAPTIONS = [
    '美好回忆',
    '甜蜜时光',
    '幸福瞬间',
    '温馨时刻',
    '珍贵回忆',
  ]

  static generateMessage(): DrizzleNewMessage {
    const content = this.SAMPLE_CONTENTS[Math.floor(Math.random() * this.SAMPLE_CONTENTS.length)]
    return MessageFactory.create({ content })
  }

  static generatePhoto(): DrizzleNewPhoto {
    const caption = this.SAMPLE_CAPTIONS[Math.floor(Math.random() * this.SAMPLE_CAPTIONS.length)]
    return PhotoFactory.create({ caption })
  }

  static generateQuote(): DrizzleNewCustomQuote {
    const text = this.SAMPLE_CONTENTS[Math.floor(Math.random() * this.SAMPLE_CONTENTS.length)]
    return QuoteFactory.create({ text })
  }

  static generateBatch(count: number) {
    return {
      messages: Array.from({ length: count }, () => this.generateMessage()),
      photos: Array.from({ length: count }, () => this.generatePhoto()),
      quotes: Array.from({ length: count }, () => this.generateQuote()),
    }
  }
}