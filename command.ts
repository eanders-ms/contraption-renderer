namespace contraption.draw {
    export class DrawCommand {
        shader: PixelShader;
        constructor(shader: PixelShader) {
            this.shader = shader;
        }
        draw(rasterizer: Rasterizer) {
            // override in subclass
        }
    }

    export class DrawPointCommand extends DrawCommand {
        v: RasterizerVertex;

        constructor(shader: PixelShader) {
            super(shader);
            this.v = new RasterizerVertex();
        }

        draw(rasterizer: Rasterizer) {
            rasterizer.drawPoint(this);
        }
    }

    export class DrawLineCommand extends DrawCommand {
        v0: RasterizerVertex;
        v1: RasterizerVertex;

        constructor(shader: PixelShader) {
            super(shader);
            this.v0 = new RasterizerVertex();
            this.v1 = new RasterizerVertex();
        }

        draw(rasterizer: Rasterizer) {
            rasterizer.drawLine(this);
        }
    }

    export class DrawTriangleCommand extends DrawCommand {
        v0: RasterizerVertex;
        v1: RasterizerVertex;
        v2: RasterizerVertex;

        constructor(shader: PixelShader) {
            super(shader);
            this.v0 = new RasterizerVertex();
            this.v1 = new RasterizerVertex();
            this.v2 = new RasterizerVertex();
        }

        draw(rasterizer: Rasterizer) {
            rasterizer.drawTriangle(this);
        }
    }
}
