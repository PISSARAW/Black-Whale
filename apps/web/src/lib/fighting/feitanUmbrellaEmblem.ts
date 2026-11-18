/** The black skull and crossed bones follow the burgundy canopy rather than floating in front. */
export function createUmbrellaEmblem(THREE: typeof import('three'), radius: number) {
  const material = new THREE.MeshBasicMaterial({ color: '#170f1b', side: THREE.DoubleSide })
  const skull = new THREE.Shape()
  skull.moveTo(-0.26, -0.1)
  skull.bezierCurveTo(-0.55, 0.18, -0.35, 0.62, 0, 0.62)
  skull.bezierCurveTo(0.35, 0.62, 0.55, 0.18, 0.26, -0.1)
  skull.lineTo(0.23, -0.29)
  skull.lineTo(-0.23, -0.29)
  skull.closePath()
  for (const side of [-1, 1]) {
    const eye = new THREE.Path()
    eye.absellipse(side * 0.18, 0.18, 0.115, 0.15, 0, Math.PI * 2, true, side * -0.15)
    skull.holes.push(eye)
  }
  const nose = new THREE.Path()
  nose.moveTo(0, 0.04)
  nose.lineTo(-0.055, -0.08)
  nose.lineTo(0.055, -0.08)
  nose.closePath()
  skull.holes.push(nose)
  const shapes = [skull]
  for (const turn of [-0.48, 0.48]) {
    const bone = new THREE.Shape()
    const points = [
      [-0.62, -0.055],
      [0.62, -0.055],
      [0.62, 0.055],
      [-0.62, 0.055],
    ]
    points.forEach(([x, y], index) => {
      const px = x * Math.cos(turn) - y * Math.sin(turn)
      const py = x * Math.sin(turn) + y * Math.cos(turn) - 0.42
      if (index === 0) bone.moveTo(px, py)
      else bone.lineTo(px, py)
    })
    bone.closePath()
    shapes.push(bone)
  }
  const geometries = shapes.map((shape) => {
    const geometry = new THREE.ShapeGeometry(shape, 12)
    const positions = geometry.getAttribute('position')
    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index) * radius,
        z = positions.getY(index) * radius
      positions.setXYZ(index, x, Math.sqrt(Math.max(0, radius * radius - x * x - z * z)) + 0.004, z)
    }
    geometry.computeVertexNormals()
    return geometry
  })
  return {
    make() {
      const root = new THREE.Group()
      root.name = 'feitan-umbrella-skull'
      geometries.forEach((geometry) => root.add(new THREE.Mesh(geometry, material)))
      return root
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose())
      material.dispose()
    },
  }
}
