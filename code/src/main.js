//the OpenGL context
var gl = null,
  program = null;


//Camera
var camera = null;
var cameraPos = vec3.create();
var cameraCenter = vec3.create();
var cameraAnimation = null;

// scenegraph root node
var root = null;
var rootnoworld = null;
var rotateNode;
// time in last render step
var previousTime = 0;
var scene2Initiated = false;
var scene3Initiated = false;
var planet;
var planetNode;
var context;
var particleSystem;
var _resources;
var particleTexture;
var particleSystemNode;
var renderTargetColorTexture;
var fireTexture;
var particleSystem;
var spaceshipSpotLight;
var planet;
var sun;
var landingInitiated = false;
var deltaTime;
var previousTime = 0;
var elapsedTime = 0;
var rotateSpaceship, rotateSun, rotatespotlight, rotateLight, rotatePlanet, guardRotation;
var spaceship, sun, spaceshipSpotLight, spaceshipLight, planet, spaceshipGuard; 
//load the shader resources using a utility function
loadResources({
  particleTexture: './src/models/flame.png',
  vs_particle: './src/shader/particle.vs.glsl',
  fs_particle: './src/shader/particle.fs.glsl',
  vs: './src/shader/texture.vs.glsl',
  fs: './src/shader/texture.fs.glsl',
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
}).then(function (resources /*an object containing our keys with the loaded resources*/) {
  init(resources);

  render(0);
});

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {
  //create a GL context
  gl = createContext();

  context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 1, 0]);
  _resources = resources;
  //setup camera
  cameraStartPos = vec3.fromValues(0, 1, -50);
  camera = new UserControlledCamera(gl.canvas, cameraStartPos);

  //setup an animation for the camera, moving it into position
  cameraAnimation = new Animation(camera,
            [{matrix: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 1, -10)), duration: 5000}],
            false);
  //TODO create your own scenegraph

  root = createSceneGraph(gl, resources);
  _resources = resources;
  tiltSpaceship(0, -90)
  //create scenegraph without world and simple shader
  rootnoworld = new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single));
  rootnoworld.append(rotateNode); //reuse model part
}

// render a frame
function render(timeInMilliseconds) {
  // check for resize of browser window and adjust canvas sizes
  checkForWindowResize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  gl.clearColor(0.0, 0.0, 0.2, 1.0);

  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  var deltaTime = timeInMilliseconds - previousTime;

  //update animation BEFORE camera
  // cameraAnimation.update(deltaTime);
  
  if (timeInMilliseconds < 15000) { 
    updateCameraPositionByTime(timeInMilliseconds, deltaTime, context);
    previousTime = timeInMilliseconds;
  } else {
    if (!landingInitiated) {
      root.remove(planetNode);
      root.remove(rotateNode);
      // planetNode.visible = false;
      landingInitiated = true;;
      initiateLanding();
      // root.append(sun);
      // const nodeToRemove = root.children.findNode(node => node.name === 'spaceship');
      // root.remove(nodeToRemove);
      // landingInitiated = true;
    }
    renderLanding(timeInMilliseconds);
    previousTime = timeInMilliseconds;
  }
  // particleSystem.update(deltaTime);
  // particleSystem.render(context);
  // updateParticles(deltaTime, context);

  //At the end of the automatic flight, switch to manual control
  if(!cameraAnimation.running && !camera.control.enabled) {
    camera.control.enabled = true;
  }

  //TODO use your own scene for rendering

  //Apply camera
  camera.update(deltaTime);
  camera.render(context);

  //Render scene
  root.render(context);

  //request another call as soon as possible
  requestAnimationFrame(render);
}

