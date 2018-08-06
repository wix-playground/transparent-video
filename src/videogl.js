const VERTEX_SHADER = `
precision mediump float;

uniform vec2 uTexOffset;

attribute vec2 aTexCoord;
attribute vec2 aPosition;

varying vec2 vTexColorCoord;
varying vec2 vTexAlphaCoord;

void main() {
    vTexColorCoord = aTexCoord;
    vTexAlphaCoord = vTexColorCoord + uTexOffset;

    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

varying vec2 vTexColorCoord;
varying vec2 vTexAlphaCoord;

uniform sampler2D source;

void main() {
    gl_FragColor = vec4(texture2D(source, vTexColorCoord).rgb, texture2D(source, vTexAlphaCoord).r);
}
`;

export default VideoGL;

class VideoGL {
    source (src) {
        if ( typeof src === 'string' ) {
            if (src.startsWith('#')) {
                this._getVideo(src);
            }
            else {
                this._createVideo(src);
            }
        }
        else if ( src instanceof window.HTMLVideoElement) {
            this.video = src;
        }
    }

    target (canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', {
            preserveDrawingBuffer: false, // should improve performance - https://stackoverflow.com/questions/27746091/preservedrawingbuffer-false-is-it-worth-the-effort
            antialias: false, // should improve performance
            premultipliedAlpha: false // eliminates dithering edges in transparent video on Chrome
        });
    }

    resize () {
        const {canvas, gl} = this;
        const realToCSSPixels = 1; //window.devicePixelRatio;

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

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    go () {
        this._init();
        this.resize();

        // start drawing loop
        this.loop();
    }

    loop () {
        window.requestAnimationFrame(() => this.loop());
        this.draw();
    }

    draw () {
        const {gl, texture, video} = this;

        gl.bindTexture(gl.TEXTURE_2D, texture);
        // tell webgl we're reading premultiplied data
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    _init () {
        const gl = this.gl;

        this._compileProgram();

        const program = this.program;

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
        // tell webgl we're reading premultiplied data
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video);

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

        this.texture = texture;
    }

    _getVideo (src) {
        this.video = document.querySelector(src);
    }

    _createVideo (src) {
        const video = document.createElement('video');

        video.setAttribute('muted', '');
        video.setAttribute('loop', '');
        video.setAttribute('preload', 'auto');
        video.setAttribute('crossorigin', 'anonymous');

        document.body.appendChild(video);

        video.src = src;

        this.video = video;
    }

    _compileProgram () {
        const gl = this.gl;
        this.vertexShader = this._createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
        this.fragmentShader = this._createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

        this._createProgram();
    }

    _createProgram () {
        const {gl, vertexShader, fragmentShader} = this;
        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        const success = gl.getProgramParameter(program, gl.LINK_STATUS);

        if (success) {
            this.program = program;
        }
        else {
            console.log(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
        }
    }

    _createShader (type, source) {
        const gl = this.gl;
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
}
