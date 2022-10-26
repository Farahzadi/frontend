import * as THREE from 'three';
import {
  CSS3DRenderer,
  CSS3DObject,
} from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import * as TWEEN from '@tweenjs/tween.js';
import { useContext, useEffect } from 'react';
import { Object3D } from 'three';
import { CameraHelper } from 'three';
import { icons, addresses } from './icons.js';
import styles from './Background.module.css';
import { BGContext } from '../../../contexts/BGContext.js';
const NUMBER = 100;
const RADIUS = 800;
const CAMERA_RADIUS = 3000;
const DTHETA = 0.002;


function Background() {
  var renderer, camera, scene, cameraHelper, sphereRig;
  // let controls;
  let data = [];
  let objects = [];
  const { isAnimated, setIsAnimated } = useContext(BGContext);
  useEffect(() => {
    if (!objects.length) {
      init();
      animate();
    }
  }, []);
  function init() {
    camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    camera.position.z = CAMERA_RADIUS;
    cameraHelper = new CameraHelper(camera);
    sphereRig = new THREE.Group();
    scene = new THREE.Scene();
    scene.add(cameraHelper);
    cameraHelper.visible = true;
    camera.lookAt(0, 0, 0);

    const vector = new THREE.Vector3();

    for (let i = 0, l = NUMBER; i < l; i++) {
      //
      const element = document.createElement('div');
      element.className = styles.element;
    //   element.style.backgroundColor = `rgba(255, 255,255, ${
    //     Math.random() * 0.5 * 0.25
    //   })`;
      const img = document.createElement('img');
      img.src = addresses[Math.round(Math.random() * (addresses.length - 1))];
      img.width = 150;
      img.height = 75;
      element.appendChild(img);
      const objectCSS = new CSS3DObject(element);
      objectCSS.position.x = Math.random() * 4000 - 2000;
      objectCSS.position.y = Math.random() * 4000 - 2000;
      objectCSS.position.z = Math.random() * 4000 - 2000;
      objects.push(objectCSS);
      sphereRig.add(objectCSS);
      scene.add(objectCSS);
      scene.add(sphereRig);

      const phi = Math.acos(-1 + (2 * i) / l);
      const theta = Math.sqrt(l * Math.PI) * phi;
      const object = new THREE.Object3D();
      object.position.setFromSphericalCoords(RADIUS, phi, theta);
      vector.copy(object.position).multiplyScalar(2);
      object.lookAt(vector);
      data.push(object);
    }

    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const container = document.getElementById('sphere');
    container?.appendChild(renderer.domElement);

    // controls = new TrackballControls(camera, renderer.domElement);
    // controls.minDistance = 300;
    // controls.maxDistance = 4000;
    // controls.addEventListener('change', render);

    transform(data, 2000);
  }
  function transform(targets, duration) {
    TWEEN.removeAll();

    for (let i = 0; i < targets.length; i++) {
      const object = objects[i];
      const target = targets[i];

      new TWEEN.Tween(object.position)
        .to(
          { x: target.position.x, y: target.position.y, z: target.position.z },
          Math.random() * duration + duration
        )
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

      new TWEEN.Tween(object.rotation)
        .to(
          { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z },
          Math.random() * duration + duration
        )
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();
    }

    const chains = [];
    let theta = 0;
    while(theta < 1) {
      theta += DTHETA;
      chains.push(createTween(theta));
    }
    chains.forEach((val, index) => {
      if (index === chains.length - 1) {
        val.chain(chains[0]);
      } else {
        val.chain(chains[index+1]);

      }
    });
    chains[0].start(1000);

    new TWEEN.Tween(this)
      .to({}, duration * 2)
      .start()
      .onComplete(() => {
        setIsAnimated(true);
      });
  }

  function createTween(theta) {
    return new TWEEN.Tween(camera.position)
    .to(
      {
        x: CAMERA_RADIUS * Math.sin(2 * Math.PI * theta),
        y: 0,
        z: CAMERA_RADIUS * Math.cos(2 * Math.PI * theta),
      },
      100000 * DTHETA
    )
    .onUpdate(() => {
      camera.lookAt(0, 0, 0);
    })
    .easing(TWEEN.Easing.Linear.None);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    cameraHelper.update();
    cameraHelper.visible = true;
    renderer.clear();
    renderer.setSize(window.innerWidth, window.innerHeight);

    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
  }
  function render() {
    renderer.render(scene, camera);
  }

  return (
    <div id='sphere' className={styles.container}></div>
  );
}

export default Background;