function initiateLanding() {
  // Create spaceship spotlight

  // Create node with different shaders
  function createLightSphere() {
    return new ShaderSGNode(createProgram(gl, _resources.vs_single, _resources.fs_single), [
      new RenderSGNode(makeSphere(.2, 10, 10))
    ]);
  }

  // Create spaceship spotlight
  spaceshipSpotLight = new SpotLightSGNode();
  spaceshipSpotLight.ambient = [1.0, 1.0, 1.0, 1.0];
  spaceshipSpotLight.diffuse = [1.0, 1.0, 1.0, 1.0];
  spaceshipSpotLight.specular = [1.0, 1.0, 1.0, 1.0];
  spaceshipSpotLight.append(createLightSphere());
  rotatespotlight = new TransformationSGNode(glm.transform({ translate: [0, 0, -2.8] }), [spaceshipSpotLight]);

  // Create spaceship light
  spaceshipLight = new LightSGNode();
  spaceshipLight.ambient = [0, 0, 0, 1];
  spaceshipLight.diffuse = [1, 1, 1, 1];
  spaceshipLight.specular = [1, 1, 1, 1];
  spaceshipLight.position = [0, 3, 0];
  spaceshipLight.append(createLightSphere());
  rotateLight = new TransformationSGNode(glm.transform({ translate: [0, 0, 0] }), [spaceshipLight]);

  // Create spaceship guard
  spaceshipGuard = new MaterialSGNode([new RenderSGNode(makeSphere(.2, 10, 10))]);
  spaceshipGuard.ambient = [0, 0, 0.7, 0.7];
  spaceshipGuard.diffuse = [0, 0, 0.8, 1];
  spaceshipGuard.specular = [0, 0, 0.7, 0.7];
  spaceshipGuard.position = [0, -3, 0];
  spaceshipGuard.shininess = 10;
  guardRotation = new TransformationSGNode(glm.transform({ translate: [0, -3, 0] }), [spaceshipGuard]);

  // Create spaceship
  spaceship = new MaterialSGNode([new RenderSGNode(_resources.spaceship)]);
  spaceship.ambient = [0.7, 0, 0, 0.7];
  spaceship.diffuse = [0.8, 0, 0, 1];
  spaceship.specular = [0.7, 0, 0, 0.7];
  spaceship.shininess = 5;

  // Create rotation node for spaceship and bind lights to it
  rotateSpaceship = new TransformationSGNode(mat4.create(), [
    new TransformationSGNode(glm.translate(0, 0, 0), [spaceship]),
    rotatespotlight,
    rotateLight, 
    guardRotation
  ]);

  root.append(rotateSpaceship);

  // Create planet
  planet = new MaterialSGNode([new RenderSGNode(makePlanet(200,200))]);
  planet.ambient = [0.1, 0.2, 0.0, 1.0];
  planet.diffuse = [0.5, 1.0, 0.5, 1.0];
  planet.specular = [0.5, 0.5, 0.5, 1.0];
  planet.shininess = 5;
  rotatePlanet = new TransformationSGNode(glm.transform({ translate: [0, -216, 0], rotateX: -90, scale: 20}), [planet]);
  root.append(rotatePlanet);

  // Create sun node
  sun = new LightSGNode();
  sun.ambient = [0.5, 0.5, 0.5, 1.0];
  sun.diffuse = [1.0, 1.0, 1.0, 1.0];
  sun.specular = [1.0, 1.0, 1.0, 1.0];
  sun.emission = [0.3, 0.2, 0.1, 1];
  sun.append(createLightSphere());
  rotateSun = new TransformationSGNode(glm.transform({ translate: [90, 100, -300], scale: 100}), [sun]);
  root.append(rotateSun);
}

