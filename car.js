var carPosition = 0;
var speed = 0.01;

function InitBuffersVertices(gl, vertices) {
    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return vertex_buffer;
}

function InitBuffersColors(gl, colors) {
    var color_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return color_buffer;
}

function InitShaders(gl) {
    var vertCode = `
        attribute vec3 coordinates;
        attribute vec3 color;
        uniform mat4 uPMatrix;
        uniform mat4 uMVMatrix;
        varying vec3 vColor;
        void main(void) {
            gl_Position = uPMatrix * uMVMatrix * vec4(coordinates, 1.0);
            vColor = color;
        }
    `;
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    var fragCode = `
        precision mediump float;
        varying vec3 vColor;
        void main(void) {
            gl_FragColor = vec4(vColor, 1.0);
        }
    `;
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);
    return shaderProgram;
}

function ShadersBuffers(gl, vertex_buffer, color_buffer, shaderProgram, pMatrix, mvMatrix) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    var coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coord);

    gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
    var color = gl.getAttribLocation(shaderProgram, "color");
    gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(color);

    var proj = gl.getUniformLocation(shaderProgram, "uPMatrix");
    var modelView = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    gl.uniformMatrix4fv(proj, false, pMatrix);
    gl.uniformMatrix4fv(modelView, false, mvMatrix);
}

function CircleVertices(n) {
    var vertices = [0.0, 0.0, 0.0];
    for (var i = 0; i <= n; i++) {
        var angle = 2 * i * Math.PI / n;
        vertices.push(0.1 * Math.cos(angle), 0.1 * Math.sin(angle), 0.0);
    }
    return vertices;
}

function CircleColors(n) {
    var colors = [];
    for (var i = 0; i <= n + 1; i++) {
        colors.push(0.5, 0.5, 0.5);
    }
    return colors;
}

function drawScene(gl, shaderProgram, pMatrix, mvMatrix, vertexBufferCar, colorBufferCar, vertexBufferCircle, colorBufferCircle) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw car body
    mat4.translate(mvMatrix, mvMatrix, [carPosition, 0.0, 0.0]);
    ShadersBuffers(gl, vertexBufferCar, colorBufferCar, shaderProgram, pMatrix, mvMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Draw wheels
    mat4.translate(mvMatrix, mvMatrix, [-0.5, -0.1, 0.0]);
    ShadersBuffers(gl, vertexBufferCircle, colorBufferCircle, shaderProgram, pMatrix, mvMatrix);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 52);

    mat4.translate(mvMatrix, mvMatrix, [1.0, 0.0, 0.0]);
    ShadersBuffers(gl, vertexBufferCircle, colorBufferCircle, shaderProgram, pMatrix, mvMatrix);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 52);
}

function main() {
    var canvas = document.getElementById("glCanvas");
    var gl = canvas.getContext("webgl");

    var verticesCircle = CircleVertices(50);
    var colorsCircle = CircleColors(50);

    var verticesCar = [
        // Car body
        -0.6, -0.1, 0.0,
        0.6, -0.1, 0.0,
        -0.6, 0.1, 0.0,
        0.6, -0.1, 0.0,
        0.6, 0.1, 0.0,
        -0.6, 0.1, 0.0
    ];
    var colorsCar = [
        // Car body color
        0.8, 0.0, 0.0,
        0.8, 0.0, 0.0,
        0.8, 0.0, 0.0,
        0.8, 0.0, 0.0,
        0.8, 0.0, 0.0,
        0.8, 0.0, 0.0
    ];

    var vertexBufferCar = InitBuffersVertices(gl, verticesCar);
    var colorBufferCar = InitBuffersColors(gl, colorsCar);
    var vertexBufferCircle = InitBuffersVertices(gl, verticesCircle);
    var colorBufferCircle = InitBuffersColors(gl, colorsCircle);
    var shaderProgram = InitShaders(gl);

    var pMatrix = mat4.create();
    var mvMatrix = mat4.create();
    mat4.ortho(pMatrix, -1.0, 1.0, -1.0, 1.0, 0.1, 100.0);
    mat4.lookAt(mvMatrix, [0.0, 0.0, 1.0], [0, 0, 0], [0, 1, 0]);

    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    // Draw initial scene
    drawScene(gl, shaderProgram, pMatrix, mvMatrix, vertexBufferCar, colorBufferCar, vertexBufferCircle, colorBufferCircle);

    // Add event listeners for keys "z" and "s"
    window.addEventListener("keydown", function(event) {
        switch(event.key) {
            case "z":
                carPosition += speed;
                break;
            case "s":
                carPosition -= speed;
                break;
        }
        mat4.identity(mvMatrix);
        mat4.ortho(pMatrix, -1.0, 1.0, -1.0, 1.0, 0.1, 100.0);
        mat4.lookAt(mvMatrix, [0.0, 0.0, 1.0], [0, 0, 0], [0, 1, 0]);
        drawScene(gl, shaderProgram, pMatrix, mvMatrix, vertexBufferCar, colorBufferCar, vertexBufferCircle, colorBufferCircle);
    });
}

window.onload = main;
