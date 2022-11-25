import * as fs from 'fs'
import * as path from 'path'

export class FileRepository<D extends Record<string, any> = any> {
  /** 根目录路径 */
  root: string
  /** 存储的文件后缀 */
  fileType = '.json'
  constructor (rootDir: string, opts?: any) {
    this.root = path.join(__dirname, '../../../data/', rootDir)
    console.log(this.root)
    try {
      fs.mkdirSync(this.root)
    } catch (error) {}
  }

  findAll<T extends D = D> (): T[] {
    return fs.readdirSync(this.root).map((file) => {
      const filePath = path.join(this.root, file)
      return JSON.parse(fs.readFileSync(filePath).toString())
    })
  }

  handle<T extends D = D> (fileName: string) {
    return {
      get: (data?: T) => this.getData<T>(fileName, data),
      set: (data: T) => this.setData(fileName, data)
    }
  }

  /**
   * 读取数据
   * @param fileName 数据标识(文件名, 不含后缀)
   * @param data 如果为空时的默认Object
   * @returns Object
   */
  getData<T extends D = D> (fileName: string, data?: T): T {
    const filePath = path.join(this.root, fileName + this.fileType)
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(data || {}, null, 4))
    }
    return JSON.parse(fs.readFileSync(filePath).toString())
  }

  /**
   * 存入数据
   * @param key 数据标识(文件名, 不含后缀)
   * @param data Object
   * @returns Object
   */
  setData<T extends D = D> (key: string, data: T): boolean {
    const filePath = path.join(this.root, key + this.fileType)
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4))
      return true
    } catch (error) {
      return false
    }
  }

  exits (key: string) {
    const filePath = path.join(this.root, key)
    return fs.existsSync(filePath)
  }
}
