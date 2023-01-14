namespace contraption.draw {
    export class PixelShader {
        drawPixel(p: PixelData) {
            // override in subclass
        }
        drawSpan(eqn: TriangleEquation, x: number, y: number, x2: number) {
            const xf = x + 0.5;
            const yf = y + 0.5;

            const p = PixelData.Pool.alloc();
            p.initFromTriangleEquation(eqn, xf, yf);
            p.y = y;

            while (x < x2) {
                p.x = x;
                this.drawPixel(p);
                p.stepX(eqn);
                ++x;
            }

            PixelData.Pool.free(p);
        }
        drawBlock(eqn: TriangleEquation, x: number, y: number, testEdges: boolean) {
            const xf = x + 0.5;
            const yf = y + 0.5;

            const po = PixelData.Pool.alloc();
            po.initFromTriangleEquation(eqn, xf, yf);

            const eo = EdgeData.Pool.alloc();
            if (testEdges)
                eo.init(eqn, xf, yf);

            for (let yy = y; yy < y + BLOCK_SIZE; ++yy) {
                const pi = PixelData.Pool.alloc();
                pi.copyFrom(po);

                const ei = EdgeData.Pool.alloc();
                if (testEdges)
                    ei.copyFrom(eo);

                for (let xx = x; xx < x + BLOCK_SIZE; ++xx) {
                    if (!testEdges || ei.test(eqn)) {
                        pi.x = xx;
                        pi.y = yy;
                        this.drawPixel(pi);
                    }

                    pi.stepX(eqn);
                    if (testEdges)
                        ei.stepX(eqn);
                }

                po.stepY(eqn);
                if (testEdges)
                    eo.stepY(eqn);
            }
        }
    }

    export class ColoredPixelShader extends PixelShader {
        drawPixel(p: PixelData) {
            const c = p.props[0] | 0;
            if (c) {
                screen.setPixel(p.x | 0, p.y | 0, c);
            }
        }
    }

    export class TexturedPixelShader extends PixelShader {
        texture: Image;
        // todo: add texture wrapping modes
        drawPixel(p: PixelData) {
            const u = p.props[0];
            const v = p.props[1];
            const tx = Math.abs((this.texture.width * u) % this.texture.width) | 0;
            const ty = Math.abs((this.texture.height * v) % this.texture.height) | 0;
            const c = this.texture.getPixel(tx, ty);
            if (c) {
                screen.setPixel(p.x | 0, p.y | 0, c);
            }
        }
    }
}
