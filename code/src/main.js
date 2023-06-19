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

//load the shader resources using a utility function
loadResources({
  // particleTexture: './src/models/flame.png',
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

  //setup camera
  cameraStartPos = vec3.fromValues(0, 1, -50);
  camera = new UserControlledCamera(gl.canvas, cameraStartPos);
  //setup an animation for the camera, moving it into position
  cameraAnimation = new Animation(camera,
            [{matrix: mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 1, -10)), duration: 5000}],
            false);
  // cameraAnimation.start()

  //TODO create your own scenegraph
  particleTexture = loadImageAndCreateTextureInfo('./src/models/flame.png');
  particleSystem = new ParticleSystem();

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
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);

  var deltaTime = timeInMilliseconds - previousTime;
  previousTime = timeInMilliseconds;

  //update animation BEFORE camera
  cameraAnimation.update(deltaTime);
  camera.update(deltaTime);
  
  updateCameraPositionByTime(timeInMilliseconds, deltaTime, context);
  // updateParticles(deltaTime, context);

  //At the end of the automatic flight, switch to manual control
  if(!cameraAnimation.running && !camera.control.enabled) {
    camera.control.enabled = true;
  }

  //TODO use your own scene for rendering

  //Apply camera
  camera.render(context);

   // Enable blending
   gl.enable(gl.BLEND);
   gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  //Render scene
  root.render(context);

  // Disable blending
  gl.disable(gl.BLEND);

  //request another call as soon as possible
  requestAnimationFrame(render);
}

function updateCameraPositionByTime(elapsedTime, deltaTime, context) {
  let spaceshipPosition = vec3.fromValues(rotateNode.matrix[12], rotateNode.matrix[13], rotateNode.matrix[14]);
  let planetCenter = vec3.fromValues(planetNode.matrix[12], planetNode.matrix[13], planetNode.matrix[14]);

  moveSpaceShipTowardsPlanet(planetNode.matrix, deltaTime * 0.0000001, rotateNode.matrix)

  if (elapsedTime >= 5000 && elapsedTime < 15000) {
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
  } else if (elapsedTime >= 15000 && elapsedTime < 20000) {
    if (!scene3Initiated) {
      tiltSpaceship(0, 90);
      scene3Initiated = true;
    }
    camera.control.position = vec3.fromValues(0, 1, -30);
    context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
    context.viewMatrix = mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 1, 0]);
  } else if (elapsedTime >= 20000 && elapsedTime < 25000) {

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
  spaceship.matrix = mat4.scale(mat4.create(), mat4.create(), vec3.fromValues(1, 1, 1));

  // Create spaceship light
  let spaceshipLight = new SpotLightSGNode();
  // spaceshipLight.ambient = [0.2, 0.2, 0.2, 1];
  // spaceshipLight.diffuse = [2.0, 2.0, 2.0, 1.0];
  // spaceshipLight.specular = [2.0, 2.0, 2.0, 1.0];
  spaceshipLight.append(createLightSphere());

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
  planetNode = new TransformationSGNode(glm.transform({ translate: [20, 0, 50], scale: 1 }), [planet]);
  root.append(planetNode);

  // particleSystemNode = new ParticleSystemSGNode();
  // root.append(particleSystemNode);

  return root;
}

function makeWorld(width, height) {
  var world = makeRect(width, height);
  world.texture = [0, 0,   width, 0,   width, height,   0, height];
  return world;
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

function moveSpaceShipTowardsPlanet(planetTransform, velocity, spaceshipTransform){
  let currentMatrix = rotateNode.matrix;
  let spaceshipPosition = vec3.fromValues(spaceshipTransform[12], spaceshipTransform[13], spaceshipTransform[14])
  let planetPosition = vec3.fromValues(planetTransform[12], planetTransform[13], planetTransform[14]); // Move along the negative x-axis
  let direction = vec3.subtract(vec3.create(), planetPosition, spaceshipPosition);
  console.log(direction)
  vec3.normalize(direction, direction)

  let new_position = vec3.scaleAndAdd(vec3.create(), spaceshipPosition, direction, .01);
  console.log(spaceshipPosition, planetPosition, new_position, direction)

  rotateNode.matrix[12] = new_position[0];
  rotateNode.matrix[13] = new_position[1];
  rotateNode.matrix[14] = new_position[2];
}

function createTexturedQuad(width, height) {
  // Create a quad with texture coordinates
  const quad = {
    position: [
      -width / 2, -height / 2, 0,
      width / 2, -height / 2, 0,
      -width / 2, height / 2, 0,
      width / 2, height / 2, 0
    ],
    texture: [
      0, 0,
      1, 0,
      0, 1,
      1, 1
    ],
    indices: [0, 1, 2, 1, 3, 2]
  };
  return quad;
}

function updateParticles(deltaTime, context) {
  let spaceshipPosition = vec3.fromValues(rotateNode.matrix[12], rotateNode.matrix[13], rotateNode.matrix[14]);

  let numParticles = 10;
  for (let i = 0; i < numParticles; i++) {
    let position = vec3.clone(spaceshipPosition);
    let velocity = vec3.fromValues(Math.random() * 0.01 - 0.005, Math.random() * 0.01 - 0.005, Math.random() * 0.01 - 0.005);
    let lifetime = 1000; // Adjust the lifetime as needed

    let particle = new Particle(position, velocity, lifetime, particleTexture);
    particleSystemNode.particleSystem.addParticle(particle);
  }

  particleSystem.update(deltaTime);
  particleSystem.render(context);
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

class ParticleSystemSGNode extends SGNode {
  constructor() {
    super();
    this.particleSystem = new ParticleSystem();
  }

  render(context) {
    this.particleSystem.update(context.deltaTime);
    this.particleSystem.render(context);
    super.render(context);
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addParticle(particle) {
    this.particles.push(particle);
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let particle = this.particles[i];
      particle.update(deltaTime);
      if (particle.lifetime <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(context) {
    for (let particle of this.particles) {
      particle.render(context);
    }
  }
}

class Particle {
  constructor(position, velocity, lifetime, texture) {
    this.position = position;
    this.velocity = velocity;
    this.lifetime = lifetime;
    this.texture = texture;
  }

  update(deltaTime) {
    vec3.scaleAndAdd(this.position, this.position, this.velocity, deltaTime);
    this.lifetime -= deltaTime;
  }

  render(context) {
    // Create a textured quad
    const quad = createTexturedQuad(0.1, 0.1); // Adjust the size as needed

    // Create a shader program
    const program = createProgram(gl, _resources.vs_particle, _resources.fs_particle);

    // Set up the vertex buffer and attributes
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.position), gl.STATIC_DRAW);
    const positionAttribute = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Set up the texture buffer and attributes
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad.texture), gl.STATIC_DRAW);
    const texCoordAttribute = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordAttribute);
    gl.vertexAttribPointer(texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // Set up the index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quad.indices), gl.STATIC_DRAW);

    // Set up the texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    const textureLocation = gl.getUniformLocation(program, 'u_texture');
    gl.uniform1i(textureLocation, 0);

    // Draw the textured quad
    gl.drawElements(gl.TRIANGLES, quad.indices.length, gl.UNSIGNED_SHORT, 0);
  }
}