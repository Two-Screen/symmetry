declare module "tap" {
  export class Test {
    plan(count: number): void;
    end(): void;
    same(a: any, b: any, descr?: string): void;
    notSame(a: any, b: any, descr?: string): void;
  }

  export const comment: (message: string) => void;

  export const test: (name: string, block: (test: Test) => void) => void;
}
