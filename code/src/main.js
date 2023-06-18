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
var planet;
var planetNode;
//load the shader resources using a utility function
loadResources({
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


  //setup camera
  cameraStartPos = vec3.fromValues(0, 1, -10);
  camera = new UserControlledCamera(gl.canvas, cameraStartPos);
  //setup an animation for the camera, moving it into position
  cameraAnimation = new Animation(camera, 
            [{matrix: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 1, -10)), duration: 5000}], 
            false);
  cameraAnimation.start()

  //TODO create your own scenegraph
  root = createSceneGraph(gl, resources);
  // tiltSpaceship(0, -180)
  //create scenegraph without world and simple shader
  rootnoworld = new ShaderSGNode(createProgram(gl, resources.vs_single, resources.fs_single));
  rootnoworld.append(rotateNode); //reuse model part
}

// render a frame
function render(timeInMilliseconds) {
  // check for resize of browser window and adjust canvas sizes
  checkForWindowResize(gl);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  //Create projection Matrix and context for rendering.
  const context = createSGContext(gl);
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  context.viewMatrix = mat4.lookAt(mat4.create(), [0, 1, -10], [0, 0, 0], [0, 1, 0]);


  var deltaTime = timeInMilliseconds - previousTime;
  previousTime = timeInMilliseconds;

  updateCameraPositionByTime(timeInMilliseconds, deltaTime, context);
  // updateCameraPosition(0, 0, -20);
  // updateCameraPosition(-1, -1, -3); // Set the desired offset here
  // updateCameraView(context);
  //update animation BEFORE camera
  cameraAnimation.update(deltaTime);
  camera.update(deltaTime);

  //At the end of the automatic flight, switch to manual control
  if(!cameraAnimation.running && !camera.control.enabled) {
    camera.control.enabled = true;
  }

  //TODO use your own scene for rendering

  //Apply camera
  camera.render(context);

  //Render scene
  root.render(context);

  //request another call as soon as possible
  requestAnimationFrame(render);
}

function updateCameraPositionByTime(elapsedTime, deltaTime, context) {
  let spaceshipPosition = vec3.fromValues(rotateNode.matrix[12], rotateNode.matrix[13], rotateNode.matrix[14]);
  let cameraOffset;

  moveSpaceshipToPosition(deltaTime * 0.01, 0, 0);
  cameraOffset = vec3.fromValues(0, 1, -5);
  if (elapsedTime >= 5000 && elapsedTime < 15000) {
    // Update the camera's position to be in front of the spaceship looking towards it
    // cameraOffset = vec3.fromValues(0, 1, -5);
    // vec3.add(cameraPos, spaceshipPosition, cameraOffset);
    if (!scene2Initiated) {
      let planetCenter = vec3.fromValues(planetNode.matrix[12], planetNode.matrix[13], planetNode.matrix[14]);
      let dir = vec3.create();
      vec3.subtract(dir, planetCenter, spaceshipPosition);
      vec3.normalize(dir, dir);
      let distance = -5; // Adjust the distance as needed

      // Calculate the camera's new position
      let cameraNewPosition = vec3.create();
      vec3.scaleAndAdd(cameraNewPosition, spaceshipPosition, dir, distance);

      // Update the cameraPos variable with the new camera position
      camera.control.position = cameraNewPosition;

      let upVector = vec3.fromValues(0, 1, 0);
      camera.matrix = mat4.lookAt(mat4.create(), cameraNewPosition, spaceshipPosition, upVector);
    //   tiltSpaceship(0, -70);
      scene2Initiated = true;
    }
    // let spaceshipPosition = vec3.fromValues(rotateNode.matrix[12], rotateNode.matrix[13], rotateNode.matrix[14]);
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

  // create white light node
  // let light = new LightSGNode();
  // light.ambient = [.5, .5, .5, 1];
  // light.diffuse = [1, 1, 1, 1];
  // light.specular = [1, 1, 1, 1];
  // light.position = [0, 2, 2];
  // light.append(createLightSphere(resources));
  // // add light to scenegraph
  // root.append(light);


  // create spaceship
  let spaceship = new MaterialSGNode([new RenderSGNode(resources.spaceship)]);
  spaceship.matrix = mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(0.5, 0.5, 0.5));

  // Create spaceship light
  let spaceshipLight = new SpotLightSGNode();
  // spaceshipLight.ambient = [0.2, 0.2, 0.2, 1];
  // spaceshipLight.diffuse = [2.0, 2.0, 2.0, 1.0];
  // spaceshipLight.specular = [2.0, 2.0, 2.0, 1.0];
  // spaceshipLight.append(createLightSphere());

  let lightTransform = new TransformationSGNode(glm.transform({ translate: [0, 0, -2.8] }), [spaceshipLight]);

  // Create rotation node for spaceship and bind light to it
  rotateNode = new TransformationSGNode(mat4.create(), [
    new TransformationSGNode(glm.translate(0, 0, 0), [spaceship]),
    lightTransform
  ]);
  
  rotateNode.matrix = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(-10, 0, 10));
  // rotateNode.matrix = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(-10, 0, 10));
  rotateNode.matrix = mat4.scale(rotateNode.matrix, rotateNode.matrix, vec3.fromValues(0.2, 0.2, 0.2));

  // add spaceship to scenegraph
  root.append(rotateNode);

  // Create world
  // let world = new MaterialSGNode([new RenderSGNode(makeWorld(50,50))]);
  // world.ambient = [0.24725, 0.1995, 0.0745, 1];
  // world.diffuse = [0.5, 1.0, 0.5, 1.0];
  // world.specular = [0.628281, 0.555802, 0.366065, 1];
  // world.shininess = 50;
  // // add world to scenegraph
  // root.append(new TransformationSGNode(glm.transform({ translate: [0,-1.5,0], rotateX: -90, scale: 3}), [world]));

  planet = new MaterialSGNode([new RenderSGNode(makeSphere(5, 50, 50))]);
  planetNode = new TransformationSGNode(glm.transform({ translate: [20, 0, 50], scale: 0 }), [planet]);
  root.append(planetNode);
  
  return root;
}