function renderLanding(timeInMilliseconds) {
  // context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 2000);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]);

  var deltaTime = timeInMilliseconds - previousTime;
  previousTime = timeInMilliseconds;
  elapsedTime = timeInMilliseconds;

  camera.control.enabled = true;

  // Spacelight animation
  if (elapsedTime < 30000) {
    const rotationSpeed = glm.deg2rad(0.1);
    const rotationMatrix = mat4.rotateZ(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
    mat4.multiply(rotateLight.matrix, rotationMatrix, rotateLight.matrix);
  }

  // Guardian animation
  if (elapsedTime < 30000) {
    const rotationSpeed = glm.deg2rad(0.1);
    const rotationMatrix = mat4.rotateZ(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
    mat4.multiply(guardRotation.matrix, rotationMatrix, guardRotation.matrix);
  }

  // Spaceship animation
  let initialSpeed, decreaseRate;

  initialSpeed = 0.04; // Adjust the initial speed as needed
  decreaseRate = 0.002; // Adjust the rate at which the speed decreases

  if (elapsedTime < 14000) {
    // Move rotateSpaceship (spaceship) forward on x-axis
    const elapsedSeconds = elapsedTime / 1000; // Convert elapsed time to seconds
    const translationSpeed = initialSpeed - (decreaseRate * elapsedSeconds); // Calculate the adjusted speed
    const translationMatrix = mat4.translate(mat4.create(), mat4.create(), [0, 0, -translationSpeed * deltaTime]);
    mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, translationMatrix);
  }
  
  if (elapsedTime >= 5000 && elapsedTime < 10500) {
    // Rotate rotateSpaceship (spaceship) 90 degrees on z-axis slowly
    const rotationSpeed = glm.deg2rad(0.0075); // Adjust the speed as needed
    const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), -rotationSpeed * deltaTime);
    mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, rotationMatrix);
  }
  
  if (elapsedTime >= 10500 && elapsedTime < 14000) {
    // Rotate rotateSpaceship (spaceship) 90 degrees on z-axis slowly
    const rotationSpeed = glm.deg2rad(0.0075); // Adjust the speed as needed
    const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
    mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, rotationMatrix);
  }

  if (elapsedTime >= 14500 && elapsedTime < 22500) {
    // Rotate rotateSpaceship (spaceship) 90 degrees on z-axis slowly
    const rotationSpeed = glm.deg2rad(0.013); // Adjust the speed as needed
    const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
    mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, rotationMatrix);
  }

  initialSpeed1 = 0.001; // Adjust the initial speed as needed
  decreaseRate1 = 0.001; // Adjust the rate at which the speed decreases

  if (elapsedTime >= 24500 && elapsedTime < 30000) {
    // Move rotateSpaceship (spaceship) down on y-axis
    const elapsedSeconds = elapsedTime / 1000; // Convert elapsed time to seconds
    const translationSpeed = initialSpeed1 - (decreaseRate1 * elapsedSeconds); // Calculate the adjusted speed
    const translationMatrix = mat4.translate(mat4.create(), mat4.create(), [0, 0, -translationSpeed * deltaTime]);
    mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, translationMatrix);
  }
  
  if(elapsedTime < 8000)
  {
    camera.control.position = vec3.fromValues(rotateSpaceship.matrix[12], rotateSpaceship.matrix[13] + 10, rotateSpaceship.matrix[14] - 75);
  }

  if(elapsedTime >= 8000 && elapsedTime < 22500)
  {
    camera.control.position = vec3.fromValues(rotateSpaceship.matrix[12] - 15, rotateSpaceship.matrix[13], rotateSpaceship.matrix[14] - 60);
  }

  if(elapsedTime >= 24500 && elapsedTime < 30000)
  {
    camera.control.position = vec3.fromValues(rotateSpaceship.matrix[12], rotateSpaceship.matrix[13], rotateSpaceship.matrix[14] - 15);
  }
}

function updateCameraPositionByTime(elapsedTime, deltaTime, context) {
  let spaceshipPosition = vec3.fromValues(rotateNode.matrix[12], rotateNode.matrix[13], rotateNode.matrix[14]);
  let planetCenter = vec3.fromValues(planetNode.matrix[12], planetNode.matrix[13], planetNode.matrix[14]);

  if (elapsedTime >= 0 && elapsedTime < 5000) {
    moveSpaceShipTowardsPlanet(planetNode.matrix, 0.01, rotateNode.matrix)
  } else if (elapsedTime >= 5000 && elapsedTime < 10000) {
    moveSpaceShipTowardsPlanet(planetNode.matrix, 0.1/2, rotateNode.matrix)
  } else if (elapsedTime >= 10000 && elapsedTime < 15000) {
    moveSpaceShipTowardsPlanet(planetNode.matrix, 0.01, rotateNode.matrix)
  }

  if (elapsedTime >= 5000 && elapsedTime < 10000) {
    let dir = vec3.create();
    vec3.subtract(dir, planetCenter, spaceshipPosition);
    vec3.normalize(dir, dir);
    let distance = -5; // Adjust the distance as needed

    // Calculate the camera's new position
    let cameraNewPosition = vec3.create();
    vec3.scaleAndAdd(cameraNewPosition, spaceshipPosition, dir, distance);

    // Update the camera's position
    camera.control.position = cameraNewPosition;

    context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(60), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
    context.viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 1, 0]);

    if (!scene2Initiated) {
      tiltSpaceship(0, -70);
      scene2Initiated = true;
    }
  } else if (elapsedTime >= 10000 && elapsedTime < 15000) {
    if (!scene3Initiated) {
      tiltSpaceship(0, 90);
      scene3Initiated = true;
    }
    camera.control.position = vec3.fromValues(0, 1, -30);
    context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
    context.viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 1, 0]);
  } else if (elapsedTime >= 15000 && elapsedTime < 25000) {
    // Create a scene for landing spaceship
  }
}

