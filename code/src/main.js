/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
/**
 * our shader program
 * @type {WebGLProgram}
 */

// The OpenGL context
var gl = null,
program = null;

// Scenegraph root nodes
var root = null;
var rotateNode;

// Camera
var camera = null;
var cameraPos = vec3.create();
var cameraCenter = vec3.create();

// Textures
var renderTargetColorTexture;
var renderTargetDepthTexture;
var worldTexture;
var framebufferHeight = 512; 
var framebufferWidth = 512;

// Time in last render step
var previousTime = 0;
var elapsedTime = 0;

// Load the shader resources using a utility function
loadResources({
  vs_simple: './src/shader/simple.vs.glsl',
  fs_simple: './src/shader/simple.fs.glsl',
  vs_single: './src/shader/single.vs.glsl',
  fs_single: './src/shader/single.fs.glsl',
  vs_phong: './src/shader/phong.vs.glsl',
  fs_phong: './src/shader/phong.fs.glsl',
  vs_texture: './src/shader/texture.vs.glsl',
  fs_texture: './src/shader/texture.fs.glsl',
  vs_shadow: './src/shader/shadow.vs.glsl',
  fs_shadow: './src/shader/shadow.fs.glsl',
  vs_envmap: './src/shader/envmap.vs.glsl',
  fs_envmap: './src/shader/envmap.fs.glsl',
  alien: './src/models/alien/alien.obj',
  spaceship: './src/models/spaceship/E 45 Aircraft_obj.obj',
  worldTexture: './src/models/world/world5400x2700.jpg',
}).then(function (resources) {
  init(resources);
  render(0);
});

// Initializes OpenGL context, compile shader, and load buffers
function init(resources) {
  // Create a GL context
  gl = createContext();

  // Init textures
  initTextures(resources);
  initRenderToTexture();

  // Enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  // TODO create your own scenegraph
  root = createSceneGraph(gl, resources);

  // Setup camera
  cameraStartPos = vec3.fromValues(0, 0, 0);
  camera = new UserControlledCamera(gl.canvas, cameraStartPos);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'c') {
      camera.control.enabled = !camera.control.enabled; // Toggle camera control
    }
  });
}

function createSceneGraph(gl, resources) {
  // Create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs_texture, resources.fs_texture))

  // Create node with different shaders
  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
      new RenderSGNode(makeSphere(.2, 10, 10))
    ]);
  }

  // Create sun node
  let sun = new LightSGNode();
  sun.ambient = [0.2, 0.2, 0.2, 1];
  sun.diffuse = [1.0, 0.7, 0.0, 1];
  sun.specular = [1.0, 0.7, 0.0, 1];
  sun.append(createLightSphere(resources));

  // Add sun to scenegraph
  root.append(new TransformationSGNode(glm.transform({ translate: [120, -75, -400], scale: 150}), [sun]));

  // Create spaceship
  let spaceship = new MaterialSGNode([new RenderSGNode(resources.spaceship)]);
  spaceship.ambient = [0.2, 0, 0, 1],
  spaceship.diffuse = [0.8, 0, 0, 1],
  spaceship.specular = [1, 1, 1, 1],
  spaceship.shininess = 10

  // Create spaceship light
  let spaceshipLight = new SpotLightSGNode();
  spaceshipLight.ambient = [0.2, 0.2, 0.2, 1];
  spaceshipLight.diffuse = [2.0, 2.0, 2.0, 1.0];
  spaceshipLight.specular = [2.0, 2.0, 2.0, 1.0];
  spaceshipLight.append(createLightSphere());
  
  // Create transformation nodes for spaceship and light
  let spaceshipTransform = new TransformationSGNode(mat4.create(), [spaceship]);
  let lightTransform = new TransformationSGNode(glm.transform({ translate: [0, 0, -2.8] }), [spaceshipLight]);

  // Create rotation node for spaceship and bind light to it
  rotateNode = new TransformationSGNode(mat4.create(), [
    new TransformationSGNode(glm.translate(0, 0, 0), [spaceshipTransform]),
    lightTransform
  ]);

  // Create world
  let world = new MaterialSGNode(
                new TextureSGNode(renderTargetColorTexture,2,
                new RenderSGNode(makeWorld(200,200))
                ));
  world.ambient = [0.1, 0.2, 0.0, 1.0]; 
  world.diffuse = [0.5, 1.0, 0.5, 1.0];
  world.specular = [0.5, 0.5, 0.5, 1.0];
  world.shininess = 5;

  root.append(new TransformationSGNode(glm.transform({ translate: [0, -210, 0], rotateX: -90, scale: 3}), [world]));

  root.append(rotateNode);

  return root;
}

