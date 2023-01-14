namespace contraption.draw {
    export class RasterizerVertex {
        x: number;
        y: number;
        props: number[]; // interpolated vertex properties (tex coords, for example)

        constructor() {
            this.x = 0;
            this.y = 0;
            this.props = [];
        }
    }
}