function createSceneGraph(gl, resources) {
  //create scenegraph
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs))

  // create node with different shaders
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

  // create spaceship
  let spaceship = new MaterialSGNode([new RenderSGNode(resources.spaceship)]);
  spaceship.matrix = mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(1, 1, 1));

  spaceshipTransform = new TransformationSGNode(mat4.create(), [spaceship]);

  // Create spaceship spotlight
  spaceshipSpotLight = new SpotLightSGNode();
  lightTransform = new TransformationSGNode(glm.transform({ translate: [0, 0, -2.8] }), [spaceshipSpotLight]);

  // Create rotation node for spaceship and bind lights to it
  rotateNode = new TransformationSGNode(mat4.create(), [
    new TransformationSGNode(glm.translate(0, 0, 0), [spaceshipTransform]),
    lightTransform,
    // rotateLight
  ]);

  rotateNode.matrix = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(-10, 0, 10));
  // rotateNode.matrix = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(-10, 0, 10));
  rotateNode.matrix = mat4.scale(rotateNode.matrix, rotateNode.matrix, vec3.fromValues(0.2, 0.2, 0.2));

  // add spaceship to scenegraph
  root.append(rotateNode);

  planet = new MaterialSGNode([new RenderSGNode(makeSphere(5, 50, 50))]);
  planetNode = new TransformationSGNode(glm.transform({ translate: [20, 0, 50], scale: 1 }), [planet]);
  root.append(planetNode);

  // Scene after 15sec
  planet = new MaterialSGNode([new RenderSGNode(makePlanet(200,200))]);
  planet.ambient = [0.1, 0.2, 0.0, 1.0];
  planet.diffuse = [0.5, 1.0, 0.5, 1.0];
  planet.specular = [0.5, 0.5, 0.5, 1.0];
  planet.shininess = 5;
  rotatePlanet = new TransformationSGNode(glm.transform({ translate: [0, -216, 0], rotateX: -90, scale: 20}), [planet]);
  // root.append(rotatePlanet);

  // Create sun node
  sun = new LightSGNode();
  sun.ambient = [0.5, 0.5, 0.5, 1.0];
  sun.diffuse = [1.0, 1.0, 1.0, 1.0];
  sun.specular = [1.0, 1.0, 1.0, 1.0];
  sun.emission = [0.3, 0.2, 0.1, 1];
  sun.append(createLightSphere());
  rotateSun = new TransformationSGNode(glm.transform({ translate: [90, 100, -300], scale: 100}), [sun]);
  // root.append(rotateSun);

  return root;
}

function tiltSpaceship(xAngle, yAngle) {
  let currentMatrix = rotateNode.matrix;
  mat4.rotateY(currentMatrix, currentMatrix, glm.deg2rad(yAngle));
  mat4.rotateX(currentMatrix, currentMatrix, glm.deg2rad(xAngle));
  rotateNode.matrix = currentMatrix;
}

function moveSpaceShipTowardsPlanet(planetTransform, velocity, spaceshipTransform){
  let currentMatrix = rotateNode.matrix;
  let spaceshipPosition = vec3.fromValues(spaceshipTransform[12], spaceshipTransform[13], spaceshipTransform[14])
  let planetPosition = vec3.fromValues(planetTransform[12], planetTransform[13], planetTransform[14]); // Move along the negative x-axis
  let direction = vec3.subtract(vec3.create(), planetPosition, spaceshipPosition);
  vec3.normalize(direction, direction)

  let new_position = vec3.scaleAndAdd(vec3.create(), spaceshipPosition, direction,  velocity);

  rotateNode.matrix[12] = new_position[0];
  rotateNode.matrix[13] = new_position[1];
  rotateNode.matrix[14] = new_position[2];
}

