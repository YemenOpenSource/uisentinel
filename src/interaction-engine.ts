import { Page } from 'playwright';
import {
  Action,
  ActionClick,
  ActionHover,
  ActionFill,
  ActionType,
  ActionScroll,
  ActionWait,
  ActionPress,
  ActionSelect,
} from './types';

/**
 * Handles execution of interactive browser actions
 * Used by AI agents to test dynamic UI states
 */
export class InteractionEngine {
  constructor(private page: Page) {}

  /**
   * Execute a single action
   */
  async executeAction(action: Action): Promise<void> {
    console.log(`  🎬 ${action.type}: ${this.describeAction(action)}`);

    try {
      switch (action.type) {
        case 'click':
          await this.executeClick(action);
          break;
        case 'hover':
          await this.executeHover(action);
          break;
        case 'fill':
          await this.executeFill(action);
          break;
        case 'type':
          await this.executeType(action);
          break;
        case 'scroll':
          await this.executeScroll(action);
          break;
        case 'wait':
          await this.executeWait(action);
          break;
        case 'press':
          await this.executePress(action);
          break;
        case 'select':
          await this.executeSelect(action);
          break;
        default:
          throw new Error(`Unknown action type: ${(action as any).type}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to execute ${action.type}: ${error.message}`);
    }
  }

  /**
   * Execute a sequence of actions
   */
  async executeSequence(actions: Action[]): Promise<void> {
    if (actions.length === 0) return;

    console.log(`🎭 Executing ${actions.length} action(s)...`);

    for (let i = 0; i < actions.length; i++) {
      try {
        await this.executeAction(actions[i]);
      } catch (error: any) {
        throw new Error(
          `Action ${i + 1}/${actions.length} failed (${actions[i].type}): ${error.message}`
        );
      }
    }

    console.log(`✅ All actions completed`);
  }

  // Private implementation methods

  private async executeClick(action: ActionClick): Promise<void> {
    await this.page.click(action.selector, {
      button: action.button || 'left',
      clickCount: action.clickCount || 1,
    });
  }

  private async executeHover(action: ActionHover): Promise<void> {
    await this.page.hover(action.selector);
    if (action.duration) {
      await this.page.waitForTimeout(action.duration);
    }
  }

  private async executeFill(action: ActionFill): Promise<void> {
    await this.page.fill(action.selector, action.value);
  }

  private async executeType(action: ActionType): Promise<void> {
    await this.page.type(action.selector, action.text, {
      delay: action.delay,
    });
  }

  private async executeScroll(action: ActionScroll): Promise<void> {
    if (action.selector) {
      // Scroll to element
      await this.page.locator(action.selector).scrollIntoViewIfNeeded();
    } else if (action.x !== undefined || action.y !== undefined) {
      // Scroll to coordinates
      await this.page.evaluate(
        `window.scrollTo(${action.x || 0}, ${action.y || 0})`
      );
    }
  }

  private async executeWait(action: ActionWait): Promise<void> {
    if (action.selector) {
      // Wait for element to appear
      await this.page.waitForSelector(action.selector, {
        state: 'visible',
        timeout: 30000,
      });
    } else if (action.duration) {
      // Wait fixed duration
      await this.page.waitForTimeout(action.duration);
    }
  }

  private async executePress(action: ActionPress): Promise<void> {
    await this.page.keyboard.press(action.key);
  }

  private async executeSelect(action: ActionSelect): Promise<void> {
    await this.page.selectOption(action.selector, action.value);
  }

  /**
   * Get human-readable description of action for logging
   */
  private describeAction(action: Action): string {
    switch (action.type) {
      case 'click':
        return `${action.selector}${action.clickCount && action.clickCount > 1 ? ` (${action.clickCount}x)` : ''}`;
      case 'hover':
        return `${action.selector}${action.duration ? ` (${action.duration}ms)` : ''}`;
      case 'fill':
        return `${action.selector} = "${action.value}"`;
      case 'type':
        return `${action.selector} << "${action.text}"`;
      case 'scroll':
        return action.selector
          ? `to ${action.selector}`
          : `(${action.x || 0}, ${action.y || 0})`;
      case 'wait':
        return action.selector ? `for ${action.selector}` : `${action.duration}ms`;
      case 'press':
        return action.key;
      case 'select':
        return `${action.selector} = "${action.value}"`;
      default:
        return '';
    }
  }
}
