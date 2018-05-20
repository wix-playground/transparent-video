const VIDEOS = [
    'https://video.wixstatic.com/video/009625_5b77713f4bde47aba5cc4a10ac338a3e/720p/mp4/file.mp4'
];

main();

function main () {
    const canvas = document.getElementById('target');
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: false });
    const video = createVideo();
    let playing = false;
    let timeupdate = false;

    video.addEventListener('playing', isPlaying, true);
    video.addEventListener('timeupdate', isTimeupdate, true);

    function isPlaying () {
        playing = true;
        video.removeEventListener('playing', isPlaying, true);
        check();
    }
    function isTimeupdate () {
        timeupdate = true;
        video.removeEventListener('timeupdate', isTimeupdate, true);
        check();
    }

    function check () {
        if (playing && timeupdate) {
            init(gl, video);
        }
    }
}

function createVideo () {
    const video = document.createElement('video');

    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('preload', 'auto');
    video.setAttribute('crossorigin', 'anonymous');

    document.body.appendChild(video);

    video.src = VIDEOS[0];

    return video;
}

function init (gl, video) {
    const program = compileProgram(gl, 'vertexShader', 'fragmentShader');

    // look up where the vertex data need to go.
    const texCoordLocation = gl.getAttribLocation(program, 'aTexCoord');
    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const texCoordBuffer = gl.createBuffer();
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0,  1.0,
        1.0,  1.0,
        -1.0,  -1.0,
        -1.0,  -1.0,
        1.0,  1.0,
        1.0,  -1.0]), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  0.5,
        0.0,  0.5,
        1.0,  0.0,
        1.0,  0.5]), gl.STATIC_DRAW);

    // Create a texture.
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    // get offset uniform
    const offset = gl.getUniformLocation(program, 'uTexOffset');

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);
    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


    gl.enableVertexAttribArray(texCoordLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // set the offset
    gl.uniform2fv(offset, [0, 0.5]);

    resize(gl.canvas);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    draw(gl, texture, video);
}

function draw (gl, texture, video) {
    window.requestAnimationFrame(draw.bind(null, gl, texture, video));

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function compileProgram (gl, vertexId, fragmentId) {
    const vertexShaderSource = document.getElementById(vertexId).text;
    const fragmentShaderSource = document.getElementById(fragmentId).text;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    return createProgram(gl, vertexShader, fragmentShader);
}

function createShader (gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram (gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);

    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function resize (canvas) {
    const realToCSSPixels = window.devicePixelRatio;

    // Lookup the size the browser is displaying the canvas.
    const displayWidth  = Math.floor(canvas.clientWidth  * realToCSSPixels);
    const displayHeight = Math.floor(canvas.clientHeight  * realToCSSPixels);

    // Check if the canvas is not the same size.
    if (canvas.width  !== displayWidth ||
        canvas.height !== displayHeight) {

        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
}