function initTextures(resources)
{
  // Create texture object
  worldTexture = gl.createTexture();
  // Select a texture unit
  gl.activeTexture(gl.TEXTURE0);
  // Bind texture to active texture unit
  gl.bindTexture(gl.TEXTURE_2D, worldTexture);
  // Set sampling parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    resources.worldTexture);

  // Clean up/unbind texture
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function initRenderToTexture() {
  // General setup
  gl.activeTexture(gl.TEXTURE0);

  // Create framebuffer
  renderTargetFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, renderTargetFramebuffer);
  renderTargetColorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, renderTargetColorTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D,
    0,
    gl.RGBA,
    framebufferWidth,
    framebufferHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null);

  // Create depth texture
  renderTargetDepthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, renderTargetDepthTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, framebufferWidth, framebufferHeight, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);

  // Attach textures to framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTargetColorTexture, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, renderTargetDepthTexture, 0);

  // Check if framebuffer was created successfully
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!=gl.FRAMEBUFFER_COMPLETE)
    {alert('Framebuffer incomplete!');}

  // Clean up
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function renderToTexture(timeInMilliseconds)
{
  gl.bindFramebuffer(gl.FRAMEBUFFER, renderTargetFramebuffer);

  // Setup viewport
  gl.viewport(0, 0, framebufferWidth, framebufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Setup context and camera matrices
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), framebufferWidth / framebufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]);
  context.timeInMilliseconds = timeInMilliseconds;

  // Disable framebuffer (to render to screen again)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// Render a frame
function render(timeInMilliseconds) {
  // Check for resize of browser window and adjust canvas sizes
  checkForWindowResize(gl);
  // RenderToTexture(timeInMilliseconds);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  // Set the background color to dark blue
  gl.clearColor(0.0, 0.0, 0.2, 1.0);

  // Clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create projection Matrix and context for rendering.
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0, 1, -10], [0, 0, 0], [0, 1, 0]);

  var deltaTime = timeInMilliseconds - previousTime;
  previousTime = timeInMilliseconds;
  elapsedTime += deltaTime;

  if (elapsedTime >= 30000) {
    camera.control.enabled = true;
  }

  // Spaceship animation
  let initialSpeed, decreaseRate;

  initialSpeed = 0.04; // Adjust the initial speed as needed
  decreaseRate = 0.002; // Adjust the rate at which the speed decreases

  if (elapsedTime < 18000) {
    // Move rotateNode (spaceship) forward on x-axis
    const elapsedSeconds = elapsedTime / 1000; // Convert elapsed time to seconds
    const translationSpeed = initialSpeed - (decreaseRate * elapsedSeconds); // Calculate the adjusted speed
    const translationMatrix = mat4.translate(mat4.create(), mat4.create(), [0, 0, -translationSpeed * deltaTime]);
    mat4.multiply(rotateNode.matrix, rotateNode.matrix, translationMatrix);
  }
  
  if (elapsedTime >= 9000 && elapsedTime < 14500) {
    // Rotate rotateNode (spaceship) 90 degrees on z-axis slowly
    const rotationSpeed = glm.deg2rad(0.0075); // Adjust the speed as needed
    const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), -rotationSpeed * deltaTime);
    mat4.multiply(rotateNode.matrix, rotateNode.matrix, rotationMatrix);
  }
  
  if (elapsedTime >= 14500 && elapsedTime < 18000) {
    // Rotate rotateNode (spaceship) 90 degrees on z-axis slowly
    const rotationSpeed = glm.deg2rad(0.0075); // Adjust the speed as needed
    const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
    mat4.multiply(rotateNode.matrix, rotateNode.matrix, rotationMatrix);
  }

  if (elapsedTime >= 18500 && elapsedTime < 26500) {
    // Rotate rotateNode (spaceship) 90 degrees on z-axis slowly
    const rotationSpeed = glm.deg2rad(0.013); // Adjust the speed as needed
    const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
    mat4.multiply(rotateNode.matrix, rotateNode.matrix, rotationMatrix);
  }  

  initialSpeed1 = 0.001; // Adjust the initial speed as needed
  decreaseRate1 = 0.001; // Adjust the rate at which the speed decreases

  if (elapsedTime >= 28500 && elapsedTime < 34000) {
    // Move rotateNode (spaceship) down on y-axis
    const elapsedSeconds = elapsedTime / 1000; // Convert elapsed time to seconds
    const translationSpeed = initialSpeed1 - (decreaseRate1 * elapsedSeconds); // Calculate the adjusted speed
    const translationMatrix = mat4.translate(mat4.create(), mat4.create(), [0, 0, -translationSpeed * deltaTime]);
    mat4.multiply(rotateNode.matrix, rotateNode.matrix, translationMatrix);
  }

  // Move and apply camera
  camera.update(deltaTime);
  camera.render(context);

  // Render scene
  root.render(context);

  // Request another call as soon as possible
  requestAnimationFrame(render);
}

function makeWorld(width, height) {
  var world = makeRect(width, height);
  world.texture = [0, 0,   width, 0,   width, height,   0, height];
  return world;
}

// Classes
class SpotLightSGNode extends LightSGNode {
  constructor() {
    super();
    this.position = [0, 0, 0];
    this.direction = [0, -1, -1];
    this.angle = 30; // Spotlight angle in degrees
  }
}

class TextureSGNode extends SGNode {
  constructor(texture, textureunit, children ) {
      super(children);
      this.texture = texture;
      this.textureunit = textureunit;
  }
  render(context)
  {
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_enableObjectTexture'), 1);
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_tex'), this.textureunit);
    gl.uniform1f(gl.getUniformLocation(context.shader, 'u_wobbleTime'), context.timeInMilliseconds);
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    super.render(context);
    gl.activeTexture(gl.TEXTURE0 + this.textureunit);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.uniform1i(gl.getUniformLocation(context.shader, 'u_enableObjectTexture'), 0);
  }
}