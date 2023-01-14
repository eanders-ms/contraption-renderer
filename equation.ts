namespace contraption.draw {
    // Edge equation described in many places, including:
    // * https://www.cs.unc.edu/xcms/courses/comp770-s07/Lecture08.pdf
    // * https://www.researchgate.net/publication/286441992_Accelerated_Half-Space_Triangle_Rasterization
    export class EdgeEquation implements Resettable {
        static Pool = new ObjectPool<EdgeEquation>(() => new EdgeEquation());

        a: number;
        b: number;
        c: number;
        tie: boolean;

        init(v0: RasterizerVertex, v1: RasterizerVertex) {
            this.a = v0.y - v1.y;
            this.b = v1.x - v0.x;
            this.c = -(this.a * (v0.x + v1.x) + this.b * (v0.y + v1.y)) / 2;
        }

        reset() { }

        evaluate(x: number, y: number): number {
            return this.a * x + this.b * y + this.c;
        }

        testPoint(x: number, y: number): boolean {
            return this.testValue(this.evaluate(x, y));
        }

        testValue(v: number): boolean {
            return (v > 0 || (v === 0 && this.tie));
        }

        stepX(v: number): number {
            return v + this.a;
        }

        stepXScaled(v: number, step: number): number {
            return v + this.a * step;
        }

        stepY(v: number): number {
            return v + this.b;
        }

        stepYScaled(v: number, step: number): number {
            return v + this.b * step;
        }
    }

    // Same as EdgeEquation, but initialized differently for parameter interpolations (tex coords, for example)
    export class ParameterEquation implements Resettable {
        static Pool = new ObjectPool<ParameterEquation>(() => new ParameterEquation());
        a: number;
        b: number;
        c: number;

        init(p0: number, p1: number, p2: number, e0: EdgeEquation, e1: EdgeEquation, e2: EdgeEquation, factor: number) {
            this.a = factor * (p0 * e0.a + p1 * e1.a + p2 * e2.a);
            this.b = factor * (p0 * e0.b + p1 * e1.b + p2 * e2.b);
            this.c = factor * (p0 * e0.c + p1 * e1.c + p2 * e2.c);
        }

        reset() { }

        evaluate(x: number, y: number): number {
            return this.a * x + this.b * y + this.c;
        }

        stepX(v: number): number {
            return v + this.a;
        }

        stepXScaled(v: number, step: number): number {
            return v + this.a * step;
        }

        stepY(v: number): number {
            return v + this.b;
        }

        stepYScaled(v: number, step: number): number {
            return v + this.b * step;
        }
    }

    export class TriangleEquation implements Resettable {
        static Pool = new ObjectPool<TriangleEquation>(() => new TriangleEquation());

        area2: number;
        e0: EdgeEquation;
        e1: EdgeEquation;
        e2: EdgeEquation;
        props: ParameterEquation[];

        init(v0: RasterizerVertex, v1: RasterizerVertex, v2: RasterizerVertex) {
            this.e0 = EdgeEquation.Pool.alloc(); this.e0.init(v1, v2);
            this.e1 = EdgeEquation.Pool.alloc(); this.e1.init(v2, v0);
            this.e2 = EdgeEquation.Pool.alloc(); this.e2.init(v0, v1);

            this.area2 = this.e0.c + this.e1.c + this.e2.c;
            if (this.area2 <= 0) return;

            const factor = 1.0 / this.area2;

            if (!this.props)
                this.props = [];
            for (let i = 0; i < v0.props.length; ++i) {
                const prop = ParameterEquation.Pool.alloc();
                prop.init(v0.props[i], v1.props[i], v2.props[i], this.e0, this.e1, this.e2, factor)
                this.props.push(prop);
            }
        }

        reset() {
            EdgeEquation.Pool.free(this.e0);
            EdgeEquation.Pool.free(this.e1);
            EdgeEquation.Pool.free(this.e2);
            for (let i = 0; i < this.props.length; ++i)
                ParameterEquation.Pool.free(this.props[i]);
            this.props = [];
        }
    }
}
