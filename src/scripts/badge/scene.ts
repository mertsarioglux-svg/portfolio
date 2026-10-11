import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { type CardContent, cardBack, cardFront, loadCardFonts, sleeveDetails, strapTexture } from './textures';

/*
 * Ölçüler dünya birimi cinsinden. Kamera dikeyde hep ~5.64 birim gösterdiği için
 * kart her ekranda giriş bölümünün yüksekliğine göre aynı oranda görünür.
 */
const CAMERA_Z = 16;
const FOV = 20;
const SLEEVE = { w: 1.72, h: 2.72, depth: 0.016, bevel: 0.005, radius: 0.1 };
const PAPER = { w: 1.5, h: 2.08, bottom: 0.11 };
const HOLES = { x: 0.62, y: 1.15, r: 0.075 };
const SLOT = { y: 1.15, w: 0.42, h: 0.09 };
const SEAL_Y = 0.94;
const CLIP_Y = 1.6; // ipin klipse bağlandığı nokta (kılıf merkezine göre)
const ANCHOR = { x: 1.1, y: 4.4 }; // ipin iki ucu, ekranın üst kenarının dışında
const REST_CLIP_Y = 1.0; // dururken klipsin yüksekliği
const ROPE_LENGTH = Math.hypot(ANCHOR.x, ANCHOR.y - REST_CLIP_Y);
const SEGMENTS = 3;
const STEP = 1 / 60;
const GRAVITY = -32;
const TWIST_RETURN = 0.25; // kart arkasını dönünce yavaşça öne döner
const STRAP_WIDTH = 0.11;
const STRAP_REPEAT = STRAP_WIDTH * 16; // doku 1024×64 px
const CURVE_POINTS = 32;
const NO_CONTACTS = 0x0001_0000; // parçalar birbirine çarpmaz, sadece eklemlerle bağlı

export interface BadgeOptions {
  card: CardContent;
  reducedMotion: boolean;
}

