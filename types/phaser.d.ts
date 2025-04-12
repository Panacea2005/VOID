// Type definitions for Phaser
declare namespace Phaser {
  interface Game {
    destroy(removeCanvas?: boolean): void
  }

  namespace Scale {
    const RESIZE: string
    const FIT: string
    const CENTER_BOTH: string
  }

  namespace AUTO {
    const AUTO: number
  }

  namespace Input {
    namespace Keyboard {
      const KeyCodes: {
        R(R: any): Key
        F(F: any): Key
        ESC: number
        W: number
        A: number
        S: number
        D: number
        SPACE: number
      }

      function JustDown(key: Key): boolean

      interface Key {
        isDown: boolean
        on(event: string, callback: Function): void
      }
    }
  }

  namespace GameObjects {
    interface Rectangle {
      x: number
      y: number
      body: any
      destroy(): void
    }

    namespace Particles {
      interface ParticleEmitter {
        setPosition(x: number, y: number): void
        start(): void
        stop(): void
      }
    }
  }

  namespace Math {
    function Between(min: number, max: number): number
    namespace Distance {
      function Between(x1: number, y1: number, x2: number, y2: number): number;
    }
    function Linear(a: number, b: number, t: number): number
  }

  interface Scene {
    add: any
    physics: any
    input: any
    cameras: any
    sound: any
    tweens: any
    game: any
    scale: any
    time: any
  }
}

declare interface Window {
  Phaser: any
}