function loadImageAndCreateTextureInfo(url) {
  const texture = gl.createTexture();
  const image = new Image();

  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };

  image.onerror = function() {
    console.error('Error loading image:', url);
  };

  image.src = url;

  return texture;
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
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebufferWidth, framebufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  // Create depth texture
  renderTargetDepthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, renderTargetDepthTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), framebufferWidth / framebufferHeight, 0.01, 2000);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]);
  shadowNode.lightViewProjectionMatrix = mat4.multiply(mat4.create(),context.projectionMatrix,context.viewMatrix);

  // Render scenegraph
  rootnofloor.render(context);

  // Disable framebuffer (to render to screen again)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function makePlanet(width, height) {
  var planet = makeRect(width, height);
  planet.texture = [0, 0,   width, 0,   width, height,   0, height];
  return planet;
}

class SpotLightSGNode extends LightSGNode {
  constructor() {
    super();
    this.position = [0, 0, 0];
    this.direction = [0, 0, -1];
    this.angle = 10;
    this.cutoff = 30;
    this.exponent = 10;
  }
}

/**
 * the OpenGL context
 * @type {WebGLRenderingContext}
 */
/**
 * our shader program
 * @type {WebGLProgram}
 */

// The OpenGL context
// var gl = null;

// // Scenegraph root nodes
// var root = null;
// var spaceship, sun, spaceshipSpotLight, spaceshipLight, planet, spaceshipGuard; 
// var rotateSpaceship, rotateSun, rotatespotlight, rotateLight, rotatePlanet, guardRotation;

// // Camera
// var camera = null;
// var cameraPos = vec3.create();
// var cameraCenter = vec3.create();
// var scene2Initiated, scene3Initiated = false;

// // Time in last render step
// var previousTime = 0;
// var elapsedTime = 0;
// var context;
// // Load the shader resources using a utility function
// loadResources({
//   vs_single: './src/shader/single.vs.glsl',
//   fs_single: './src/shader/single.fs.glsl',
//   vs_texture: './src/shader/texture.vs.glsl',
//   fs_texture: './src/shader/texture.fs.glsl',
//   spaceshipObj: './src/models/spaceship/E 45 Aircraft_obj.obj',
//   // planetTexture: './src/models/planet/planet_giant.jpg',
// }).then(function (resources) {
//   init(resources);
//   render(0);
// });

// // Initializes OpenGL context, compile shader, and load buffers
// function init(resources) {
//   // Create a GL context
//   gl = createContext();

//   // Setup camera
//   cameraStartPos = vec3.fromValues(0, 0, 0);
//   camera = new UserControlledCamera(gl.canvas, cameraStartPos);
//   // document.addEventListener('keydown', function (event) {
//   //   if (event.key === 'c') {
//   //     camera.control.enabled = !camera.control.enabled; // Toggle camera control
//   //   }
//   // });

//   context = createSGContext(gl);
//   context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
//   context.viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 1, 0]);

//   // Enable depth test to let objects in front occluse objects further away
//   gl.enable(gl.DEPTH_TEST);

//   // Create scenegraph
//   root = createSceneGraph(gl, resources);
// }

// function createSceneGraph(gl, resources) {
//   // Create scenegraph
//   const root = new ShaderSGNode(createProgram(gl, resources.vs_texture, resources.fs_texture))

//   // Create node with different shaders
//   function createLightSphere() {
//     return new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single), [
//       new RenderSGNode(makeSphere(.2, 10, 10))
//     ]);
//   }

//   // Create spaceship spotlight
//   spaceshipSpotLight = new SpotLightSGNode();
//   spaceshipSpotLight.ambient = [1.0, 1.0, 1.0, 1.0];
//   spaceshipSpotLight.diffuse = [1.0, 1.0, 1.0, 1.0];
//   spaceshipSpotLight.specular = [1.0, 1.0, 1.0, 1.0];
//   spaceshipSpotLight.append(createLightSphere());
//   rotatespotlight = new TransformationSGNode(glm.transform({ translate: [0, 0, -2.8] }), [spaceshipSpotLight]);

