import * as THREE from 'three';
import {
  CSS3DRenderer,
  CSS3DObject,
} from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import * as TWEEN from '@tweenjs/tween.js';
import { useContext, useEffect } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { Object3D } from 'three';
import { CameraHelper } from 'three';
import { icons, addresses } from './icons.js';
import styles from './Background.module.css';
import { BGContext } from '../../../contexts/BGContext.js';
import * as coins from '../../Icons/Coins.js';
const NUMBER = 100;
const RADIUS = 800;
const CAMERA_RADIUS = 2500;
const CAMERA_RADIUS_ZOOM = 2100;
const DTHETA = 1;
const DTHETAX = 0.5;


function Background() {
  var renderer, camera, scene, cameraHelper, sphereRig, sphereParent;
  // let controls;
  let data = [];
  let objects = [];
  var yNum = 100;
  const { isAnimated, setIsAnimated } = useContext(BGContext);
  const coinsArray = [...Object.values(coins) ];
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
    sphereParent = new THREE.Group();
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
      // const img = document.createElement('img');
      // img.src = addresses[Math.round(Math.random() * (addresses.length - 1))];
      const parent = document.createElement('div');
      parent.className = styles.element;
      const RandomCoin = coinsArray[Math.round(Math.random() * (coinsArray.length - 1))];
      let randomCoinOpac = Math.random().toFixed(3);
      randomCoinOpac += randomCoinOpac === 0 ?  0.1 : 0;
      parent.innerHTML = ReactDOMServer.renderToStaticMarkup(<RandomCoin fill='#23344d' stroke='#23344d' opacity={randomCoinOpac} />);
      // img.width = 150;
      // img.height = 75;
      element.appendChild(parent);
      const objectCSS = new CSS3DObject(element);
      objectCSS.position.x = Math.random() * 4000 - 2000;
      objectCSS.position.y = Math.random() * 4000 - 2000;
      objectCSS.position.z = Math.random() * 4000 - 2000;
      objects.push(objectCSS);
      sphereRig.add(objectCSS);
      // scene.add(objectCSS);
      sphereParent.add(sphereRig);
      scene.add(sphereParent);

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
    let thetaX = 0;
    while(thetaX < 360) {
      theta += DTHETA;
      thetaX += DTHETAX;
      chains.push(createTween(theta, thetaX));
    }
    chains.forEach((val, index) => {
      if (index === chains.length - 1) {
        val.chain(chains[0]);
      } else {
        val.chain(chains[index+1]);

      }
    });
    zoomInCamera().start(2500);
    chains[0].start(1000);

    new TWEEN.Tween(this)
      .to({}, duration * 2)
      .start()
      .onComplete(() => {
        setIsAnimated(true);
      });
  }

  function zoomInCamera() {
    return new TWEEN.Tween(sphereParent.position).to(
      {
        x: window.innerWidth / 1.5,
        y: 0,
        z: CAMERA_RADIUS_ZOOM
      }, 10500
    ).easing(TWEEN.Easing.Linear.None);
  }

  function createTween(theta, thetaX) {
    return new TWEEN.Tween(sphereRig.rotation)
    .to(
      {
        x: thetaX,
        y: 0,
        z: theta,
      },
      10000 * DTHETA
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
    <div id='sphere' className={`${styles.container}`}></div>
  );
}

export default Background;
