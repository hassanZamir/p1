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
var transformNode;
// time in last render step
var previousTime = 0;

//load the shader resources using a utility function
loadResources({
  vs: './src/shader/texture.vs.glsl',
  fs: './src/shader/texture.fs.glsl',
  vs_single: './src/shader/single.vs.glsl',
  fs_single: './src/shader/single.fs.glsl',
  spaceship: './src/models/spaceship/E 45 Aircraft_obj.obj',
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
  tiltSpaceship(90, -45)
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

  moveSpaceshipToPosition(0, -deltaTime * 0.001, 0);
  updateCameraPosition(0, 0, -20); // Set the desired offset here
  updateCameraView(context);
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

function tiltSpaceship(xAngle, yAngle) {
  let currentMatrix = transformNode.matrix;
  mat4.rotateY(currentMatrix, currentMatrix, glm.deg2rad(yAngle));
  // mat4.rotateX(currentMatrix, currentMatrix, glm.deg2rad(xAngle));
  transformNode.matrix = currentMatrix;
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

  // create white light node
  let light = new LightSGNode();
  light.ambient = [.5, .5, .5, 1];
  light.diffuse = [1, 1, 1, 1];
  light.specular = [1, 1, 1, 1];
  light.position = [0, 2, 2];
  light.append(createLightSphere(resources));
  // add light to scenegraph
  root.append(light);


  // create spaceship
  let spaceship = new MaterialSGNode([new RenderSGNode(resources.spaceship)]);
  transformNode = new TransformationSGNode(glm.translate(0, 20, 0), [
    spaceship
  ]);
  
  // add spaceship to scenegraph
  root.append(transformNode);

  // Create world
  let world = new MaterialSGNode([new RenderSGNode(makeWorld(50,50))]);
  world.ambient = [0.24725, 0.1995, 0.0745, 1];
  world.diffuse = [0.5, 1.0, 0.5, 1.0];
  world.specular = [0.628281, 0.555802, 0.366065, 1];
  world.shininess = 50;
  // add world to scenegraph
  root.append(new TransformationSGNode(glm.transform({ translate: [0,-1.5,0], rotateX: -90, scale: 3}), [world]));

  return root;
}

function makeWorld(width, height) {
  var world = makeRect(width, height);
  world.texture = [0, 0,   width, 0,   width, height,   0, height];
  return world;
}

function moveSpaceshipToPosition(x, y, z) {
  let currentMatrix = transformNode.matrix;
  mat4.translate(currentMatrix, currentMatrix, vec3.fromValues(x, y, z));
  transformNode.matrix = currentMatrix;
}

function updateCameraPosition(offsetX, offsetY, offsetZ) {
  let spaceshipPosition = vec3.fromValues(transformNode.matrix[12], transformNode.matrix[13], transformNode.matrix[14]);
  let cameraOffset = vec3.fromValues(offsetX, offsetY, offsetZ);
  vec3.add(cameraPos, spaceshipPosition, cameraOffset);
}

function updateCameraView(context) {
  vec3.add(cameraCenter, cameraPos, vec3.fromValues(0, 0, 10)); // Assuming the spaceship is moving along the z-axis
  context.viewMatrix = mat4.lookAt(mat4.create(), cameraPos, cameraCenter, vec3.fromValues(0, 1, 0));
}