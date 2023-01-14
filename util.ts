namespace contraption {
    export interface Resettable {
        reset(): void;
    }

    export class ObjectPool<T extends Resettable> {
        private pool: T[] = [];

        constructor(private factory: () => T) { }

        alloc(): T {
            if (this.pool.length) {
                return this.pool.pop();
            }
            return this.factory();
        }

        free(obj: T) {
            obj.reset();
            this.pool.push(obj);
        }
    }
}
