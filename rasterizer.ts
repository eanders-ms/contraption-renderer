namespace contraption.draw {
    export class Rasterizer {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
        shader: PixelShader;

        constructor() {
            this.setScissorRect(0, 0, 0, 0);
        }

        setScissorRect(minX: number, minY: number, maxX: number, maxY: number) {
            this.minX = minX;
            this.minY = minY;
            this.maxX = maxX;
            this.maxY = maxY;
        }

        setPixelShader(shader: PixelShader) {
            this.shader = shader;
        }

        scissorTest(x: number, y: number): boolean {
            return (x >= this.minX && x < this.maxX && y >= this.minY && y < this.maxY);
        }

        drawPoint(cmd: DrawPointCommand) {
            const v = cmd.v;
            if (!this.scissorTest(v.x, v.y))
                return;
            const p = this.pixelDataFromVertex(v);
            this.shader.drawPixel(p);
            PixelData.Pool.free(p);
        }

        drawLine(cmd: DrawLineCommand) {
            const v0 = cmd.v0;
            const v1 = cmd.v1;
            const adx = Math.abs(v1.x - v0.x) | 0;
            const ady = Math.abs(v1.y - v0.y) | 0;
            let steps = Math.max(adx, ady);
            const step = this.computeVertexStep(v0, v1, steps);
            const v = v0;
            while (steps-- > 0) {
                const p = this.pixelDataFromVertex(v);
                if (this.scissorTest(p.x, p.y))
                    this.shader.drawPixel(p);
                this.stepVertex(v, step);
                PixelData.Pool.free(p);
            }
        }

        drawTriangle(cmd: DrawTriangleCommand) {
            this.drawTriangleSpan(cmd.v0, cmd.v1, cmd.v2);
            //this.drawTriangleBlock(cmd.v0, cmd.v1, cmd.v2);
        }

        private drawTriangleBlock(v0: RasterizerVertex, v1: RasterizerVertex, v2: RasterizerVertex) {
            const eqn = TriangleEquation.Pool.alloc(); eqn.init(v0, v1, v2);

            // If triangle is backfacing, return (maybe not desired in 2d world)
            if (eqn.area2 <= 0) {
                TriangleEquation.Pool.free(eqn);
                return;
            }

            // Compute triangle bounding box.
            let minX = Math.min(Math.min(v0.x, v1.x), v2.x) | 0;
            let maxX = Math.max(Math.max(v0.x, v1.x), v2.x) | 0;
            let minY = Math.min(Math.min(v0.y, v1.y), v2.y) | 0;
            let maxY = Math.max(Math.max(v0.y, v1.y), v2.y) | 0;

            // Clip to scissor rect.
            minX = Math.max(minX, this.minX);
            maxX = Math.min(maxX, this.maxX);
            minY = Math.max(minY, this.minY);
            maxY = Math.min(maxY, this.maxY);

            // Round to block grid.
            minX = minX & ~(BLOCK_SIZE - 1);
            maxX = maxX & ~(BLOCK_SIZE - 1);
            minY = minY & ~(BLOCK_SIZE - 1);
            maxY = maxY & ~(BLOCK_SIZE - 1);

            const s = BLOCK_SIZE - 1;

            const stepsX = (maxX - minX) / BLOCK_SIZE + 1;
            const stepsY = (maxY - minY) / BLOCK_SIZE + 1;

            for (let i = 0; i < stepsX * stepsY; ++i) {
                const sx = i % stepsX;
                const sy = i / stepsX;

                // Add 0.5 to sample at pixel centers.
                const x = minX + sx * BLOCK_SIZE;
                const y = minY + sy * BLOCK_SIZE;

                const xf = x + 0.5;
                const yf = y + 0.5;

                // Test if block is inside or outside triangle or touches it.
                const e00 = EdgeData.Pool.alloc(); e00.init(eqn, xf, yf);
                const e01 = EdgeData.Pool.alloc(); e01.copyFrom(e00); e01.stepYScaled(eqn, s);
                const e10 = EdgeData.Pool.alloc(); e10.copyFrom(e00); e10.stepXScaled(eqn, s);
                const e11 = EdgeData.Pool.alloc(); e11.copyFrom(e01); e11.stepXScaled(eqn, s);

                const e00_0 = eqn.e0.testValue(e00.ev0), e00_1 = eqn.e1.testValue(e00.ev1), e00_2 = eqn.e2.testValue(e00.ev2), e00_all = (e00_0 && e00_1 && e00_2) ? 1 : 0;
                const e01_0 = eqn.e0.testValue(e01.ev0), e01_1 = eqn.e1.testValue(e01.ev1), e01_2 = eqn.e2.testValue(e01.ev2), e01_all = (e01_0 && e01_1 && e01_2) ? 1 : 0;
                const e10_0 = eqn.e0.testValue(e10.ev0), e10_1 = eqn.e1.testValue(e10.ev1), e10_2 = eqn.e2.testValue(e10.ev2), e10_all = (e10_0 && e10_1 && e10_2) ? 1 : 0;
                const e11_0 = eqn.e0.testValue(e11.ev0), e11_1 = eqn.e1.testValue(e11.ev1), e11_2 = eqn.e2.testValue(e11.ev2), e11_all = (e11_0 && e11_1 && e11_2) ? 1 : 0;

                const result = e00_all + e01_all + e10_all + e11_all;

                // Potentially all out.
                if (result == 0) {
                    // Test for special case.
                    const e00Same = e00_0 == e00_1 == e00_2;
                    const e01Same = e01_0 == e01_1 == e01_2;
                    const e10Same = e10_0 == e10_1 == e10_2;
                    const e11Same = e11_0 == e11_1 == e11_2;

                    if (!e00Same || !e01Same || !e10Same || !e11Same)
                        this.shader.drawBlock(eqn, x, y, true);
                } else if (result == 4) {
                    // Fully Covered.
                    this.shader.drawBlock(eqn, x, y, false);
                } else {
                    // Partially Covered.
                    this.shader.drawBlock(eqn, x, y, true);
                }
            }

            TriangleEquation.Pool.free(eqn);
        }

        // http://www.sunshine2k.de/coding/java/TriangleRasterization/TriangleRasterization.html
        private drawTriangleSpan(v0: RasterizerVertex, v1: RasterizerVertex, v2: RasterizerVertex) {
            const eqn = TriangleEquation.Pool.alloc(); eqn.init(v0, v1, v2);

            // If triangle is backfacing, return (maybe not desired in 2d world)
            if (eqn.area2 <= 0) {
                TriangleEquation.Pool.free(eqn);
                return;
            }

            let t: RasterizerVertex = v0;
            let m: RasterizerVertex = v1;
            let b: RasterizerVertex = v2;

            // Sort verts from top to bottom
            if (t.y > m.y) {
                const tmp = t;
                t = m;
                m = tmp;
            }
            if (m.y > b.y) {
                const tmp = m;
                m = b;
                b = tmp;
            }
            if (t.y > m.y) {
                const tmp = t;
                t = m;
                m = tmp;
            }

            if (m.y === t.y) {
                let l = m;
                let r = t;
                if (l.x > r.x) {
                    const tmp = l;
                    l = r;
                    r = tmp;
                }
                this.drawTopFlatTriangle(eqn, l, r, b);
            } else if (m.y === b.y) {
                let l = m;
                let r = b;
                if (l.x > r.x) {
                    const tmp = l;
                    l = r;
                    r = tmp;
                }
                this.drawBottomFlatTriangle(eqn, t, l, r);
            } else {
                const dy = (b.y - t.y);
                const iy = (m.y - t.y);
                const v4 = new RasterizerVertex();
                v4.y = m.y;
                v4.x = t.x + ((b.x - t.x) / dy) * iy;
                for (let i = 0; i < v0.props.length; ++i)
                    v4.props.push(t.props[i] + ((b.props[i] - t.props[i]) / dy) * iy);

                let l = m;
                let r = v4;
                if (l.x > r.x) {
                    const t = l;
                    l = r;
                    r = t;
                }

                this.drawBottomFlatTriangle(eqn, t, l, r);
                this.drawTopFlatTriangle(eqn, l, r, b);
            }

            TriangleEquation.Pool.free(eqn);
        }

        private drawTopFlatTriangle(eqn: TriangleEquation, v0: RasterizerVertex, v1: RasterizerVertex, v2: RasterizerVertex) {
            const invslope1 = (v2.x - v0.x) / (v2.y - v0.y);
            const invslope2 = (v2.x - v1.x) / (v2.y - v1.y);

            for (let scanlineY = (v2.y - 0.5) | 0; scanlineY > ((v0.y - 0.5) | 0); --scanlineY) {
                const dy = (scanlineY - v2.y) + 0.5;
                const curx1 = v2.x + invslope1 * dy + 0.5;
                const curx2 = v2.x + invslope2 * dy + 0.5;
                const xl = Math.max(this.minX, curx1 | 0);
                const xr = Math.min(this.maxX, curx2 | 0);
                this.shader.drawSpan(eqn, xl, scanlineY, xr);
            }
        }

        private drawBottomFlatTriangle(eqn: TriangleEquation, v0: RasterizerVertex, v1: RasterizerVertex, v2: RasterizerVertex) {
            const invslope1 = (v1.x - v0.x) / (v1.y - v0.y);
            const invslope2 = (v2.x - v0.x) / (v2.y - v0.y);

            for (let scanlineY = (v0.y + 0.5) | 0; scanlineY < ((v1.y + 0.5) | 0); ++scanlineY) {
                const dy = (scanlineY - v0.y) + 0.5;
                const curx1 = v0.x + invslope1 * dy + 0.5;
                const curx2 = v0.x + invslope2 * dy + 0.5;
                const xl = Math.max(this.minX, curx1 | 0);
                const xr = Math.min(this.maxX, curx2 | 0);
                this.shader.drawSpan(eqn, xl, scanlineY, xr);
            }
        }

        private pixelDataFromVertex(v: RasterizerVertex): PixelData {
            const p = PixelData.Pool.alloc();
            p.initFromVertex(v);
            return p;
        }

        private stepVertex(v: RasterizerVertex, step: RasterizerVertex) {
            v.x += step.x;
            v.y += step.y;
            for (let i = 0; i < v.props.length; ++i)
                v.props[i] += step.props[i];
        }

        private computeVertexStep(v0: RasterizerVertex, v1: RasterizerVertex, adx: number): RasterizerVertex {
            const step = new RasterizerVertex();
            step.x = (v1.x - v0.x) / adx;
            step.y = (v1.y - v0.y) / adx;
            step.props.length = v0.props.length;
            for (let i = 0; i < v0.props.length; ++i)
                step.props[i] = (v1.props[i] - v0.props[i]) / adx;
            return step;
        }
    }
}