//   // Create spaceship light
//   spaceshipLight = new LightSGNode();
//   spaceshipLight.ambient = [0, 0, 0, 1];
//   spaceshipLight.diffuse = [1, 1, 1, 1];
//   spaceshipLight.specular = [1, 1, 1, 1];
//   // spaceshipLight.position = [0, 3, 0];
//   spaceshipLight.append(createLightSphere());
//   rotateLight = new TransformationSGNode(glm.transform({ translate: [0, 0, 0] }), [spaceshipLight]);

//   // Create spaceship guard
//   spaceshipGuard = new MaterialSGNode([new RenderSGNode(makeSphere(.2, 10, 10))]);
//   spaceshipGuard.ambient = [0, 0, 0.7, 0.7];
//   spaceshipGuard.diffuse = [0, 0, 0.8, 1];
//   spaceshipGuard.specular = [0, 0, 0.7, 0.7];
//   spaceshipGuard.position = [0, -3, 0];
//   spaceshipGuard.shininess = 10;
//   guardRotation = new TransformationSGNode(glm.transform({ translate: [0, -3, 0] }), [spaceshipGuard]);

//   // Create spaceship
//   spaceship = new MaterialSGNode([new RenderSGNode(resources.spaceshipObj)]);
//   spaceship.matrix = mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(1, 1, 1));
//   // spaceship.ambient = [0.7, 0, 0, 0.7];
//   // spaceship.diffuse = [0.8, 0, 0, 1];
//   // spaceship.specular = [0.7, 0, 0, 0.7];
//   // spaceship.shininess = 5;

//   // Create rotation node for spaceship and bind lights to it
//   rotateSpaceship = new TransformationSGNode(mat4.create(), [
//     new TransformationSGNode(glm.translate(0, 0, 0), [spaceship]),
//     rotatespotlight,
//     rotateLight, 
//     guardRotation
//   ]);

//   root.append(rotateSpaceship);

//   // Create spaceship light
//   // lightNode = new LightSGNode();
//   // lightNode.ambient = [0, 0, 0, 1];
//   // lightNode.diffuse = [1, 0, 0, 1];
//   // lightNode.specular = [1, 0, 0, 1];
//   // lightNode.append(createLightSphere());
//   // rotateLight = new TransformationSGNode(glm.transform({ translate: [0, 3, 0] }), [lightNode]);

//   // Create rotation node for spaceship and bind lights to it
//   // rotateSpaceship = new TransformationSGNode(mat4.create(), [
//   //   new TransformationSGNode(glm.translate(0, 0, 0), [spaceshipTransform]),
//   //   lightTransform,
//   //   // rotateLight
//   // ]);

//   // Create planet
//   // planet = new MaterialSGNode([new RenderSGNode(makePlanet(200,200))]);
//   // planet.ambient = [0.1, 0.2, 0.0, 1.0];
//   // planet.diffuse = [0.5, 1.0, 0.5, 1.0];
//   // planet.specular = [0.5, 0.5, 0.5, 1.0];
//   // planet.shininess = 5;
//   // rotatePlanet = new TransformationSGNode(glm.transform({ translate: [0, -216, 0], rotateX: -90, scale: 20}), [planet]);
//   // root.append(rotatePlanet);
//   planet = new MaterialSGNode([new RenderSGNode(makeSphere(5, 50, 50))]);
//   planetNode = new TransformationSGNode(glm.transform({ translate: [20, 0, 50], scale: 1 }), [planet]);
//   root.append(planetNode);

//   // Create sun node
//   sun = new LightSGNode();
//   sun.ambient = [0.5, 0.5, 0.5, 1.0];
//   sun.diffuse = [1.0, 1.0, 1.0, 1.0];
//   sun.specular = [1.0, 1.0, 1.0, 1.0];
//   sun.emission = [0.3, 0.2, 0.1, 1];
//   sun.append(createLightSphere());

