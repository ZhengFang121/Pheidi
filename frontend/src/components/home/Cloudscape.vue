<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
const isWebGlReady = ref(false)

let animationFrameId = 0
let lastFrameTime = 0
let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let vertexBuffer: WebGLBuffer | null = null
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let reduceMotionQuery: MediaQueryList | null = null
let isInViewport = true

const vertexShaderSource = `
  attribute vec2 aPosition;

  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`

const fragmentShaderSource = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyBottom;
  uniform vec3 uCloud;
  uniform vec3 uGlow;

  float random(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);

    float a = random(cell);
    float b = random(cell + vec2(1.0, 0.0));
    float c = random(cell + vec2(0.0, 1.0));
    float d = random(cell + vec2(1.0, 1.0));

    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.5;

    for (int octave = 0; octave < 5; octave++) {
      value += amplitude * noise(point);
      point = point * 2.03 + vec2(17.1, 9.2);
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 field = uv;
    field.x *= uResolution.x / max(uResolution.y, 1.0);

    vec3 sky = mix(uSkyBottom, uSkyTop, smoothstep(0.0, 1.0, uv.y));
    float glow = 1.0 - smoothstep(0.02, 0.48, distance(uv, vec2(0.76, 0.72)));
    sky = mix(sky, uGlow, glow * 0.34);

    vec2 drift = vec2(uTime * 0.018, -uTime * 0.003);
    float broadCloud = fbm(field * vec2(1.25, 2.1) + drift + vec2(0.0, 1.1));
    float fineCloud = fbm(field * vec2(3.35, 4.8) - drift * 0.45 + vec2(4.7, 0.3));
    float cloudBand = smoothstep(0.05, 0.28, uv.y) * (1.0 - smoothstep(0.82, 1.0, uv.y));
    float cloudField = broadCloud * 0.8 + fineCloud * 0.32;
    float cloudEdge = smoothstep(0.5, 0.64, cloudField) * cloudBand;
    float cloudBody = smoothstep(0.58, 0.7, cloudField + fineCloud * 0.04) * cloudBand;
    float haze = smoothstep(0.38, 0.7, broadCloud) * (1.0 - uv.y) * 0.1;

    vec3 cloudShade = mix(uSkyTop, uCloud, 0.48);
    vec3 color = mix(sky, cloudShade, cloudEdge * 0.62 + haze);
    color = mix(color, uCloud, cloudBody * 0.72);
    gl_FragColor = vec4(color, 1.0);
  }