export async function createBadge(canvas: HTMLCanvasElement, { card, reducedMotion }: BadgeOptions) {
  await Promise.all([RAPIER.init(), loadCardFonts(card)]);

  // --- Renderer, ışık, gölge -------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.8; // kağıt beyazı patlamasın, soyadındaki mavi doygun kalsın
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.55;
  room.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAMERA_Z);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-2.2, 3.4, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 12;
  key.shadow.blurSamples = 20;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  scene.add(key);

  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.ShadowMaterial({ opacity: 0.1 }));
  shadowCatcher.position.z = -1.2;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  // --- Kart: kağıt, şeffaf kılıf, metal klips ----------------------------------
  const badge = new THREE.Group();
  scene.add(badge);

  const paperY = -SLEEVE.h / 2 + PAPER.bottom + PAPER.h / 2;
  const paperPx = { w: 1024, h: Math.round((1024 * PAPER.h) / PAPER.w) };
  const paperGeometry = new THREE.PlaneGeometry(PAPER.w, PAPER.h);
  const front = new THREE.Mesh(
    paperGeometry,
    new THREE.MeshStandardMaterial({ map: cardFront(card, paperPx.w, paperPx.h, renderer), roughness: 0.92, envMapIntensity: 0.7 }),
  );
  front.position.set(0, paperY, 0.0025);
  const back = new THREE.Mesh(
    paperGeometry,
    new THREE.MeshStandardMaterial({ map: cardBack(card, paperPx.w, paperPx.h, renderer), roughness: 0.92, envMapIntensity: 0.7 }),
  );
  back.position.set(0, paperY, -0.0025);
  back.rotation.y = Math.PI;

  // Kılıf kenarlarda daha görünür, kağıdın üstünde neredeyse şeffaf (yazılar soluk görünmesin).
  const sleeve = new THREE.Mesh(
    createSleeveGeometry(),
    new THREE.MeshPhysicalMaterial({
      color: 0xd5dce2,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.5,
      alphaMap: sleeveAlpha(paperY),
      depthWrite: false,
      envMapIntensity: 1.2,
    }),
  );
  sleeve.renderOrder = 2;

  const pxPerUnit = 512 / SLEEVE.w;
  const toPx = (x: number, y: number) => ({ x: (x + SLEEVE.w / 2) * pxPerUnit, y: (SLEEVE.h / 2 - y) * pxPerUnit });
  const slotCorner = toPx(-SLOT.w / 2, SLOT.y + SLOT.h / 2);
  const details = sleeveDetails(
    512,
    Math.round(SLEEVE.h * pxPerUnit),
    {
      sealY: toPx(0, SEAL_Y).y,
      radius: SLEEVE.radius * pxPerUnit,
      holes: [-HOLES.x, HOLES.x].map((x) => ({ ...toPx(x, HOLES.y), r: HOLES.r * pxPerUnit })),
      slot: { ...slotCorner, w: SLOT.w * pxPerUnit, h: SLOT.h * pxPerUnit },
    },
    renderer,
  );
  const detailsMaterial = new THREE.MeshBasicMaterial({ map: details, transparent: true, depthWrite: false });
  const detailsGeometry = new THREE.PlaneGeometry(SLEEVE.w, SLEEVE.h);
  const surface = SLEEVE.depth / 2 + SLEEVE.bevel + 0.0006;
  const detailsFront = new THREE.Mesh(detailsGeometry, detailsMaterial);
  detailsFront.position.z = surface;
  const detailsBack = new THREE.Mesh(detailsGeometry, detailsMaterial);
  detailsBack.position.z = -surface;
  detailsBack.rotation.y = Math.PI;
  detailsFront.renderOrder = detailsBack.renderOrder = 3;

  const clip = createClip();
  badge.add(front, back, sleeve, detailsFront, detailsBack, clip);
  badge.traverse((object) => {
    if (object instanceof THREE.Mesh && object !== detailsFront && object !== detailsBack) object.castShadow = true;
  });

  // --- Boyun ipi: iki kol, V şeklinde ekranın üstüne gider -----------------------
  const strapMaterial = new THREE.MeshStandardMaterial({
    map: strapTexture(card, renderer),
    roughness: 0.75,
    side: THREE.DoubleSide,
  });

  // --- Fizik ---------------------------------------------------------------------
  const world = new RAPIER.World({ x: 0, y: GRAVITY, z: 0 });
  world.timestep = STEP;
  world.numSolverIterations = 8;

  const restClip = new THREE.Vector3(0, REST_CLIP_Y, 0);
  const startClip = reducedMotion ? restClip.clone() : new THREE.Vector3(1.9, 2.75, 0.35);
  const startRotation = new THREE.Quaternion().setFromEuler(
    reducedMotion ? new THREE.Euler() : new THREE.Euler(0.15, 0.9, -0.5),
  );
  const startCenter = startClip.clone().sub(new THREE.Vector3(0, CLIP_Y, 0).applyQuaternion(startRotation));

  const cardBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(startCenter.x, startCenter.y, startCenter.z)
      .setRotation(startRotation)
      .setLinearDamping(1.4)
      .setAngularDamping(2.2)
      .setCanSleep(false),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(SLEEVE.w / 2, SLEEVE.h / 2, 0.02).setDensity(5).setCollisionGroups(NO_CONTACTS),
    cardBody,
  );

  const zero = { x: 0, y: 0, z: 0 };
  const strands = [-1, 1].map((side) => {
    const anchor = new THREE.Vector3(side * ANCHOR.x, ANCHOR.y, 0);
    const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(anchor.x, anchor.y, anchor.z));
    const links: RAPIER.RigidBody[] = [];
    let previous = fixed;
    for (let i = 1; i <= SEGMENTS; i++) {
      const p = anchor.clone().lerp(startClip, i / SEGMENTS);
      const link = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(p.x, p.y, p.z)
          .setLinearDamping(2)
          .setAngularDamping(2)
          .setCanSleep(false),
      );
      world.createCollider(RAPIER.ColliderDesc.ball(0.05).setDensity(150).setCollisionGroups(NO_CONTACTS), link);
      world.createImpulseJoint(RAPIER.JointData.rope(ROPE_LENGTH / SEGMENTS, zero, zero), previous, link, true);
      links.push(link);
      previous = link;
    }
    world.createImpulseJoint(RAPIER.JointData.spherical(zero, { x: 0, y: CLIP_Y, z: 0 }), previous, cardBody, true);

    const ribbon = new Ribbon(CURVE_POINTS + 1, STRAP_WIDTH, strapMaterial);
    scene.add(ribbon.mesh);
    return {
      anchor,
      links,
      smooth: links.map((link) => new THREE.Vector3().copy(link.translation())),
      curve: new THREE.CatmullRomCurve3([0, 1, 2, 3].map(() => new THREE.Vector3()), false, 'chordal'),
      points: Array.from({ length: CURVE_POINTS + 1 }, () => new THREE.Vector3()),
      ribbon,
    };
  });

  // --- Her karede fizik → görüntü --------------------------------------------------
  const clipWorld = new THREE.Vector3();
  const linkPosition = new THREE.Vector3();

  const sync = (dt: number) => {
    const t = cardBody.translation();
    const r = cardBody.rotation();
    badge.position.set(t.x, t.y, t.z);
    badge.quaternion.set(r.x, r.y, r.z, r.w);
    clipWorld.set(0, CLIP_Y, 0).applyQuaternion(badge.quaternion).add(badge.position);

    for (const strand of strands) {
      // İpin ara noktalarını yumuşatarak takip et: hızlı çekişlerde titremeyi önler.
      strand.links.forEach((link, i) => {
        linkPosition.copy(link.translation());
        const smooth = strand.smooth[i];
        const distance = THREE.MathUtils.clamp(smooth.distanceTo(linkPosition), 0.1, 1);
        smooth.lerp(linkPosition, dt === 0 ? 1 : Math.min(1, dt * (10 + distance * 40)));
      });
      const [p0, p1, p2, p3] = strand.curve.points;
      p0.copy(clipWorld);
      p1.copy(strand.smooth[1]);
      p2.copy(strand.smooth[0]);
      p3.copy(strand.anchor);
      strand.points.forEach((point, i) => strand.curve.getPoint(i / CURVE_POINTS, point));
      strand.ribbon.update(strand.points, STRAP_REPEAT);
    }
  };

  // --- Sürükleme ---------------------------------------------------------------------
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const grabOffset = new THREE.Vector3();
  const dragTarget = new THREE.Vector3();
  const hitPoint = new THREE.Vector3();
  const probe = new THREE.Vector3();
  const clipOffset = new THREE.Vector3();
  const bodyRotation = new THREE.Quaternion();
  const trail: { time: number; x: number; y: number }[] = [];
  const pickable = [sleeve, front, back];
  let dragging = false;
  let halfWidth = 4;

  const aim = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  };

  const hitsBadge = (event: PointerEvent) => {
    aim(event);
    return raycaster.intersectObjects(pickable, false)[0];
  };

  // Kartı ipin boyundan daha uzağa çekmeye izin verme (ip esnemez) ve ekranda tut.
  const constrain = (target: THREE.Vector3) => {
    const r = cardBody.rotation();
    bodyRotation.set(r.x, r.y, r.z, r.w);
    clipOffset.set(0, CLIP_Y, 0).applyQuaternion(bodyRotation);
    probe.copy(target).add(clipOffset);
    for (let i = 0; i < 4; i++) {
      for (const { anchor } of strands) {
        const distance = probe.distanceTo(anchor);
        if (distance > ROPE_LENGTH * 0.999) probe.sub(anchor).multiplyScalar((ROPE_LENGTH * 0.999) / distance).add(anchor);
      }
    }
    probe.x = THREE.MathUtils.clamp(probe.x, -halfWidth + 0.6, halfWidth - 0.6);
    target.copy(probe).sub(clipOffset);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    const hit = hitsBadge(event);
    if (!hit) return;
    event.preventDefault();
    const t = cardBody.translation();
    grabOffset.set(hit.point.x - t.x, hit.point.y - t.y, 0);
    dragPlane.constant = -t.z;
    dragTarget.set(t.x, t.y, t.z);
    trail.length = 0;
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
    cardBody.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    wake();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (dragging) {
      aim(event);
      if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
        dragTarget.copy(hitPoint).sub(grabOffset);
        constrain(dragTarget);
      }
      wake();
      return;
    }
    if (event.pointerType === 'mouse') canvas.style.cursor = hitsBadge(event) ? 'grab' : '';
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = event.pointerType === 'mouse' ? 'grab' : '';
    cardBody.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    // Bırakırken son hareketin hızını karta ver: fırlatılabilsin.
    const first = trail[0];
    const last = trail[trail.length - 1];
    if (first && last && last.time > first.time) {
      const seconds = (last.time - first.time) / 1000;
      const vx = (last.x - first.x) / seconds;
      const vy = (last.y - first.y) / seconds;
      const speed = Math.hypot(vx, vy);
      const scale = speed > 24 ? 24 / speed : 1;
      cardBody.setLinvel({ x: vx * scale, y: vy * scale, z: 0 }, true);
    }
    wake();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // --- Döngü: kart durunca çizimi durdurur, etkileşimde yeniden başlar ---------------
  let running = false;
  let onScreen = true;
  let frame = 0;
  let last = 0;
  let accumulator = 0;
  let restTime = 0;

  const beforeStep = () => {
    if (dragging) {
      cardBody.setNextKinematicTranslation(dragTarget);
      return;
    }
    const r = cardBody.rotation();
    const w = cardBody.angvel();
    const twist = r.w < 0 ? -r.y : r.y;
    cardBody.setAngvel({ x: w.x, y: w.y - twist * TWIST_RETURN, z: w.z }, false);
  };

  const loop = (now: number) => {
    frame = 0;
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    accumulator += dt;
    let steps = 0;
    while (accumulator >= STEP && steps < 4) {
      beforeStep();
      world.step();
      accumulator -= STEP;
      steps++;
    }
    if (steps === 4) accumulator = 0;

    if (dragging) {
      trail.push({ time: now, x: dragTarget.x, y: dragTarget.y });
      while (trail.length > 1 && now - trail[0].time > 90) trail.shift();
    }

    sync(dt);
    renderer.render(scene, camera);

    const v = cardBody.linvel();
    const w = cardBody.angvel();
    const motion = v.x * v.x + v.y * v.y + v.z * v.z + w.x * w.x + w.y * w.y + w.z * w.z;
    restTime = !dragging && motion < 1e-3 ? restTime + dt : 0;
    if (restTime > 1 || !onScreen || document.hidden) {
      running = false;
      return;
    }
    frame = requestAnimationFrame(loop);
  };

  function wake() {
    if (running || !onScreen || document.hidden) return;
    running = true;
    restTime = 0;
    last = performance.now();
    frame = requestAnimationFrame(loop);
  }

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    halfWidth = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAMERA_Z * camera.aspect;
    if (!running) renderer.render(scene, camera);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const visibility = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) wake();
  });
  visibility.observe(canvas);
  const onVisibilityChange = () => {
    if (!document.hidden) wake();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  sync(0);
  resize();
  wake();

  return {
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        for (const material of [object.material].flat()) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
          material.dispose();
        }
      });
      scene.environment?.dispose();
      renderer.dispose();
      world.free();
    },
  };
}

