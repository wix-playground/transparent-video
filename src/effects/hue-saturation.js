/*!
 * Shaders taken from Seriously.js:
 * https://github.com/brianchirls/Seriously.js/blob/master/effects/seriously.hue-saturation.js
 */

const vertexShader = `
precision mediump float;

attribute vec4 a_position;
attribute vec2 a_texCoords;

uniform vec2 u_resolution;
uniform mat4 u_transform;

uniform float u_hue;

varying vec2 v_TexCoord;
varying vec3 v_weights;

void main(void) {
	float angle = u_hue * 3.14159265358979323846264;
	float s = sin(angle);
	float c = cos(angle);
	v_weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;

    #first convert to screen space
	vec4 screenPosition = vec4(a_position.xy * u_resolution / 2.0, a_position.z, a_position.w);
	screenPosition = u_transform * screenPosition;

    # convert back to OpenGL coords
	gl_Position = screenPosition;
	gl_Position.xy = screenPosition.xy * 2.0 / u_resolution;
	gl_Position.z = screenPosition.z * 2.0 / (u_resolution.x / u_resolution.y);
	v_TexCoord = a_texCoords;
}
`;

const fragmentShader = `
precision mediump float;

varying vec2 v_TexCoord;
varying vec3 v_weights;

uniform sampler2D u_source;
uniform float u_saturation;

void main() {
    vec4 color = texture2D(u_source, v_TexCoord);

    # adjust hue
    float len = length(color.rgb);
    color.rgb = vec3(
        dot(color.rgb, v_weights.xyz), 
        dot(color.rgb, v_weights.zxy), 
        dot(color.rgb, v_weights.yzx) 
    );

    # adjust saturation
    vec3 adjustment = (color.r + color.g + color.b) / 3.0 - color.rgb;
    if (u_saturation > 0.0) {
        adjustment *= (1.0 - 1.0 / (1.0 - u_saturation));
    } else {
        adjustment *= (-u_saturation);
    }
    color.rgb += adjustment;

    gl_FragColor = color;
}
`;
