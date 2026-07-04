"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Device } from "./DeviceGrid"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface FloorplanViewerProps {
  devices: Device[]
  onDeviceToggle?: (id: string) => void
}

interface HoveredDeviceInfo {
  id: string
  name: string
  type: string
  room: string
  status: boolean
}

// Theme-aware color palettes for Three.js materials
function getThemeColors(isDark: boolean) {
  return {
    // Scene
    sceneBg: isDark ? 0x041c1c : 0xf8fafc,
    fogColor: isDark ? 0x041c1c : 0xf1f5f9,
    fogDensity: isDark ? 0.012 : 0.008,
    // Floor
    floorColor: isDark ? 0x0a2e2e : 0xe2e8f0,
    floorRoughness: isDark ? 0.5 : 0.7,
    floorMetalness: isDark ? 0.8 : 0.1,
    // Border
    borderColor: isDark ? 0x134e4a : 0xcbd5e1,
    // Grid
    gridColorCenter: isDark ? 0x2dd4bf : 0x94a3b8,
    gridColorLines: isDark ? 0x134e4a : 0xe2e8f0,
    // Walls
    wallColor: isDark ? 0x0d9488 : 0x64748b,
    wallOpacity: isDark ? 0.18 : 0.12,
    wallTransmission: isDark ? 0.6 : 0.7,
    wallEdgeColor: isDark ? 0x2dd4bf : 0x94a3b8,
    wallEdgeOpacity: isDark ? 0.4 : 0.3,
    // Materials
    woodColor: isDark ? 0x78350f : 0x92400e,
    fabricColor: isDark ? 0x475569 : 0x94a3b8,
    steelColor: isDark ? 0xd1d5db : 0x9ca3af,
    plasticColor: isDark ? 0x0f172a : 0x334155,
    glassColor: isDark ? 0xffffff : 0xffffff,
    glassOpacity: isDark ? 0.4 : 0.25,
    plantColor: isDark ? 0x15803d : 0x16a34a,
    // Ambient Light
    ambientColor: isDark ? 0x134e4a : 0xf1f5f9,
    ambientIntensity: isDark ? 0.6 : 1.2,
    // Directional Light
    dirLightColor: isDark ? 0x2dd4bf : 0xfbbf24,
    dirLightIntensity: isDark ? 1.2 : 0.8,
    // Screen glow
    screenColor: isDark ? 0x38bdf8 : 0x0ea5e9,
    screenEmissive: isDark ? 0x0369a1 : 0x0284c7,
    // Water dispenser
    waterColor: isDark ? 0x38bdf8 : 0x0ea5e9,
    // Active light
    bulbActiveColor: 0xffffff,
    bulbActiveEmissive: 0xffbd38,
    bulbInactiveColor: isDark ? 0x475569 : 0x94a3b8,
    bulbInactiveEmissive: isDark ? 0x1e293b : 0xd1d5db,
    // Spot light
    spotlightColor: isDark ? 0xffbd38 : 0xfbbf24,
    spotlightIntensity: isDark ? 10 : 6,
    // Glow cone
    glowConeColor: isDark ? 0xffbd38 : 0xfbbf24,
    glowConeOpacity: isDark ? 0.15 : 0.08,
  }
}