//   rotateSun = new TransformationSGNode(glm.transform({ translate: [90, 100, -300], scale: 100}), [sun]);
//   root.append(rotateSun);

//   return root;
// }

// // Render a frame
// function render(timeInMilliseconds) {
//   // Check for resize of browser window and adjust canvas sizes
//   checkForWindowResize(gl);

//   gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

//   // Set the background color to dark blue
//   gl.clearColor(0.0, 0.0, 0.2, 1.0);

//   // Clear the buffer
//   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//   // Create projection Matrix and context for rendering.
//   // const context = createSGContext(gl);
//   // context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 2000);
//   // context.viewMatrix = mat4.lookAt(mat4.create(), [0,1,-10], [0,0,0], [0,1,0]);
//   updateCameraPositionByTime(timeInMilliseconds, deltaTime, context);

//   var deltaTime = timeInMilliseconds - previousTime;
//   previousTime = timeInMilliseconds;
//   elapsedTime += deltaTime;

//   // if (elapsedTime >= 30000) {
//   //   camera.control.enabled = true;
//   // }

//   // Spacelight animation
//   // if (elapsedTime < 30000) {
//   //   const rotationSpeed = glm.deg2rad(0.1);
//   //   const rotationMatrix = mat4.rotateZ(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
//   //   mat4.multiply(rotateLight.matrix, rotationMatrix, rotateLight.matrix);
//   // }

//   // // Guardian animation
//   // if (elapsedTime < 30000) {
//   //   const rotationSpeed = glm.deg2rad(0.1);
//   //   const rotationMatrix = mat4.rotateZ(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
//   //   mat4.multiply(guardRotation.matrix, rotationMatrix, guardRotation.matrix);
//   // }

//   // Spaceship animation
//   let initialSpeed, decreaseRate;

//   initialSpeed = 0.04; // Adjust the initial speed as needed
//   decreaseRate = 0.002; // Adjust the rate at which the speed decreases

//   // if (elapsedTime < 14000) {
//   //   // Move rotateSpaceship (spaceship) forward on x-axis
//   //   const elapsedSeconds = elapsedTime / 1000; // Convert elapsed time to seconds
//   //   const translationSpeed = initialSpeed - (decreaseRate * elapsedSeconds); // Calculate the adjusted speed
//   //   const translationMatrix = mat4.translate(mat4.create(), mat4.create(), [0, 0, -translationSpeed * deltaTime]);
//   //   mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, translationMatrix);
//   // }
  
//     // camera.control.position = vec3.fromValues(0, 1, -30);
//     // context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
//     // context.viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 1, 0]);
//   // if (elapsedTime >= 5000 && elapsedTime < 10500) {
//   //   // Rotate rotateSpaceship (spaceship) 90 degrees on z-axis slowly
//   //   const rotationSpeed = glm.deg2rad(0.0075); // Adjust the speed as needed
//   //   const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), -rotationSpeed * deltaTime);
//   //   mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, rotationMatrix);
//   // }
  
//   // if (elapsedTime >= 10500 && elapsedTime < 14000) {
//   //   // Rotate rotateSpaceship (spaceship) 90 degrees on z-axis slowly
//   //   const rotationSpeed = glm.deg2rad(0.0075); // Adjust the speed as needed
//   //   const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
//   //   mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, rotationMatrix);
//   // }

//   // if (elapsedTime >= 14500 && elapsedTime < 22500) {
//   //   // Rotate rotateSpaceship (spaceship) 90 degrees on z-axis slowly
//   //   const rotationSpeed = glm.deg2rad(0.013); // Adjust the speed as needed
//   //   const rotationMatrix = mat4.rotateX(mat4.create(), mat4.create(), rotationSpeed * deltaTime);
//   //   mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, rotationMatrix);
//   // }

//   // initialSpeed1 = 0.001; // Adjust the initial speed as needed
//   // decreaseRate1 = 0.001; // Adjust the rate at which the speed decreases

