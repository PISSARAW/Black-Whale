import { BoxGeometry, Group, Mesh, MeshBasicMaterial, ShaderMaterial, SphereGeometry } from 'three'
import type { VictoryDriver } from './types'
import { revealFutureEyes } from './tserriednichFace'
import { tserriednichVictoryPose, tserriednichVictoryCamera } from './tserriednichPose'
import { createFutureExecution } from './tserriednichExecution'
import { createTserriednichLook } from './tserriednichLook'
import { createTserriednichLikeness } from './tserriednichLikeness'
import { disposeVictoryObject, ease } from './resources'
import { FUTURE_FORECAST_SECONDS, FUTURE_ZETSU_END } from './tserriednichTiming'

/** Both perceptions reuse the same actors, camera setup and floor joint. */
export function createTserriednichVictory(): VictoryDriver {
  const likeness = createTserriednichLikeness()
  const execution = createFutureExecution()
  const light = createTserriednichLook()
  const stage = new Group()
  const joint = new Mesh(
    new BoxGeometry(6.6, 0.004, 0.065),
    new MeshBasicMaterial({ color: 0x151c25 }),
  )
  const edge = new Mesh(
    new BoxGeometry(6.6, 0.004, 0.014),
    new MeshBasicMaterial({ color: 0x879397 }),
  )
  joint.position.y = 0.028
  edge.position.set(0, 0.03, 0.027)
  joint.name = 'tserriednich-floor-joint'
  const envelope = new SphereGeometry(1, 32, 24)
  const vertices = envelope.attributes.position
  for (let i = 0; i < vertices.count; i++) {
    const y = vertices.getY(i)
    const shoulders = Math.exp(-((y - 0.53) ** 2) / 0.11)
    const waist = Math.exp(-((y + 0.09) ** 2) / 0.15)
    vertices.setX(i, vertices.getX(i) * (0.82 + 0.54 * shoulders - 0.08 * waist))
    vertices.setZ(i, vertices.getZ(i) * (0.86 + 0.12 * shoulders))
  }
  envelope.computeVertexNormals()
  const aura = new Mesh(
    envelope,
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { strength: { value: 0 }, seconds: { value: 0 } },
      vertexShader: `
        varying vec3 viewNormal;
        varying vec3 viewRay;
        varying vec3 flowPosition;
        void main() {
          vec4 positionInView = modelViewMatrix * vec4(position, 1.0);
          viewNormal = normalize(normalMatrix * normal);
          viewRay = -positionInView.xyz;
          flowPosition = position;
          gl_Position = projectionMatrix * positionInView;
        }
      `,
      fragmentShader: `
        varying vec3 viewNormal;
        varying vec3 viewRay;
        varying vec3 flowPosition;
        uniform float strength;
        uniform float seconds;
        void main() {
          float rim = 1.0 - max(0.0, dot(normalize(viewNormal), normalize(viewRay)));
          float azimuth = atan(flowPosition.z, flowPosition.x);
          float drift = flowPosition.y * 5.5 - seconds * 2.7;
          float strands = pow(0.5 + 0.5 * sin(azimuth * 7.0 + drift + sin(drift * 1.4)), 4.0);
          float edge = smoothstep(0.21, 0.79, rim) * (1.0 - smoothstep(0.83, 1.0, rim));
          gl_FragColor = vec4(0.66, 0.81, 0.91, strength * edge * (0.035 + strands * 0.37));
        }
      `,
    }),
  )
  aura.name = 'tserriednich-ten-envelope'
  stage.add(joint, edge, aura)
  return {
    update(context) {
      const time = context.frame.elapsed
      const background = context.scenery.getObjectByName(
        `stage-background:${context.state.environment.stageId}`,
      )
      if (background) {
        context.save(background)
        background.visible = false
      }
      likeness.apply(context)
      const pose = tserriednichVictoryPose(context)
      revealFutureEyes(context, pose.perceived)
      tserriednichVictoryCamera(context, pose)
      light.apply(context, pose.origin.x + 0.56)
      const ten = Math.max(1 - ease((time - 0.19) / 0.3), ease((time - FUTURE_ZETSU_END) / 0.32))
      stage.position.x = pose.origin.x + 0.6
      aura.visible = ten > 0 && !pose.perceived
      aura.material.uniforms.strength.value = ten
      aura.material.uniforms.seconds.value = context.comfort.camera === 0 ? 0 : time
      aura.position.copy(context.hero.root.position)
      aura.position.x -= stage.position.x
      aura.position.y += context.hero.height * 0.47
      aura.scale.set(
        context.hero.width * 0.64,
        context.hero.height * 0.55,
        context.hero.width * 0.49,
      )
      context.add(stage)
      if (pose.shot && time >= 7.47) {
        execution.sync(pose)
        context.add(execution.root)
      }
      context.scene.userData.futureVictory = {
        phase: pose.phase,
        perspective: pose.perceived ? 'perceived' : 'real',
        forecastSeconds: FUTURE_FORECAST_SECONDS,
        actual: context.hero.root.position.toArray(),
        perceived: pose.origin.toArray(),
        ten: aura.visible ? ten : 0,
        shot: pose.shot ? context.state.finishingShot : undefined,
      }
      context.defer(() => {
        delete context.scene.userData.futureVictory
      })
    },
    dispose() {
      execution.dispose()
      light.dispose()
      likeness.dispose()
      disposeVictoryObject(stage)
    },
  }
}
