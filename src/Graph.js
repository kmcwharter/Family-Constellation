// Modules
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
//import ForceGraph3D from 'react-force-graph-3d';
import ForceGraphVR from "react-force-graph-3d";
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { forceCollide } from 'd3-force-3d';

//test start
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer;

init();
animate();

function init() {

  const container = document.getElementById( 'container' );
  container.addEventListener( 'click', function () {

    video.play();
    

  } );

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.layers.enable( 1 ); // render left view when no stereo available

  // video

  const video = document.getElementById( 'background-video' );
  video.play();

  const texture = new THREE.VideoTexture( video );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x101010 );

  // left

  const geometry1 = new THREE.SphereGeometry( 500, 60, 40 );
  // invert the geometry on the x-axis so that all of the faces point inward
  geometry1.scale( - 1, 1, 1 );

  const uvs1 = geometry1.attributes.uv.array;

  for ( let i = 0; i < uvs1.length; i += 2 ) {

    uvs1[ i ] *= 0.5;

  }

  const material1 = new THREE.MeshBasicMaterial( { map: texture } );

  const mesh1 = new THREE.Mesh( geometry1, material1 );
  mesh1.rotation.y = - Math.PI / 2;
  mesh1.layers.set( 1 ); // display in left eye only
  scene.add( mesh1 );

  // right

  const geometry2 = new THREE.SphereGeometry( 500, 60, 40 );
  geometry2.scale( - 1, 1, 1 );

  const uvs2 = geometry2.attributes.uv.array;

  for ( let i = 0; i < uvs2.length; i += 2 ) {

    uvs2[ i ] *= 0.5;
    uvs2[ i ] += 0.5;

  }

  const material2 = new THREE.MeshBasicMaterial( { map: texture } );

  const mesh2 = new THREE.Mesh( geometry2, material2 );
  mesh2.rotation.y = - Math.PI / 2;
  mesh2.layers.set( 2 ); // display in right eye only
  scene.add( mesh2 );

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType( 'local' );
  container.appendChild( renderer.domElement );

  document.body.appendChild( VRButton.createButton( renderer ) );

  //

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

  renderer.setAnimationLoop( render );

}

function render() {

  renderer.render( scene, camera );

}

//end

