namespace contraption.draw {
    export class PixelData implements Resettable {
        static Pool = new ObjectPool<PixelData>(() => new PixelData());
        x: number;
        y: number;
        props: number[];

        reset() { }

        copyFrom(other: PixelData) {
            this.x = other.x;
            this.y = other.y;
            this.props = [];
            for (let i = 0; i < other.props.length; ++i)
                this.props.push(other.props[i]);
        }

        initFromVertex(v: RasterizerVertex) {
            this.props = [];
            this.x = v.x;
            this.y = v.y;
            for (let i = 0; i < v.props.length; ++i)
                this.props.push(v.props[i]);
        }

        initFromTriangleEquation(eqn: TriangleEquation, x: number, y: number) {
            this.props = [];
            for (let i = 0; i < eqn.props.length; ++i) {
                this.props.push(eqn.props[i].evaluate(x, y));
            }
        }

        stepX(eqn: TriangleEquation) {
            for (let i = 0; i < eqn.props.length; ++i)
                this.props[i] = eqn.props[i].stepX(this.props[i]);
        }

        stepY(eqn: TriangleEquation) {
            for (let i = 0; i < eqn.props.length; ++i)
                this.props[i] = eqn.props[i].stepY(this.props[i]);
        }
    }

    export class EdgeData implements Resettable {
        static Pool = new ObjectPool<EdgeData>(() => new EdgeData());
        ev0: number;
        ev1: number;
        ev2: number;

        init(eqn: TriangleEquation, x: number, y: number) {
            this.ev0 = eqn.e0.evaluate(x, y);
            this.ev1 = eqn.e1.evaluate(x, y);
            this.ev2 = eqn.e2.evaluate(x, y);
        }

        reset() { }

        copyFrom(other: EdgeData) {
            this.ev0 = other.ev0;
            this.ev1 = other.ev1;
            this.ev2 = other.ev2;
        }

        stepX(eqn: TriangleEquation) {
            this.ev0 = eqn.e0.stepX(this.ev0);
            this.ev1 = eqn.e1.stepX(this.ev1);
            this.ev2 = eqn.e2.stepX(this.ev2);
        }

        stepXScaled(eqn: TriangleEquation, step: number) {
            this.ev0 = eqn.e0.stepXScaled(this.ev0, step);
            this.ev1 = eqn.e1.stepXScaled(this.ev1, step);
            this.ev2 = eqn.e2.stepXScaled(this.ev2, step);
        }

        stepY(eqn: TriangleEquation) {
            this.ev0 = eqn.e0.stepY(this.ev0);
            this.ev1 = eqn.e1.stepY(this.ev1);
            this.ev2 = eqn.e2.stepY(this.ev2);
        }

        stepYScaled(eqn: TriangleEquation, step: number) {
            this.ev0 = eqn.e0.stepYScaled(this.ev0, step);
            this.ev1 = eqn.e1.stepYScaled(this.ev1, step);
            this.ev2 = eqn.e2.stepYScaled(this.ev2, step);
        }

        test(eqn: TriangleEquation) {
            return eqn.e0.testValue(this.ev0) && eqn.e1.testValue(this.ev1) && eqn.e2.testValue(this.ev2);
        }
    }
}
