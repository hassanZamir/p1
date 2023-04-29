[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/BM-SU2JX)
[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-8d59dc4de5201274e310e4c54b9627a8934c3b88527886e3b421487c677d23eb.svg)](https://classroom.github.com/a/BM-SU2JX)
# CG Lab Project

Submission template for the CG lab project at the Johannes Kepler University Linz.

### Explanation

This `README.md` needs to be pushed to Github for each of the 3 delivery dates.
For every submission change/extend the corresponding sections by replacing the *TODO* markers. Make sure that you push everything to your Github repository before the respective deadlines. For more details, see the Moodle page.

## Concept submission due on 31.03.2023

### Group Members

|               | Student ID    | First Name  | Last Name      | E-Mail         |
|---------------|---------------|-------------|----------------|----------------|
| **Student 1** | 12245406      | Hassan      | Abdur Rehman   | hassan.abdur.rehman@gmail.com           |
| **Student 2** | 12242532      | Barış       | Aygen          | hbaris@sabanciuniv.edu           |

### Concept Submission due on 31.03.2023

Title: Space Adventure

The movie will be set in space and will feature a spaceship traveling. The spaceship will have multiple parts, such as the engines, wings, cockpit, and antenna, each made up of separate scene graph nodes. The movie will have following effects:

Basic movie effects:

- Composed Object: The spaceship will be a manually composed object consisting of multiple scene graph nodes.
- Illumination: Multiple light sources will be used to light up the spaceship and the environment. One of the light sources will be moving in the scene.
- Automated camera flight: The camera will start automatically, following the spaceship as it travels through space for 30 seconds.

- Special effects:

- Particle Effects: When the spaceship moves, fire will be emitted from the engine, creating a trail behind the spaceship. We shall be showing rain when space ship lands.

All the basic movie effects and particle special effects will be implemented as scene graph nodes. The implementation will be based on the unmodified lab framework. The movie will be self-contained and will run on regular PCs with Visual Studio Code. The code will be documented and modular, with each feature implemented in its own function.

We would have following shots in video

Planned Scenes and What happens:
- 1- Establishing shot of the spaceship flying through space
- 2- Close-up of the ship's engines firing
- 3- Wide shot of the ship approaching a planet
- 4- Close-up of the ship's landing gear deploying
- 5- Shot of the ship landing on the planet's surface
- 6- Close-up of the protagonist looking satisfied with their success
- 7- Final wide shot of the ship flying away into the depths of space


Which objects:
- 1- Space ship
- 2- Aliens
- 3- Earth


(Explain the basic story of your movie, i.e., planned scenes, what happens, which objects are used, etc.)

### Special Effects

Selected special effects must add up to exactly 30 points. Replace yes/no with either yes or no.

| Selected   | ID | Name                                  | Points |
|------------|----|---------------------------------------|--------|
| no      | S1 | Multi texturing                       | 15     |  
| no      | S2 | Level of detail                       | 15     |
| no      | S3 | Billboarding                          | 15     |
| no      | S4 | Terrain from heightmap                | 30     |
| no      | S5 | Postprocessing shader                 | 30     |
| no      | S6 | Animated water surface                | 30     |
| no      | S7 | Minimap                               | 30     |
| yes     | S8 | Particle system (rain, smoke, fire)   | 30     |
| no      | S9 | Motion blur                           | 30     |
| no      | SO | Own suggestion (preapproved by email) | TODO   |

## Intermediate Submission due on 29.04.2023

Prepare a first version of your movie that:
 * is 30 seconds long,
 * contains animated objects, and
 * has an animated camera movement. 

Push your code on the day of the submission deadline. 
The repository needs to contain:
  * code/ Intermediate code + resources + libs
  * video/ A screen recording of the intermediate result

Nothing to change here in `README` file.

**Note:** You don’t need to use any lighting, materials, or textures yet. This will be discussed in later labs and can be added to the project afterwards!

## Final Submission due on 20.06.2023

The repository needs to contain:
  * code/ Documented code + resources + libs
  * video/ A screen recording of the movie
  * README.md


### Workload

| Student ID     | Workload (in %) |
| ---------------|-----------------|
| TODO           | TODO            |
| TODO           | TODO            |

Workload has to sum up to 100%.

### Effects

Select which effects you have implemented in the table below. Replace yes/no/partial with one of the options.
Mention in the comments column of the table where you have implemented the code and where it is visible (e.g., spotlight is the lamp post shining on the street). 

| Implemented    | ID | Name                                                                                                   | Max. Points | Issues/Comments |
|----------------|----|--------------------------------------------------------------------------------------------------------|-------------|-----------------|
| yes/no/partial | 1a | Add at least one manually composed object that consists of multiple scene graph nodes.                 | 6           |                 |
| yes/no/partial | 1b | Animate separate parts of the composed object and also move the composed object itself in the scene.   | 4           |                 |
| yes/no/partial | 1c | Use at least two clearly different materials for the composed object.                                  | 3           |                 |
| yes/no/partial | 1d | Texture parts of your composed object by setting proper texture coordinates.                           | 5           |                 |
| yes/no/partial | 2a | Use multiple light sources.                                                                            | 5           |                 |
| yes/no/partial | 2b | One light source should be moving in the scene.                                                        | 3           |                 |
| yes/no/partial | 2c | Implement at least one spot-light.                                                                     | 10          |                 |
| yes/no/partial | 2d | Apply Phong shading to all objects in the scene.                                                       | 4           |                 |
| yes/no/partial | 3  | The camera is animated 30 seconds without user intervention. Animation quality and complexity of the camera and the objects influence the judgement.                                                                       | 10           |                 |
| yes/no/partial | Sx | TODO Special Effect Name                                                                               | TODO        |                 |
| yes/no/partial | Sy | TODO Special Effect Name                                                                               | TODO        |                 |
| yes/no/partial | SE | Special effects are nicely integrated and well documented                                              | 20          |                 |

### Special Effect Description

TODO

Describe how the effects work in principle and how you implemented them. If your effect does not work but you tried to implement it, make sure that you explain this. Even if your code is broken do not delete it (e.g., keep it as a comment). If you describe the effect (how it works, and how to implement it in theory), then you will also get some points. If you remove the code and do not explain it in the README this will lead to 0 points for the effect and the integration SE.

