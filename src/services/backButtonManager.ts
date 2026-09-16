type BackHandler = () => boolean;

interface RegisteredHandler {
  id: string;
  handler: BackHandler;
  priority: number;
}

class BackButtonManager {
  private handlers: RegisteredHandler[] = [];

  /**
   * 注册返回键监听
   * @param id 唯一标识符
   * @param handler 返回 true 表示已消费该返回事件，false 表示未消费继续向下传递
   * @param priority 优先级，数值越高越先执行
   */
  public register(id: string, handler: BackHandler, priority: number = 0): void {
    this.handlers = this.handlers.filter(h => h.id !== id);
    this.handlers.push({ id, handler, priority });
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  public unregister(id: string): void {
    this.handlers = this.handlers.filter(h => h.id !== id);
  }

  /**
   * 触发返回逻辑
   * @returns true: 已被某一层级处理消费; false: 无任何层级处理
   */
  public handleBack(): boolean {
    for (const item of this.handlers) {
      try {
        if (item.handler()) {
          return true;
        }
      } catch (err) {
        console.warn(`Error executing back handler for ${item.id}:`, err);
      }
    }
    return false;
  }
}

export const backButtonManager = new BackButtonManager();