/** Delikli, kenarları pahlı, ince plastik kılıf. */
function createSleeveGeometry() {
  const { w, h, radius, depth, bevel } = SLEEVE;
  const shape = roundedRect(new THREE.Shape(), -w / 2, -h / 2, w, h, radius);
  for (const x of [-HOLES.x, HOLES.x]) {
    const hole = new THREE.Path();
    hole.absarc(x, HOLES.y, HOLES.r, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  shape.holes.push(roundedRect(new THREE.Path(), -SLOT.w / 2, SLOT.y - SLOT.h / 2, SLOT.w, SLOT.h, SLOT.h / 2));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -depth / 2);

  // UV'leri kılıfın ön yüzüne göre 0–1 aralığına çevir (alphaMap için).
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) uv.setXY(i, (position.getX(i) + w / 2) / w, (position.getY(i) + h / 2) / h);
  return geometry;
}

/** Kılıfın saydamlık haritası: kenarlar beyaz (görünür), kağıdın üstü koyu (neredeyse şeffaf). */
function sleeveAlpha(paperY: number) {
  const width = 256;
  const height = Math.round((width * SLEEVE.h) / SLEEVE.w);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  const scale = width / SLEEVE.w;
  const left = ((SLEEVE.w - PAPER.w) / 2) * scale;
  const top = (SLEEVE.h / 2 - (paperY + PAPER.h / 2)) * scale;
  ctx.filter = 'blur(2px)';
  ctx.fillStyle = '#222222';
  ctx.fillRect(left, top, PAPER.w * scale, PAPER.h * scale);
  return new THREE.CanvasTexture(canvas);
}

