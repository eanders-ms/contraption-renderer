const RENDER_PRIORITY = 40;
const RASTERIZER_PRIORITY = 50;
const UPDATE_SCREEN_PRIORITY = 200;



const testImg = img`
    ...........ccccc66666...........
    ........ccc4444444444666........
    ......cc444444444bb4444466......
    .....cb4444bb4444b5b444444b.....
    ....eb4444b5b44444b44444444b....
    ...ebb44444b4444444444b444446...
    ..eb6bb444444444bb444b5b444446..
    ..e6bb5b44444444b5b444b44bb44e..
    .e66b4b4444444444b4444444b5b44e.
    .e6bb444444444444444444444bb44e.
    eb66b44444bb444444444444444444be
    eb66bb444b5b44444444bb44444444be
    fb666b444bb444444444b5b4444444bf
    fcb666b44444444444444bb444444bcf
    .fbb6666b44444444444444444444bf.
    .efbb66666bb4444444444444444bfe.
    .86fcbb66666bbb44444444444bcc688
    8772effcbbbbbbbbbbbbbbbbcfc22778
    87722222cccccccccccccccc22226678
    f866622222222222222222222276686f
    fef866677766667777776667777fffef
    fbff877768f86777777666776fffffbf
    fbeffeefffeff7766688effeeeefeb6f
    f6bfffeffeeeeeeeeeeeeefeeeeebb6e
    f66ddfffffeeeffeffeeeeeffeedb46e
    .c66ddd4effffffeeeeeffff4ddb46e.
    .fc6b4dddddddddddddddddddb444ee.
    ..ff6bb444444444444444444444ee..
    ....ffbbbb4444444444444444ee....
    ......ffebbbbbb44444444eee......
    .........fffffffcccccee.........
    ................................
`

const renderer = new contraption.draw.Renderer();
renderer.rasterizer.setScissorRect(0, 0, screen.width, screen.height);

const shader = new contraption.draw.TexturedPixelShader();
shader.texture = testImg;

const tri0 = new contraption.draw.DrawTriangleCommand(shader);
const tri1 = new contraption.draw.DrawTriangleCommand(shader);

// set uv coords - tri0
tri0.v0.props[0] = 0; tri0.v0.props[1] = 0;
tri0.v1.props[0] = 1; tri0.v1.props[1] = 0;
tri0.v2.props[0] = 1; tri0.v2.props[1] = 1;
// set uv coords - tri1
tri1.v0.props[0] = 1; tri1.v0.props[1] = 1;
tri1.v1.props[0] = 0; tri1.v1.props[1] = 1;
tri1.v2.props[0] = 0; tri1.v2.props[1] = 0;

// set verts - tri 0
tri0.v0.x = 32; tri0.v0.y = 32;
tri0.v1.x = 100; tri0.v1.y = 32;
tri0.v2.x = 100; tri0.v2.y = 100;
// set verts - tri 1
tri1.v0.x = 100; tri1.v0.y = 100;
tri1.v1.x = 32; tri1.v1.y = 100;
tri1.v2.x = 32; tri1.v2.y = 32;

const ev = control.pushEventContext();
ev.registerFrameHandler(RENDER_PRIORITY, () => {
    renderer.enqueueDrawCommand(tri0);
    renderer.enqueueDrawCommand(tri1);
});
ev.registerFrameHandler(RASTERIZER_PRIORITY, () => {
    renderer.render();
});
ev.registerFrameHandler(UPDATE_SCREEN_PRIORITY, control.__screen.update);

