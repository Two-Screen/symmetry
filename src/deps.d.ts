declare module "tap" {
  export class Test {
    plan(count: number): void;
    end(): void;
    pass(message?: string, extra?: object): void;
    fail(message?: string, extra?: object): void;
    same(found: any, wanted: any, message?: string): void;
    notSame(found: any, wanted: any, message?: string): void;
  }

  export const test: (name: string, block: (test: Test) => void) => void;
}