function roundedRect<T extends THREE.Path>(path: T, x: number, y: number, w: number, h: number, r: number) {
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

/** İpin ucundaki metal parçalar: kıvrık uç, halka, döner başlık ve kılıfın yarığından geçen kanca. */
function createClip() {
  const metal = new THREE.MeshStandardMaterial({ color: 0xd2d6da, metalness: 1, roughness: 0.24 });
  const clip = new THREE.Group();

  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 12, 40), metal);
  hook.rotation.y = Math.PI / 2;
  hook.position.y = SLOT.y + 0.055;

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.11, 12), metal);
  shaft.position.y = 1.33;

  const swivel = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 20), metal);
  swivel.position.y = 1.405;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.015, 12, 40), metal);
  ring.scale.x = 1.2;
  ring.position.y = 1.49;

  const crimp = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.028), metal);
  crimp.position.y = 1.59;

  clip.add(hook, shaft, swivel, ring, crimp);
  return clip;
}

/** Kameraya bakan, eğri boyunca uzanan düz bant (boyun ipi). */
class Ribbon {
  readonly mesh: THREE.Mesh;
  private readonly positions: Float32Array;
  private readonly uvs: Float32Array;

  constructor(
    private readonly count: number,
    private readonly width: number,
    material: THREE.Material,
  ) {
    this.positions = new Float32Array(count * 6);
    this.uvs = new Float32Array(count * 4);
    const normals = new Float32Array(count * 6);
    for (let i = 2; i < normals.length; i += 3) normals[i] = 1;
    const indices: number[] = [];
    for (let i = 0; i < count - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2).setUsage(THREE.DynamicDrawUsage));
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
  }

  update(points: THREE.Vector3[], repeat: number) {
    const half = this.width / 2;
    let length = 0;
    for (let i = 0; i < this.count; i++) {
      const p = points[i];
      const before = points[Math.max(i - 1, 0)];
      const after = points[Math.min(i + 1, this.count - 1)];
      const tx = after.x - before.x;
      const ty = after.y - before.y;
      const size = Math.hypot(tx, ty) || 1;
      const nx = (-ty / size) * half;
      const ny = (tx / size) * half;
      if (i > 0) length += p.distanceTo(points[i - 1]);
      this.positions.set([p.x - nx, p.y - ny, p.z, p.x + nx, p.y + ny, p.z], i * 6);
      this.uvs.set([length / repeat, 0, length / repeat, 1], i * 4);
    }
    const geometry = this.mesh.geometry;
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
  }
}