function makeWorld(width, height) {
  var world = makeRect(width, height);
  world.texture = [0, 0,   width, 0,   width, height,   0, height];
  return world;
}

// function moveSpaceshipToPosition(x, y, z) {
//   let currentMatrix = rotateNode.matrix;
//   mat4.translate(currentMatrix, currentMatrix, vec3.fromValues(x, y, z));
//   rotateNode.matrix = currentMatrix;
// }
function moveSpaceshipToPosition(deltaTime) {
  let currentMatrix = rotateNode.matrix;
  let direction = vec3.fromValues(0, 0, -20); // Move along the negative x-axis
  let speed = 0.01; // Adjust the speed as needed
  let velocity = vec3.scale(vec3.create(), direction, speed * deltaTime);
  mat4.translate(currentMatrix, currentMatrix, velocity);
  rotateNode.matrix = currentMatrix;
}

function updateCameraPosition(offsetX, offsetY, offsetZ) {
  let spaceshipPosition = vec3.fromValues(rotateNode.matrix[12], rotateNode.matrix[13], rotateNode.matrix[14]);
  let cameraOffset = vec3.fromValues(offsetX, offsetY, offsetZ);
  vec3.add(cameraPos, spaceshipPosition, cameraOffset);
}

// function updateCameraView(context) {
//   vec3.add(cameraCenter, cameraPos, vec3.fromValues(0, 0, 10)); // Assuming the spaceship is moving along the z-axis
//   context.viewMatrix = mat4.lookAt(mat4.create(), cameraPos, cameraCenter, vec3.fromValues(0, 1, 0));
// }
function updateCameraView(context) {
  let spaceshipPosition = vec3.fromValues(rotateNode.matrix[12], rotateNode.matrix[13], rotateNode.matrix[14]);
  context.viewMatrix = mat4.lookAt(mat4.create(), cameraPos, spaceshipPosition, [0, 1, 0]);
}

function tiltSpaceship(xAngle, yAngle) {
  let currentMatrix = rotateNode.matrix;
  mat4.rotateY(currentMatrix, currentMatrix, glm.deg2rad(yAngle));
  mat4.rotateX(currentMatrix, currentMatrix, glm.deg2rad(xAngle));
  rotateNode.matrix = currentMatrix;
}

class SpotLightSGNode extends LightSGNode {
  constructor() {
    super();
    this.position = [0, 0, 0];
    this.direction = [0, -1, -1];
    this.angle = 0; // Spotlight angle in degrees
  }
}