//   // if (elapsedTime >= 24500 && elapsedTime < 30000) {
//   //   // Move rotateSpaceship (spaceship) down on y-axis
//   //   const elapsedSeconds = elapsedTime / 1000; // Convert elapsed time to seconds
//   //   const translationSpeed = initialSpeed1 - (decreaseRate1 * elapsedSeconds); // Calculate the adjusted speed
//   //   const translationMatrix = mat4.translate(mat4.create(), mat4.create(), [0, 0, -translationSpeed * deltaTime]);
//   //   mat4.multiply(rotateSpaceship.matrix, rotateSpaceship.matrix, translationMatrix);
//   // }

//   // Move and apply camera
//   camera.update(deltaTime);
//   camera.render(context);

//   // Render scene
//   root.render(context);

//   // Request another call as soon as possible
//   requestAnimationFrame(render);
// }

// // Functions
// function makePlanet(width, height) {
//   var planet = makeRect(width, height);
//   planet.texture = [0, 0,   width, 0,   width, height,   0, height];
//   return planet;
// }

// function updateCameraPositionByTime(elapsedTime, deltaTime, context) {
//   let spaceshipPosition = vec3.fromValues(rotateSpaceship.matrix[12], rotateSpaceship.matrix[13], rotateSpaceship.matrix[14]);
//   let planetCenter = vec3.fromValues(planetNode.matrix[12], planetNode.matrix[13], planetNode.matrix[14]);

//   moveSpaceShipTowardsPlanet(planetNode.matrix, deltaTime * 0.0000001, rotateSpaceship.matrix)

//   if (elapsedTime >= 5000 && elapsedTime < 15000) {
//     let dir = vec3.create();
//     vec3.subtract(dir, planetCenter, spaceshipPosition);
//     vec3.normalize(dir, dir);
//     let distance = -5; // Adjust the distance as needed

//     // Calculate the camera's new position
//     let cameraNewPosition = vec3.create();
//     vec3.scaleAndAdd(cameraNewPosition, spaceshipPosition, dir, distance);

//     // Update the camera's position
//     camera.control.position = cameraNewPosition;

//     context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(60), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
//     context.viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 1, 0]);

//     if (!scene2Initiated) {
//       tiltSpaceship(0, -70);
//       scene2Initiated = true;
//     }
//   } else if (elapsedTime >= 15000 && elapsedTime < 20000) {
//     if (!scene3Initiated) {
//       tiltSpaceship(0, 90);
//       scene3Initiated = true;
//     }
//     camera.control.position = vec3.fromValues(0, 1, -30);
//     context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
//     context.viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 1, 0]);
//   } else if (elapsedTime >= 20000 && elapsedTime < 25000) {
//     // Create a scene for landing spaceship
//   }
// }

// function moveSpaceShipTowardsPlanet(planetTransform, velocity, spaceshipTransform){
//   let currentMatrix = rotateSpaceship.matrix;
//   let spaceshipPosition = vec3.fromValues(spaceshipTransform[12], spaceshipTransform[13], spaceshipTransform[14])
//   let planetPosition = vec3.fromValues(planetTransform[12], planetTransform[13], planetTransform[14]); // Move along the negative x-axis
//   let direction = vec3.subtract(vec3.create(), planetPosition, spaceshipPosition);

//   vec3.normalize(direction, direction)

//   let new_position = vec3.scaleAndAdd(vec3.create(), spaceshipPosition, direction, .01);
//   console.log(spaceshipPosition, planetPosition, new_position, direction)

//   rotateSpaceship.matrix[12] = new_position[0];
//   rotateSpaceship.matrix[13] = new_position[1];
//   rotateSpaceship.matrix[14] = new_position[2];
// }

// function tiltSpaceship(xAngle, yAngle) {
//   let currentMatrix = rotateSpaceship.matrix;
//   mat4.rotateY(currentMatrix, currentMatrix, glm.deg2rad(yAngle));
//   mat4.rotateX(currentMatrix, currentMatrix, glm.deg2rad(xAngle));
//   rotateSpaceship.matrix = currentMatrix;
// }

// // Classes
// class SpotLightSGNode extends LightSGNode {
//   constructor() {
//     super();
//     this.position = [0, 0, 0];
//     this.direction = [0, 0, -1];
//     this.angle = 10;
//     this.cutoff = 30;
//     this.exponent = 10;
//   }
// }