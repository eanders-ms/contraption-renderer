namespace contraption.draw {
    export class Renderer {
        cmds: DrawCommand[];
        rasterizer: Rasterizer;

        constructor() {
            this.cmds = [];
            this.rasterizer = new Rasterizer();
        }

        enqueueDrawCommand(cmd: DrawCommand) {
            this.cmds.push(cmd);
        }

        render() {
            for (let i = 0; i < this.cmds.length; ++i) {
                const cmd = this.cmds[i];
                this.rasterizer.setPixelShader(cmd.shader);
                cmd.draw(this.rasterizer);
            }
            this.cmds = [];
        }
    }
}