function FloorplanViewer({ devices, onDeviceToggle }: FloorplanViewerProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [viewMode, setViewMode] = useState<"top" | "iso">("iso")
  const [showGrid, setShowGrid] = useState(false)
  const [hoveredDevice, setHoveredDevice] = useState<HoveredDeviceInfo | null>(null)

  const mountRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [showAnnotations, setShowAnnotations] = useState(false)
  const showAnnotationsRef = useRef(showAnnotations)
  showAnnotationsRef.current = showAnnotations

  const drawingRoomRef = useRef<HTMLDivElement>(null)
  const workRoom1Ref = useRef<HTMLDivElement>(null)
  const workRoom2Ref = useRef<HTMLDivElement>(null)

  // Hide room labels if annotations are toggled off
  useEffect(() => {
    if (!showAnnotations) {
      if (drawingRoomRef.current) drawingRoomRef.current.style.display = "none"
      if (workRoom1Ref.current) workRoom1Ref.current.style.display = "none"
      if (workRoom2Ref.current) workRoom2Ref.current.style.display = "none"
    }
  }, [showAnnotations])

  // WebGL references for live updates
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  // Theme-sensitive material/object refs for dynamic updates
  const themeObjectsRef = useRef<{
    floor?: THREE.Mesh
    border?: THREE.Mesh
    gridHelper?: THREE.GridHelper
    ambientLight?: THREE.AmbientLight
    directionalLight?: THREE.DirectionalLight
    walls: THREE.Mesh[]
    wallEdges: THREE.LineSegments[]
    furnitureWood: THREE.Mesh[]
    furnitureFabric: THREE.Mesh[]
    furnitureSteel: THREE.Mesh[]
    furniturePlastic: THREE.Mesh[]
    furnitureGlass: THREE.Mesh[]
    furniturePlant: THREE.Mesh[]
    screenFaces: THREE.Mesh[]
    waterBottle?: THREE.Mesh
  }>({
    walls: [],
    wallEdges: [],
    furnitureWood: [],
    furnitureFabric: [],
    furnitureSteel: [],
    furniturePlastic: [],
    furnitureGlass: [],
    furniturePlant: [],
    screenFaces: [],
  })

  // Map to hold device meshes for status updating
  const deviceMeshesRef = useRef<Map<string, {
    bulbMesh?: THREE.Mesh
    glowMesh?: THREE.Mesh
    lightSource?: THREE.SpotLight
    fanBladeGroup?: THREE.Group
  }>>(new Map())

  // Lerping animation targets
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(25, 32, 35))
  const targetControlsTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  const isTransitioningRef = useRef(false)
  const devicesRef = useRef(devices)
  devicesRef.current = devices

  // Find device by ID
  const findDevice = (id: string) => {
    return devices.find((d) => d.id === id)
  }

  // Handle View Mode switching
  useEffect(() => {
    if (viewMode === "iso") {
      targetCameraPos.current.set(25, 32, 35)
      targetControlsTarget.current.set(0, 0, 0)
      isTransitioningRef.current = true
      if (controlsRef.current) {
        controlsRef.current.enableRotate = true
      }
    } else {
      targetCameraPos.current.set(0, 48, 0.01)
      targetControlsTarget.current.set(0, 0, 0)
      isTransitioningRef.current = true
      if (controlsRef.current) {
        controlsRef.current.enableRotate = false
      }
    }
  }, [viewMode])

  // Dynamically update theme colors on all Three.js objects when `isDark` changes
  useEffect(() => {
    const tc = getThemeColors(isDark)
    const refs = themeObjectsRef.current

    // Scene background & fog
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(tc.sceneBg)
      sceneRef.current.fog = new THREE.FogExp2(tc.fogColor, tc.fogDensity)
    }

    // Floor
    if (refs.floor) {
      const mat = refs.floor.material as THREE.MeshStandardMaterial
      mat.color.setHex(tc.floorColor)
      mat.roughness = tc.floorRoughness
      mat.metalness = tc.floorMetalness
    }

    // Border
    if (refs.border) {
      const mat = refs.border.material as THREE.MeshStandardMaterial
      mat.color.setHex(tc.borderColor)
    }

    // Grid
    if (refs.gridHelper) {
      sceneRef.current?.remove(refs.gridHelper)
      const newGrid = new THREE.GridHelper(80, 80, tc.gridColorCenter, tc.gridColorLines)
      newGrid.position.y = 0.01
      sceneRef.current?.add(newGrid)
      refs.gridHelper = newGrid
    }

    // Ambient Light
    if (refs.ambientLight) {
      refs.ambientLight.color.setHex(tc.ambientColor)
      refs.ambientLight.intensity = tc.ambientIntensity
    }

    // Directional Light
    if (refs.directionalLight) {
      refs.directionalLight.color.setHex(tc.dirLightColor)
      refs.directionalLight.intensity = tc.dirLightIntensity
    }

    // Walls
    refs.walls.forEach((wall) => {
      const mat = wall.material as THREE.MeshPhysicalMaterial
      mat.color.setHex(tc.wallColor)
      mat.opacity = tc.wallOpacity
      mat.transmission = tc.wallTransmission
    })

    refs.wallEdges.forEach((edge) => {
      const mat = edge.material as THREE.LineBasicMaterial
      mat.color.setHex(tc.wallEdgeColor)
      mat.opacity = tc.wallEdgeOpacity
    })

    // Furniture
    refs.furnitureWood.forEach((m) => (m.material as THREE.MeshStandardMaterial).color.setHex(tc.woodColor))
    refs.furnitureFabric.forEach((m) => (m.material as THREE.MeshStandardMaterial).color.setHex(tc.fabricColor))
    refs.furnitureSteel.forEach((m) => (m.material as THREE.MeshStandardMaterial).color.setHex(tc.steelColor))
    refs.furniturePlastic.forEach((m) => (m.material as THREE.MeshStandardMaterial).color.setHex(tc.plasticColor))
    refs.furnitureGlass.forEach((m) => {
      const mat = m.material as THREE.MeshPhysicalMaterial
      mat.color.setHex(tc.glassColor)
      mat.opacity = tc.glassOpacity
    })
    refs.furniturePlant.forEach((m) => (m.material as THREE.MeshStandardMaterial).color.setHex(tc.plantColor))

    // Screen faces
    refs.screenFaces.forEach((m) => {
      const mat = m.material as THREE.MeshStandardMaterial
      mat.color.setHex(tc.screenColor)
      mat.emissive.setHex(tc.screenEmissive)
    })

    // Water bottle
    if (refs.waterBottle) {
      const mat = refs.waterBottle.material as THREE.MeshPhysicalMaterial
      mat.color.setHex(tc.waterColor)
    }

    // Update device meshes (lights / spotlights / glow cones)
    devices.forEach((device) => {
      const meshes = deviceMeshesRef.current.get(device.id)
      if (!meshes) return
      const isActive = device.checked

      if (device.type === "light") {
        if (meshes.bulbMesh) {
          const mat = meshes.bulbMesh.material as THREE.MeshStandardMaterial
          mat.color.setHex(isActive ? tc.bulbActiveColor : tc.bulbInactiveColor)
          mat.emissive.setHex(isActive ? tc.bulbActiveEmissive : tc.bulbInactiveEmissive)
        }
        if (meshes.lightSource) {
          meshes.lightSource.color.setHex(tc.spotlightColor)
          meshes.lightSource.intensity = isActive ? tc.spotlightIntensity : 0
          meshes.lightSource.visible = isActive
        }
        if (meshes.glowMesh) {
          const mat = meshes.glowMesh.material as THREE.MeshBasicMaterial
          mat.color.setHex(tc.glowConeColor)
          mat.opacity = tc.glowConeOpacity
          meshes.glowMesh.visible = isActive
        }
      }
    })
  }, [isDark, devices])

  // Sync device states when `devices` prop changes (without full theme rebuild)
  useEffect(() => {
    const tc = getThemeColors(isDark)
    devices.forEach((device) => {
      const meshes = deviceMeshesRef.current.get(device.id)
      if (!meshes) return
      const isActive = device.checked

      if (device.type === "light") {
        if (meshes.bulbMesh) {
          const mat = meshes.bulbMesh.material as THREE.MeshStandardMaterial
          mat.emissive.setHex(isActive ? tc.bulbActiveEmissive : tc.bulbInactiveEmissive)
          mat.color.setHex(isActive ? tc.bulbActiveColor : tc.bulbInactiveColor)
        }
        if (meshes.lightSource) {
          meshes.lightSource.intensity = isActive ? tc.spotlightIntensity : 0
          meshes.lightSource.visible = isActive
        }
        if (meshes.glowMesh) {
          meshes.glowMesh.visible = isActive
        }
      }
    })
  }, [devices, isDark])

  // Keep track of previous device states to trigger toasts when they change
  const prevDeviceStatusesRef = useRef<Map<string, boolean>>(new Map())

  useEffect(() => {
    const formatRoomName = (room: string) => {
      if (room === "drawingRoom") return "Drawing Room"
      if (room === "workRoom1") return "Work Room 1"
      if (room === "workRoom2") return "Work Room 2"
      return room
    }

    devices.forEach((device) => {
      const prevStatus = prevDeviceStatusesRef.current.get(device.id)
      
      // If we already had a recorded status and it changed, show a toast
      if (prevStatus !== undefined && prevStatus !== device.checked) {
        const roomLabel = formatRoomName(device.room)
        const title = device.checked ? "Device Activated" : "Device Deactivated"
        const description = `${device.name} in ${roomLabel} is now ${device.checked ? "ON" : "OFF"}`

        const toastFn = device.checked ? toast.success : toast

        if (onDeviceToggle) {
          toastFn(title, {
            description,
            action: {
              label: "Undo",
              onClick: () => onDeviceToggle(device.id),
            },
          })
        } else {
          toastFn(title, { description })
        }
      }
      
      // Update the recorded status
      prevDeviceStatusesRef.current.set(device.id, device.checked)
    })
  }, [devices, onDeviceToggle])

  // Set up Three.js scene (runs once on mount)
  useEffect(() => {
    if (!canvasRef.current || !mountRef.current) return

    const tc = getThemeColors(isDark)

    // 1. Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(tc.sceneBg)
    scene.fog = new THREE.FogExp2(tc.fogColor, tc.fogDensity)
    sceneRef.current = scene

    // 2. Camera setup
    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.copy(targetCameraPos.current)
    cameraRef.current = camera

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    rendererRef.current = renderer

    // 4. Controls setup
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2.1
    controls.minDistance = 15
    controls.maxDistance = 120
    controlsRef.current = controls

    const handleControlsStart = () => {
      isTransitioningRef.current = false
    }
    controls.addEventListener("start", handleControlsStart)

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(tc.ambientColor, tc.ambientIntensity)
    scene.add(ambientLight)
    themeObjectsRef.current.ambientLight = ambientLight

    const directionalLight = new THREE.DirectionalLight(tc.dirLightColor, tc.dirLightIntensity)
    directionalLight.position.set(20, 40, 20)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.bias = -0.001
    scene.add(directionalLight)
    themeObjectsRef.current.directionalLight = directionalLight

    // Grid
    const gridHelper = new THREE.GridHelper(80, 80, tc.gridColorCenter, tc.gridColorLines)
    gridHelper.position.y = 0.01
    scene.add(gridHelper)
    themeObjectsRef.current.gridHelper = gridHelper

    // 6. Office Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(60, 32)
    const floorMat = new THREE.MeshStandardMaterial({
      color: tc.floorColor,
      roughness: tc.floorRoughness,
      metalness: tc.floorMetalness,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)
    themeObjectsRef.current.floor = floor

    // Floor border
    const borderGeo = new THREE.BoxGeometry(60.4, 0.2, 32.4)
    const borderMat = new THREE.MeshStandardMaterial({ color: tc.borderColor, roughness: 0.9 })
    const borderMesh = new THREE.Mesh(borderGeo, borderMat)
    borderMesh.position.y = -0.1
    scene.add(borderMesh)
    themeObjectsRef.current.border = borderMesh

    // 7. Holographic Wall Builder
    const wallMaterial = () =>
      new THREE.MeshPhysicalMaterial({
        color: tc.wallColor,
        transparent: true,
        opacity: tc.wallOpacity,
        transmission: tc.wallTransmission,
        roughness: 0.2,
        metalness: 0.1,
        depthWrite: false,
      })

    const wallEdgeMaterial = () =>
      new THREE.LineBasicMaterial({ color: tc.wallEdgeColor, transparent: true, opacity: tc.wallEdgeOpacity })

    const addWall = (w: number, d: number, x: number, z: number) => {
      const geo = new THREE.BoxGeometry(w, 3.5, d)
      const mat = wallMaterial()
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x, 1.75, z)
      scene.add(mesh)
      themeObjectsRef.current.walls.push(mesh)

      const edges = new THREE.EdgesGeometry(geo)
      const edgeMat = wallEdgeMaterial()
      const line = new THREE.LineSegments(edges, edgeMat)
      line.position.copy(mesh.position)
      scene.add(line)
      themeObjectsRef.current.wallEdges.push(line)
    }

    // Outer boundaries
    addWall(0.4, 27.2, -29.8, -2.4)
    addWall(0.4, 27.2, 29.8, -2.4)
    addWall(60, 0.4, 0, -15.8)
    addWall(24, 0.4, -18.0, 15.8)
    addWall(32, 0.4, 14.0, 15.8)

    // Inner dividers
    addWall(0.4, 27.2, -10.8, -2.4)
    addWall(0.4, 27.2, 9.7, -2.4)

    // Corridor dividers
    addWall(12, 0.4, -24.0, 11.2)
    addWall(2, 0.4, -12.0, 11.2)
    addWall(16.5, 0.4, 1.25, 11.2)
    addWall(16.5, 0.4, 21.75, 11.2)

    // 8. Furniture — each material is shared per category for efficient theme updates
    const woodMat = new THREE.MeshStandardMaterial({ color: tc.woodColor, roughness: 0.4, metalness: 0.1 })
    const fabricMat = new THREE.MeshStandardMaterial({ color: tc.fabricColor, roughness: 0.8 })
    const steelMat = new THREE.MeshStandardMaterial({ color: tc.steelColor, metalness: 0.9, roughness: 0.2 })
    const plasticMat = new THREE.MeshStandardMaterial({ color: tc.plasticColor, roughness: 0.6 })
    const glassMat = new THREE.MeshPhysicalMaterial({ color: tc.glassColor, transparent: true, opacity: tc.glassOpacity, transmission: 0.9 })
    const plantMat = new THREE.MeshStandardMaterial({ color: tc.plantColor, roughness: 0.6 })

    const trackMesh = (mesh: THREE.Mesh, category: keyof typeof themeObjectsRef.current) => {
      const arr = themeObjectsRef.current[category]
      if (Array.isArray(arr)) {
        (arr as THREE.Mesh[]).push(mesh)
      }
    }

    // Drawing Room Sofa
    const sofaGroup = new THREE.Group()
    sofaGroup.position.set(-27.6, 0, -6.5)
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 9.0), fabricMat)
    sofaBase.position.y = 0.3
    sofaBase.castShadow = true
    sofaBase.receiveShadow = true
    sofaGroup.add(sofaBase)
    trackMesh(sofaBase, "furnitureFabric")

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 9.0), fabricMat)
    sofaBack.position.set(-0.6, 0.6, 0)
    sofaBack.castShadow = true
    sofaGroup.add(sofaBack)
    trackMesh(sofaBack, "furnitureFabric")

    const sofaLArm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.4), fabricMat)
    sofaLArm.position.set(0, 0.45, -4.3)
    sofaGroup.add(sofaLArm)
    trackMesh(sofaLArm, "furnitureFabric")

    const sofaRArm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.4), fabricMat)
    sofaRArm.position.set(0, 0.45, 4.3)
    sofaGroup.add(sofaRArm)
    trackMesh(sofaRArm, "furnitureFabric")
    scene.add(sofaGroup)

    // Armchair
    const chairGroup = new THREE.Group()
    chairGroup.position.set(-27.6, 0, 4.25)
    const chairBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.5), fabricMat)
    chairBase.position.y = 0.3
    chairBase.castShadow = true
    chairGroup.add(chairBase)
    trackMesh(chairBase, "furnitureFabric")

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 2.5), fabricMat)
    chairBack.position.set(-0.6, 0.6, 0)
    chairBack.castShadow = true
    chairGroup.add(chairBack)
    trackMesh(chairBack, "furnitureFabric")
    scene.add(chairGroup)

    // Coffee Table
    const tableGroup = new THREE.Group()
    tableGroup.position.set(-22.4, 0, -6.5)
    const glassTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 5.0), glassMat)
    glassTop.position.y = 0.8
    tableGroup.add(glassTop)
    trackMesh(glassTop, "furnitureGlass")

    for (const dx of [-1.4, 1.4]) {
      for (const dz of [-2.3, 2.3]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), steelMat)
        leg.position.set(dx, 0.4, dz)
        leg.castShadow = true
        tableGroup.add(leg)
        trackMesh(leg, "furnitureSteel")
      }
    }
    scene.add(tableGroup)

    // Decorative Plants
    const addPlant = (x: number, z: number) => {
      const group = new THREE.Group()
      group.position.set(x, 0, z)
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.8), woodMat)
      pot.position.y = 0.4
      pot.castShadow = true
      group.add(pot)
      trackMesh(pot, "furnitureWood")

      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), plantMat)
      leaves.position.y = 1.0
      leaves.scale.set(1.0, 1.4, 1.0)
      leaves.castShadow = true
      group.add(leaves)
      trackMesh(leaves, "furniturePlant")
      scene.add(group)
    }
    addPlant(-27.9, -13.9)
    addPlant(-13.4, 8.1)
    addPlant(-27.9, 13.1)
    addPlant(22.1, 13.1)

    // Office Desks & Monitors
    const desks = [
      { x: -6.75, z: -9.75, rot: 0 },
      { x: 4.75, z: -9.75, rot: 0 },
      { x: -6.75, z: 1.25, rot: Math.PI },
      { x: 4.75, z: 1.25, rot: Math.PI },
      { x: 13.75, z: -9.75, rot: 0 },
      { x: 25.25, z: -9.75, rot: 0 },
      { x: 13.75, z: 1.25, rot: Math.PI },
      { x: 25.25, z: 1.25, rot: Math.PI },
    ]

    desks.forEach((d) => {
      const deskGroup = new THREE.Group()
      deskGroup.position.set(d.x, 0, d.z)
      deskGroup.rotation.y = d.rot

      const topMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 2.5), woodMat)
      topMesh.position.y = 1.2
      topMesh.castShadow = true
      topMesh.receiveShadow = true
      deskGroup.add(topMesh)
      trackMesh(topMesh, "furnitureWood")

      const frame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.15, 0.1), steelMat)
      frame.position.set(0, 0.575, -1.1)
      frame.castShadow = true
      deskGroup.add(frame)
      trackMesh(frame, "furnitureSteel")

      // Monitor
      const monitorGroup = new THREE.Group()
      monitorGroup.position.set(0, 1.2, -0.6)

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4), steelMat)
      stand.position.y = 0.2
      stand.castShadow = true
      monitorGroup.add(stand)
      trackMesh(stand, "furnitureSteel")

      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.1), plasticMat)
      panel.position.y = 0.7
      panel.castShadow = true
      monitorGroup.add(panel)
      trackMesh(panel, "furniturePlastic")

      const screenFace = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.9),
        new THREE.MeshStandardMaterial({
          color: tc.screenColor,
          emissive: tc.screenEmissive,
          roughness: 0.1,
        })
      )
      screenFace.position.set(0, 0.7, 0.051)
      monitorGroup.add(screenFace)
      themeObjectsRef.current.screenFaces.push(screenFace)

      deskGroup.add(monitorGroup)
      scene.add(deskGroup)
    })

    // Water Dispenser
    const dispenserGroup = new THREE.Group()
    dispenserGroup.position.set(26.25, 0, 12.75)
    const dispenserBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 1.5), fabricMat)
    dispenserBase.position.y = 0.9
    dispenserBase.castShadow = true
    dispenserGroup.add(dispenserBase)
    trackMesh(dispenserBase, "furnitureFabric")

    const dispenserBottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.0, 16),
      new THREE.MeshPhysicalMaterial({ color: tc.waterColor, transparent: true, opacity: 0.6, transmission: 0.8 })
    )
    dispenserBottle.position.y = 2.3
    dispenserBottle.castShadow = true
    dispenserGroup.add(dispenserBottle)
    themeObjectsRef.current.waterBottle = dispenserBottle
    scene.add(dispenserGroup)

    // 9. Devices Setup
    const clickableObjects: THREE.Object3D[] = []

    // Lights
    const lightsData = [
      { id: "draw_light_1", room: "drawingRoom", type: "light", x: -25.5, z: -12.0 },
      { id: "draw_light_2", room: "drawingRoom", type: "light", x: -15.5, z: -12.0 },
      { id: "draw_light_3", room: "drawingRoom", type: "light", x: -20.5, z: 6.0 },
      { id: "work1_light_1", room: "workRoom1", type: "light", x: -7.0, z: -12.0 },
      { id: "work1_light_2", room: "workRoom1", type: "light", x: 5.0, z: -12.0 },
      { id: "work1_light_3", room: "workRoom1", type: "light", x: -1.0, z: 6.0 },
      { id: "work2_light_1", room: "workRoom2", type: "light", x: 13.5, z: -12.0 },
      { id: "work2_light_2", room: "workRoom2", type: "light", x: 25.5, z: -12.0 },
      { id: "work2_light_3", room: "workRoom2", type: "light", x: 19.5, z: 6.0 },
    ]

    lightsData.forEach((l) => {
      const devState = findDevice(l.id)
      const active = devState ? devState.checked : false

      const lightGroup = new THREE.Group()
      lightGroup.position.set(l.x, 0, l.z)

      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), steelMat)
      cord.position.y = 3.4
      lightGroup.add(cord)
      trackMesh(cord, "furnitureSteel")

      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.25), steelMat)
      socket.position.y = 2.7
      lightGroup.add(socket)
      trackMesh(socket, "furnitureSteel")

      const bulbMat = new THREE.MeshStandardMaterial({
        color: active ? tc.bulbActiveColor : tc.bulbInactiveColor,
        emissive: active ? tc.bulbActiveEmissive : tc.bulbInactiveEmissive,
        roughness: 0.1,
      })
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), bulbMat)
      bulb.position.y = 2.5
      bulb.castShadow = true
      lightGroup.add(bulb)

      const spotlight = new THREE.SpotLight(tc.spotlightColor, active ? tc.spotlightIntensity : 0, 15, Math.PI / 3, 0.6, 1.2)
      spotlight.position.set(0, 2.4, 0)
      spotlight.target.position.set(0, 0, 0)
      spotlight.castShadow = true
      spotlight.shadow.bias = -0.002
      spotlight.shadow.mapSize.width = 512
      spotlight.shadow.mapSize.height = 512
      spotlight.visible = active
      lightGroup.add(spotlight)
      lightGroup.add(spotlight.target)

      const glowMat = new THREE.MeshBasicMaterial({
        color: tc.glowConeColor,
        transparent: true,
        opacity: tc.glowConeOpacity,
        blending: THREE.AdditiveBlending,
      })
      const glowCone = new THREE.Mesh(new THREE.ConeGeometry(3.0, 4.0, 16, 1, true), glowMat)
      glowCone.position.set(0, 0.5, 0)
      glowCone.rotation.x = Math.PI
      glowCone.visible = active
      lightGroup.add(glowCone)

      const targetMat = new THREE.MeshBasicMaterial({ visible: false })
      const clickTarget = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), targetMat)
      clickTarget.position.y = 2.5
      clickTarget.userData = { isDevice: true, id: l.id, type: "light", room: l.room, name: devState?.name || l.id }
      lightGroup.add(clickTarget)
      clickableObjects.push(clickTarget)

      scene.add(lightGroup)

      deviceMeshesRef.current.set(l.id, {
        bulbMesh: bulb,
        lightSource: spotlight,
        glowMesh: glowCone,
      })
    })

    // Fans
    const fansData = [
      { id: "draw_fan_1", room: "drawingRoom", type: "fan", x: -20.5, z: -9.0 },
      { id: "draw_fan_2", room: "drawingRoom", type: "fan", x: -20.5, z: 2.0 },
      { id: "work1_fan_1", room: "workRoom1", type: "fan", x: -1.0, z: -9.0 },
      { id: "work1_fan_2", room: "workRoom1", type: "fan", x: -1.0, z: 0.0 },
      { id: "work2_fan_1", room: "workRoom2", type: "fan", x: 19.5, z: -9.0 },
      { id: "work2_fan_2", room: "workRoom2", type: "fan", x: 19.5, z: 0.0 },
    ]

    fansData.forEach((f) => {
      const devState = findDevice(f.id)
      const active = devState ? devState.checked : false

      const fanGroup = new THREE.Group()
      fanGroup.position.set(f.x, 0, f.z)

      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0), steelMat)
      rod.position.y = 3.5
      fanGroup.add(rod)
      trackMesh(rod, "furnitureSteel")

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.15, 16), steelMat)
      hub.position.y = 2.9
      fanGroup.add(hub)
      trackMesh(hub, "furnitureSteel")

      const bladeGroup = new THREE.Group()
      bladeGroup.position.y = 2.85

      for (let i = 0; i < 3; i++) {
        const bladePivot = new THREE.Group()
        bladePivot.rotation.y = (i * Math.PI * 2) / 3

        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.015, 0.28), steelMat)
        blade.position.x = 0.8
        bladePivot.add(blade)
        trackMesh(blade, "furnitureSteel")

        bladeGroup.add(bladePivot)
      }
      fanGroup.add(bladeGroup)

      const targetMat = new THREE.MeshBasicMaterial({ visible: false })
      const clickTarget = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.0, 8), targetMat)
      clickTarget.position.y = 2.9
      clickTarget.userData = { isDevice: true, id: f.id, type: "fan", room: f.room, name: devState?.name || f.id }
      fanGroup.add(clickTarget)
      clickableObjects.push(clickTarget)

      scene.add(fanGroup)

      deviceMeshesRef.current.set(f.id, {
        fanBladeGroup: bladeGroup,
      })
    })

    // 10. Mouse & Raycasting
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const handleMouseInteraction = (e: MouseEvent, isClick: boolean) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(clickableObjects)

      if (intersects.length > 0) {
        const target = intersects[0].object
        const data = target.userData as HoveredDeviceInfo

        if (isClick) {
          if (onDeviceToggle) {
            onDeviceToggle(data.id)
          }
        } else {
          const curState = findDevice(data.id)
          setHoveredDevice({
            id: data.id,
            name: data.name,
            type: data.type,
            room: data.room,
            status: curState ? curState.checked : false,
          })
          document.body.style.cursor = "pointer"
        }
      } else {
        if (!isClick) {
          setHoveredDevice(null)
          document.body.style.cursor = "default"
        }
      }
    }

    const onCanvasClick = (e: MouseEvent) => handleMouseInteraction(e, true)
    const onCanvasMouseMove = (e: MouseEvent) => handleMouseInteraction(e, false)

    renderer.domElement.addEventListener("click", onCanvasClick)
    renderer.domElement.addEventListener("mousemove", onCanvasMouseMove)

    // 11. Animation loop
    let animationFrameId: number
    const clock = new THREE.Clock()

    const tick = () => {
      const delta = clock.getDelta()

      if (isTransitioningRef.current) {
        camera.position.lerp(targetCameraPos.current, 0.08)
        controls.target.lerp(targetControlsTarget.current, 0.08)
        if (
          camera.position.distanceTo(targetCameraPos.current) < 0.1 &&
          controls.target.distanceTo(targetControlsTarget.current) < 0.1
        ) {
          camera.position.copy(targetCameraPos.current)
          controls.target.copy(targetControlsTarget.current)
          isTransitioningRef.current = false
        }
      }

      // Project room annotations
      if (showAnnotationsRef.current) {
        const width = mountRef.current?.clientWidth || 0
        const height = mountRef.current?.clientHeight || 0

        const rooms = [
          { name: "Drawing Room", pos: new THREE.Vector3(-20.4, 0.5, -3.0), ref: drawingRoomRef },
          { name: "Work Room 1", pos: new THREE.Vector3(-1.0, 0.5, -4.5), ref: workRoom1Ref },
          { name: "Work Room 2", pos: new THREE.Vector3(19.5, 0.5, -4.5), ref: workRoom2Ref },
        ]

        rooms.forEach((r) => {
          if (r.ref.current) {
            const pos = r.pos.clone()
            pos.project(camera)

            if (pos.z > 1) {
              r.ref.current.style.display = "none"
            } else {
              r.ref.current.style.display = "block"
              const x = (pos.x * 0.5 + 0.5) * width
              const y = (pos.y * -0.5 + 0.5) * height
              r.ref.current.style.left = `${x}px`
              r.ref.current.style.top = `${y}px`
            }
          }
        })
      }

      // Spin active fans
      devicesRef.current.forEach((device) => {
        if (device.type === "fan" && device.checked) {
          const meshes = deviceMeshesRef.current.get(device.id)
          if (meshes && meshes.fanBladeGroup) {
            meshes.fanBladeGroup.rotation.y += delta * 15.0
          }
        }
      })

      // Grid visibility
      if (themeObjectsRef.current.gridHelper) {
        themeObjectsRef.current.gridHelper.visible = showGrid
      }

      controls.update()
      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(tick)
    }

    tick()

    // 12. Resize observer
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(mountRef.current)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener("click", onCanvasClick)
      renderer.domElement.removeEventListener("mousemove", onCanvasMouseMove)
      controls.dispose()
      scene.clear()
      renderer.dispose()
      document.body.style.cursor = "default"

      // Reset tracked refs
      themeObjectsRef.current = {
        walls: [],
        wallEdges: [],
        furnitureWood: [],
        furnitureFabric: [],
        furnitureSteel: [],
        furniturePlastic: [],
        furnitureGlass: [],
        furniturePlant: [],
        screenFaces: [],
      }
      deviceMeshesRef.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGrid])

  return (
    <div className="relative flex h-full flex-col gap-6 overflow-hidden border border-border bg-card/25 p-6 font-mono rounded-xl">
      {/* HUD Header */}
      <div className="z-10 flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <svg
            className="size-4 animate-pulse text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span className="text-xs font-bold tracking-wider text-foreground uppercase">
            3D OFFICE_FLOORPLAN_RESOLVER (WebGL)
          </span>
        </div>
        <div className="flex items-center gap-6">
          {/* Isometric Switch */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              ISOMETRIC
            </span>
            <Switch
              checked={viewMode === "iso"}
              onCheckedChange={(checked) => setViewMode(checked ? "iso" : "top")}
            />
          </div>

          {/* Grid Switch */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              GRID
            </span>
            <Switch
              checked={showGrid}
              onCheckedChange={setShowGrid}
            />
          </div>

          {/* Annotations Switch */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              LABELS
            </span>
            <Switch
              checked={showAnnotations}
              onCheckedChange={setShowAnnotations}
            />
          </div>
        </div>
      </div>

      {/* Hover Info Panel */}
      {hoveredDevice && (
        <div className="absolute left-10 bottom-10 z-20 flex flex-col gap-1.5 border border-primary/50 bg-background/95 p-4 text-[10px] rounded-lg shadow-lg max-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-sm">
          <div className="font-bold border-b border-border/50 pb-1 text-foreground">
            {hoveredDevice.name}
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Type:</span>
            <span className="capitalize text-primary font-bold">{hoveredDevice.type}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Room:</span>
            <span className="capitalize text-foreground">{hoveredDevice.room.replace("Room", " Room")}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Status:</span>
            <span
              className={cn(
                "font-bold uppercase",
                hoveredDevice.status ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {hoveredDevice.status ? "ON" : "OFF"}
            </span>
          </div>
        </div>
      )}

      {/* Viewport Canvas Container */}
      <div
        ref={mountRef}
        className="relative flex-1 min-h-[480px] overflow-hidden border border-border/40 bg-background-base rounded-lg"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full outline-none block" />

        {/* Room Annotations Overlays */}
        {showAnnotations && (
          <>
            <div
              ref={drawingRoomRef}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 select-none border border-primary/30 bg-background/80 px-2.5 py-1 text-[9px] font-bold tracking-wider text-primary uppercase rounded shadow-lg backdrop-blur-sm transition-opacity duration-150"
              style={{ left: "0px", top: "0px", display: "none" }}
            >
              Drawing Room
            </div>
            <div
              ref={workRoom1Ref}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 select-none border border-primary/30 bg-background/80 px-2.5 py-1 text-[9px] font-bold tracking-wider text-primary uppercase rounded shadow-lg backdrop-blur-sm transition-opacity duration-150"
              style={{ left: "0px", top: "0px", display: "none" }}
            >
              Work Room 1
            </div>
            <div
              ref={workRoom2Ref}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 select-none border border-primary/30 bg-background/80 px-2.5 py-1 text-[9px] font-bold tracking-wider text-primary uppercase rounded shadow-lg backdrop-blur-sm transition-opacity duration-150"
              style={{ left: "0px", top: "0px", display: "none" }}
            >
              Work Room 2
            </div>
          </>
        )}

        {/* Orbit Controls HUD */}
        <div className="absolute left-4 top-4 z-20 flex flex-col gap-1.5 border border-border/70 bg-background/90 p-4 text-[10px] rounded-lg shadow-lg backdrop-blur-sm">
          <div className="mb-1 border-b border-border/40 pb-1 text-center font-bold tracking-wider text-muted-foreground uppercase">
            Orbit Controls
          </div>
          <div className="flex flex-col gap-1 text-muted-foreground font-mono">
            <div className="flex gap-2 justify-between">
              <span>Rotate:</span>
              <span className="text-primary font-bold">{viewMode === "iso" ? "Left Click + Drag" : "LOCKED"}</span>
            </div>
            <div className="flex gap-2 justify-between">
              <span>Pan:</span>
              <span className="text-primary font-bold">Right Click + Drag</span>
            </div>
            <div className="flex gap-2 justify-between">
              <span>Zoom:</span>
              <span className="text-primary font-bold">Scroll Wheel</span>
            </div>
            <div className="mt-2 border-t border-border/40 pt-2 text-[9px] text-center text-primary/75">
              Click devices directly to toggle state
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { FloorplanViewer }