const Graph = ({ d3Data, highlightedFamily, setHighlightedFamily }) => {

  const [highlights, setHighlights] = useState({
    node: null,
    family: [],
    links: []
  });

  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const fgRef = useRef();

  // Manage force
  useEffect(() => {
    fgRef.current.d3Force('collide', forceCollide(55));
  });

  // Resize window
  window.onresize = function(event) {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  // Camera position
  const positionCamera = useCallback(node => {
    // Aim at node from outside it
    const distance = 350;
    const distRatio = 2 + distance/Math.hypot(node.x, node.y, node.z);
    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y, z: node.z * distRatio }, // new position
      node, // lookAt ({ x, y, z })
      1200  // ms transition duration
    );
  }, [fgRef]);

  // const cameraDistance = () => {
  //   const distanceRatio = (d3Data.nodes.length/2) * 15;
  //   if (distanceRatio < 450) {
  //     return 450;
  //   } else if (distanceRatio > 900) {
  //     return 2000;
  //   } else {
  //     return distanceRatio;
  //   }
  // }

  // Node design
  const setNodeThreeObject = node => {
    // Use a sphere as a drag handle
    const obj = new THREE.Mesh(
      new THREE.SphereGeometry(10, 30, 30),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 1 })
    );

    let partOfFamily = highlightedFamily === node.surname;

    // Add text sprite as child
    let name;
    if (node.firstName == '?') {
      name = node.name;
    } else {
      name = node.surname.toUpperCase() + ' ' + node.firstName;
    }
    let sprite = new SpriteText(name);

    // Sprite defaults
    const coloredSprite = () => {
      sprite.color = 'white';
      sprite.backgroundColor = 'rgba(255, 0, 0, 0)';
      // sprite.padding = 1;
      sprite.borderColor = '#444';
      // sprite.borderWidth = 1;
      sprite.strokeColor = 'black';
      sprite.strokeWidth = 2;
    }

    const greyedSprite = () => {
      sprite.color = 'rgba(0, 0, 0, 0)';
      sprite.backgroundColor = 'rgba(255, 0, 0, 0)';
      //sprite.borderWidth = 0;
    }

    // NODE.COLOR
    // No highlighted node
    if (highlights.node === null) {
      if (highlightedFamily) {
        if (highlightedFamily === node.surname) {
          coloredSprite();
        } else {
          greyedSprite();
        }
      } else {
        coloredSprite();
      }
    } else {
      if (highlights.family.indexOf(node.id) !== -1) {
        coloredSprite();
      } else {
        greyedSprite();
      }
    }

    sprite.fontFace = "Zen Kurenaido";
    sprite.fontWeight = 1000;
    sprite.textHeight = 10;
    obj.add(sprite);
    return obj;
  }

  // Node label
  const setNodeLabel = node => {

    // Label setup
    let label = `<div class="node-label">`;

    // // Gender
    // const labelGender = (node.gender === 'M') ? `???` : `???`;

    // // Name
    // if (node.title) {
    //   label += `<h4 class="node-title"><span style="color:${node.color}">${node.name} (${node.title})</span> ${labelGender}</h4>`;
    // } else {
    //   label += `<h4><span style="color:${node.color}">${node.name}</span> ${labelGender}</h4>`;
    // }
    // // Lifespan
    // label += `<p><b>${node.yob} - ${node.yod}</b></p>`;
    // // Birthplace
    // if (node.pob != '') {
    //   label += `<p><b>From:</b> ${node.pob}</p>`
    // }
    // // Deathplace
    // // if (node.pod != '') {
    // //   label += `<p><b>Died:</b> ${node.pod}</p>`
    // // }
    // // Bio
    // if (node.bio) {
    //   label += `<p>${node.bio}</p>`
    // }

    return label += '</div>';
  }

  // Handle node click
  const showFamily = (d3Data, node, highlights) => {

    // Find family member of clicked node
    const findFamilies = (links, node, highlights) => {
      if (links.source.id == node.id || links.target.id == node.id) {
        let updatedHighlightFamily = highlights.family;
        let updatedHighlightLinks = highlights.links;

        updatedHighlightFamily.push(links.target.id, links.source.id);
        updatedHighlightLinks.push(links.index);
        setHighlights({node: node, family: updatedHighlightFamily, links: updatedHighlightLinks})
      }
    }

    // None highlighted
    if (highlights.node === null) {
      d3Data.links.filter(links => findFamilies(links, node, highlights));

    // Different node highlighted
    } else if (highlights.node !== node) {
      let tempHighlights = {node: null, family: [], links: []}
      d3Data.links.filter(links => findFamilies(links, node, tempHighlights));

    // Reset current node
    } else {
      setHighlights({node: null, family: [], links: []})
    }
  }

  // Right click
  const handleRightClick = (d3Data, node, highlights) => {
    showFamily(d3Data, node, highlights);
    positionCamera(node);
  }


  // Link label
  const setLinkLabel = link => {
    // No state change
    switch(link.type) {
      case 'DIV':
        return '<div class="link-label"><p>Divorced</p></div>';
        break;
      case 'MARR':
        return '<div class="link-label"><p>Married</p></div>';
        break;
      case 'birth':
        return '<div class="link-label"><p>Birth</p></div>';
        break;
      case 'Natural':
        return '<div class="link-label"><p>Birth</p></div>';
        break;
      case 'Step':
        return '<div class="link-label"><p>Step</p></div>';
        break;
      case 'Adopted':
        return '<div class="link-label"><p>Adopted</p></div>';
        break;
    }
  }

  // Link color
  const setLinkColor = link => {

    return highlights.links.length < 1 ?
      highlightedFamily ?
        'rgba(255, 153, 153, 0.2)' : // Highlighed family exists, mute all links
        (link.sourceType != 'CHIL' && link.targetType != 'CHIL') ?
          'rgba(0, 150, 255, 0.6)' : // Romantic link
          'rgba(255, 255, 255, 0.2)' : // Normal link

      highlights.links.indexOf(link.index) !== -1 ?
      (link.sourceType != 'CHIL' && link.targetType != 'CHIL') ?
        'rgba(0, 150, 255, 0.6)' : // Romantic link
        'rgba(255, 200, 0, 0.2)' : // Normal link
      'rgba(255, 255, 255, 0.2)'; // Normal link
  }

  // Link width
  const setLinkWidth = link => {
    if (highlights.links.indexOf(link.index) !== -1) {
      return 1.7;
    } else {
      return 1;
    }
  }

  // Link particles
  const setLinkParticleWidth = link => {
    if (highlights.links.indexOf(link.index) !== -1) {
      return 3;
    } else {
      return 2;
    }
  }

  // Remove highlights
  const clearHighlights = () => {
    setHighlights({node: null, family: [], links: []});
    setHighlightedFamily();
  }

  // Add fog
  useEffect(() => {
    console.log(d3Data.nodes.length);
    let fogNear = 1000;
    let fogFar = 8000;
    if (d3Data.nodes.length < 120) {
      console.log('two');
      fogNear = 600;
      fogFar = 4000;
    };

    const fogColor = new THREE.Color(0x111111);

    var myFog = new THREE.Fog(fogColor, fogNear, fogFar);
    var myFogg = new THREE.FogExp2(fogColor, 0.0025);

    fgRef.current.scene().fog = myFog;
  }, []);


  // Add timeline
  useEffect(() => {

    // Get list of fixed Y
    let yRange = d3Data.nodes.map(node => Number(node.fy));

    // Filter our NaN
    yRange = yRange.filter(node => !isNaN(node) && node);

    // TIMELINE
    const highestY = Math.max.apply(Math, yRange);
    const lowestY = Math.min.apply(Math, yRange);

    //create a blue LineBasicMaterial
    var material = new THREE.LineBasicMaterial( {
      color: 0x333333,
      linewidth: 2
    } );

    var points = [];
    points.push( new THREE.Vector3( 0, lowestY, 0 ) );
    points.push( new THREE.Vector3( 0, highestY, 0 ) );

    var geometry = new THREE.BufferGeometry().setFromPoints( points );

    var line = new THREE.Line( geometry, material );

    fgRef.current.scene().add(line);
  }, []);

  // Add timeline YEAR
  useEffect(() => {

    // All YOBs
    let years = d3Data.nodes.map(node => Number(node.yob));

    // Filter out NaN
    years = years.filter(year => !isNaN(year));

    // Get list of fixed Y
    let yRange = d3Data.nodes.map(node => Number(node.fy));

    // Filter out NaN
    yRange = yRange.filter(node => !isNaN(node) && node);

    // TIMELINE
    const highestY = Math.max.apply(Math, yRange);
    const lowestY = Math.min.apply(Math, yRange);
    const halfY = (highestY + lowestY)/2;
    const quarterY = (halfY + lowestY)/2;
    const threeQuarterY = (halfY + highestY)/2;


    const earliestYOB = Math.min.apply(Math, years);
    const latestYOB = Math.max.apply(Math, years);
    const halfYOB = parseInt((earliestYOB + latestYOB)/2);
    const quarterYOB = parseInt((latestYOB + halfYOB)/2);
    const threeQuarterYOB = parseInt((earliestYOB + halfYOB)/2);

    // EARLIEST
    let earliest = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    earliest.position.y = highestY + 15;

    let earliestTimeLabel = earliestYOB ? new SpriteText(earliestYOB) : new SpriteText("Earlier");
    earliestTimeLabel.color = '#f8f8f8';
    earliestTimeLabel.fontFace = "Montserrat";
    earliestTimeLabel.fontWeight = 800;
    earliestTimeLabel.textHeight = 25;
    earliest.add(earliestTimeLabel);

    // LATEST
    let latest = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    latest.position.y = lowestY - 15;

    let latestTimeLabel = latestYOB ? new SpriteText(latestYOB) : new SpriteText("Later");
    latestTimeLabel.color = '#f8f8f8';
    latestTimeLabel.fontFace = "Montserrat";
    latestTimeLabel.fontWeight = 800;
    latestTimeLabel.textHeight = 25;
    latest.add(latestTimeLabel);

    // HALF
    let half = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    half.position.y = halfY;

    let halfTimeLabel = new SpriteText(halfYOB);
    halfTimeLabel.color = '#ccc';
    halfTimeLabel.fontFace = "Montserrat";
    halfTimeLabel.fontWeight = 800;
    halfTimeLabel.textHeight = 15;
    half.add(halfTimeLabel);

    // QUARTER
    let quarter = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    quarter.position.y = quarterY;

    let quarterTimeLabel = new SpriteText(quarterYOB);
    quarterTimeLabel.color = '#ccc';
    quarterTimeLabel.fontFace = "Montserrat";
    quarterTimeLabel.fontWeight = 800;
    quarterTimeLabel.textHeight = 15;
    quarter.add(quarterTimeLabel);

    // QUARTER
    let threeQuarter = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    threeQuarter.position.y = threeQuarterY;

    let threeQuarterTimeLabel = new SpriteText(threeQuarterYOB);
    threeQuarterTimeLabel.color = '#ccc';
    threeQuarterTimeLabel.fontFace = "Montserrat";
    threeQuarterTimeLabel.fontWeight = 800;
    threeQuarterTimeLabel.textHeight = 15;
    threeQuarter.add(threeQuarterTimeLabel);

    fgRef.current.scene().add(earliest);
    fgRef.current.scene().add(latest);
    highestY-lowestY > 300 && fgRef.current.scene().add(half);
    highestY-lowestY > 450 && fgRef.current.scene().add(quarter);
    highestY-lowestY > 450 && fgRef.current.scene().add(threeQuarter);
  }, []);

  useEffect(() => {
    fgRef.current.controls().enableDamping = true;
    fgRef.current.controls().dampingFactor = 0.3;
    fgRef.current.controls().rotateSpeed = 0.8;
    fgRef.current.controls().screenSpacePanning = true;
  }, [])


  // Create graph
  return <ForceGraphVR
    ref={fgRef}
    graphData={d3Data}

    // Display
    width={width}
    height={height}
    backgroundColor="rgba(0,0,0,0.5)"
    showNavInfo={true}

    // Controls
    controlType={'orbit'}
    enablePointerInteraction={true}
    enableNodeDrag={true}
    onBackgroundClick={clearHighlights}
    onBackgroundRightClick={clearHighlights}

    // Nodes
    //nodeLabel={setNodeLabel}
    nodeThreeObject={setNodeThreeObject}
    onNodeClick={node => showFamily(d3Data, node, highlights)}
    onNodeRightClick={node => handleRightClick(d3Data, node, highlights)}

    // LINKS
    linkLabel={setLinkLabel}
    linkColor={setLinkColor}
    linkOpacity={1}
    linkWidth={setLinkWidth}
    linkDirectionalParticles={link => (link.sourceType != 'CHIL' && link.targetType == 'CHIL' && d3Data.nodes.length < 300) ? 8 : 0}
    linkDirectionalParticleWidth={setLinkParticleWidth}
    linkDirectionalParticleSpeed={.001}
  />
}

export default Graph;