`

function parseHexColor(value: string): [number, number, number] {
  const hex = value.trim().replace('#', '')
  const normalized = hex.length === 3 ? hex.replace(/(.)/g, '$1$1') : hex
  const parsed = Number.parseInt(normalized, 16)

  if (!Number.isFinite(parsed) || normalized.length !== 6) {
    return [1, 1, 1]
  }

  return [((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255]
}

function createShader(context: WebGLRenderingContext, type: number, source: string) {
  const shader = context.createShader(type)

  if (!shader) return null

  context.shaderSource(shader, source)
  context.compileShader(shader)

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    console.warn('Cloudscape shader 無法編譯：', context.getShaderInfoLog(shader))
    context.deleteShader(shader)
    return null
  }

  return shader
}

function stopRendering() {
  window.cancelAnimationFrame(animationFrameId)
  animationFrameId = 0
}

function shouldRender() {
  return isInViewport && document.visibilityState === 'visible' && !reduceMotionQuery?.matches
}

function render(time: number) {
  if (!gl || !program || !canvas.value || !shouldRender()) {
    animationFrameId = 0
    return
  }

  animationFrameId = window.requestAnimationFrame(render)

  if (time - lastFrameTime < 1000 / 30) return

  lastFrameTime = time
  gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time / 1000)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function startRendering() {
  if (!animationFrameId && shouldRender()) {
    animationFrameId = window.requestAnimationFrame(render)
  }
}

function resizeCanvas() {
  if (!canvas.value || !gl || !program) return

  const bounds = canvas.value.getBoundingClientRect()
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(bounds.width * pixelRatio))
  const height = Math.max(1, Math.round(bounds.height * pixelRatio))

  if (canvas.value.width !== width || canvas.value.height !== height) {
    canvas.value.width = width
    canvas.value.height = height
  }

  gl.viewport(0, 0, width, height)
  gl.uniform2f(gl.getUniformLocation(program, 'uResolution'), width, height)
}

function initializeWebGl() {
  if (!canvas.value || gl || reduceMotionQuery?.matches) return

  const context = canvas.value.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: 'low-power',
  })

  if (!context) return

  const vertexShader = createShader(context, context.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(context, context.FRAGMENT_SHADER, fragmentShaderSource)

  if (!vertexShader || !fragmentShader) return

  const shaderProgram = context.createProgram()

  if (!shaderProgram) return

  context.attachShader(shaderProgram, vertexShader)
  context.attachShader(shaderProgram, fragmentShader)
  context.linkProgram(shaderProgram)
  context.deleteShader(vertexShader)
  context.deleteShader(fragmentShader)

  if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS)) {
    console.warn('Cloudscape WebGL 程式無法連結：', context.getProgramInfoLog(shaderProgram))
    context.deleteProgram(shaderProgram)
    return
  }

  const buffer = context.createBuffer()

  if (!buffer) return

  gl = context
  program = shaderProgram
  vertexBuffer = buffer

  context.useProgram(shaderProgram)
  context.bindBuffer(context.ARRAY_BUFFER, buffer)
  context.bufferData(
    context.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    context.STATIC_DRAW,
  )

  const positionLocation = context.getAttribLocation(shaderProgram, 'aPosition')
  context.enableVertexAttribArray(positionLocation)
  context.vertexAttribPointer(positionLocation, 2, context.FLOAT, false, 0, 0)

  const styles = window.getComputedStyle(canvas.value)
  const skyTop = parseHexColor(styles.getPropertyValue('--color-primary-light'))
  const skyBottom = parseHexColor(styles.getPropertyValue('--color-primary-pale'))
  const cloudColor = parseHexColor(styles.getPropertyValue('--color-surface'))
  const glowColor = parseHexColor(styles.getPropertyValue('--color-accent-pale'))

  context.uniform3fv(context.getUniformLocation(shaderProgram, 'uSkyTop'), skyTop)
  context.uniform3fv(context.getUniformLocation(shaderProgram, 'uSkyBottom'), skyBottom)
  context.uniform3fv(context.getUniformLocation(shaderProgram, 'uCloud'), cloudColor)
  context.uniform3fv(context.getUniformLocation(shaderProgram, 'uGlow'), glowColor)

  resizeCanvas()
  isWebGlReady.value = true
  startRendering()
}

function disposeWebGl() {
  stopRendering()
  isWebGlReady.value = false

  if (gl && vertexBuffer) gl.deleteBuffer(vertexBuffer)
  if (gl && program) gl.deleteProgram(program)

  vertexBuffer = null
  program = null
  gl = null
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    startRendering()
  } else {
    stopRendering()
  }
}

function handleMotionPreferenceChange() {
  if (reduceMotionQuery?.matches) {
    disposeWebGl()
  } else {
    initializeWebGl()
  }
}

function handleContextLost(event: Event) {
  event.preventDefault()
  disposeWebGl()
}

onMounted(() => {
  if (!canvas.value) return

  reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const isLowPowerDevice = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2

  resizeObserver = new ResizeObserver(resizeCanvas)
  resizeObserver.observe(canvas.value)

  intersectionObserver = new IntersectionObserver(([entry]) => {
    isInViewport = entry?.isIntersecting ?? true

    if (isInViewport) {
      startRendering()
    } else {
      stopRendering()
    }
  })
  intersectionObserver.observe(canvas.value)

  reduceMotionQuery.addEventListener('change', handleMotionPreferenceChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  canvas.value.addEventListener('webglcontextlost', handleContextLost)

  if (!isLowPowerDevice) initializeWebGl()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  reduceMotionQuery?.removeEventListener('change', handleMotionPreferenceChange)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  canvas.value?.removeEventListener('webglcontextlost', handleContextLost)
  disposeWebGl()
})
</script>

<template>
  <div class="cloudscape" aria-hidden="true">
    <div class="cloudscape__fallback" />
    <canvas ref="canvas" class="cloudscape__canvas" :class="{ 'is-ready': isWebGlReady }" />
  </div>
</template>

<style scoped>
.cloudscape,
.cloudscape__fallback,
.cloudscape__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cloudscape {
  overflow: hidden;
  background-color: var(--color-primary-pale);
}

.cloudscape__fallback {
  background:
    radial-gradient(circle at 76% 28%, var(--color-accent-pale) 0, transparent 34%),
    linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-primary-pale) 72%);
}

.cloudscape__canvas {
  display: block;
  opacity: 0;
  transition: opacity 500ms ease;
}

.cloudscape__canvas.is-ready {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .cloudscape__canvas {
    display: none;
  }
}
</style>
