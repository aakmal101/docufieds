'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Country {
  id: string
  name: string
  code: string
  continent: string
  position: [number, number, number]
  color: string
}

interface ThreeDMapProps {
  onCountrySelect: (country: Country) => void
  selectedCountry?: string
}

const countries: Country[] = [
  // North America
  { id: 'usa', name: 'United States', code: 'US', continent: 'North America', position: [-2, 2, 0], color: '#3b82f6' },
  { id: 'canada', name: 'Canada', code: 'CA', continent: 'North America', position: [-2, 3, 0], color: '#ef4444' },
  { id: 'mexico', name: 'Mexico', code: 'MX', continent: 'North America', position: [-1.5, 1, 0], color: '#10b981' },
  
  // Europe
  { id: 'uk', name: 'United Kingdom', code: 'GB', continent: 'Europe', position: [0, 2.5, 0], color: '#8b5cf6' },
  { id: 'france', name: 'France', code: 'FR', continent: 'Europe', position: [0.5, 2, 0], color: '#f59e0b' },
  { id: 'germany', name: 'Germany', code: 'DE', continent: 'Europe', position: [1, 2.2, 0], color: '#06b6d4' },
  { id: 'italy', name: 'Italy', code: 'IT', continent: 'Europe', position: [1.2, 1.8, 0], color: '#84cc16' },
  { id: 'spain', name: 'Spain', code: 'ES', continent: 'Europe', position: [0.2, 1.5, 0], color: '#f97316' },
  
  // Asia
  { id: 'japan', name: 'Japan', code: 'JP', continent: 'Asia', position: [4, 2, 0], color: '#ec4899' },
  { id: 'china', name: 'China', code: 'CN', continent: 'Asia', position: [3.5, 1.8, 0], color: '#dc2626' },
  { id: 'india', name: 'India', code: 'IN', continent: 'Asia', position: [2.8, 1, 0], color: '#059669' },
  { id: 'singapore', name: 'Singapore', code: 'SG', continent: 'Asia', position: [3.2, 0.5, 0], color: '#7c3aed' },
  { id: 'thailand', name: 'Thailand', code: 'TH', continent: 'Asia', position: [3, 0.8, 0], color: '#ea580c' },
  { id: 'malaysia', name: 'Malaysia', code: 'MY', continent: 'Asia', position: [3.1, 0.3, 0], color: '#0891b2' },
  
  // Oceania
  { id: 'australia', name: 'Australia', code: 'AU', continent: 'Oceania', position: [4, -1, 0], color: '#be185d' },
  { id: 'newzealand', name: 'New Zealand', code: 'NZ', continent: 'Oceania', position: [4.5, -1.5, 0], color: '#0d9488' },
  
  // Middle East
  { id: 'uae', name: 'United Arab Emirates', code: 'AE', continent: 'Middle East', position: [2, 1.2, 0], color: '#7c2d12' },
  { id: 'saudi', name: 'Saudi Arabia', code: 'SA', continent: 'Middle East', position: [1.8, 1.5, 0], color: '#1e40af' },
  
  // Africa
  { id: 'southafrica', name: 'South Africa', code: 'ZA', continent: 'Africa', position: [1.5, -0.5, 0], color: '#16a34a' },
]

export default function ThreeDMap({ onCountrySelect, selectedCountry }: ThreeDMapProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const countryMeshesRef = useRef<THREE.Mesh[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    try {
      // Scene setup
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf0f9ff)
      sceneRef.current = scene

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      )
      camera.position.set(0, 0, 8)
      cameraRef.current = camera

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mountRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 10, 5)
      directionalLight.castShadow = true
      scene.add(directionalLight)

      // Create country spheres
      countries.forEach((country) => {
        const geometry = new THREE.SphereGeometry(0.2, 16, 16)
        const material = new THREE.MeshLambertMaterial({ 
          color: country.color,
          transparent: true,
          opacity: 0.8
        })
        
        const sphere = new THREE.Mesh(geometry, material)
        sphere.position.set(...country.position)
        sphere.userData = { country }
        sphere.castShadow = true
        sphere.receiveShadow = true
        
        // Add hover effect
        sphere.onHover = () => {
          sphere.material.opacity = 1
          sphere.scale.setScalar(1.2)
        }
        
        sphere.onLeave = () => {
          sphere.material.opacity = 0.8
          sphere.scale.setScalar(1)
        }
        
        scene.add(sphere)
        countryMeshesRef.current.push(sphere)
      })

      // Mouse interaction
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      const onMouseMove = (event: MouseEvent) => {
        if (!mountRef.current) return
        
        const rect = mountRef.current.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)

        const intersects = raycaster.intersectObjects(countryMeshesRef.current)

        // Reset all spheres
        countryMeshesRef.current.forEach((mesh) => {
          if (mesh.onLeave) mesh.onLeave()
        })

        if (intersects.length > 0) {
          const intersected = intersects[0].object as THREE.Mesh
          if (intersected.onHover) intersected.onHover()
        }
      }

      const onMouseClick = (event: MouseEvent) => {
        if (!mountRef.current) return
        
        const rect = mountRef.current.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)

        const intersects = raycaster.intersectObjects(countryMeshesRef.current)

        if (intersects.length > 0) {
          const intersected = intersects[0].object as THREE.Mesh
          const country = intersected.userData.country as Country
          onCountrySelect(country)
        }
      }

      mountRef.current.addEventListener('mousemove', onMouseMove)
      mountRef.current.addEventListener('click', onMouseClick)

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate)
        
        // Rotate the entire scene slowly
        scene.rotation.y += 0.005
        
        // Update country selection
        countryMeshesRef.current.forEach((mesh) => {
          const country = mesh.userData.country as Country
          if (selectedCountry === country.id) {
            mesh.material.opacity = 1
            mesh.scale.setScalar(1.3)
            mesh.material.color.setHex(0xffd700) // Gold color for selected
          } else {
            mesh.material.opacity = 0.8
            mesh.scale.setScalar(1)
            mesh.material.color.setHex(country.color)
          }
        })
        
        renderer.render(scene, camera)
      }

      animate()
      setIsLoading(false)

      // Cleanup
      return () => {
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement)
        }
        renderer.dispose()
      }
    } catch (err) {
      console.error('3D Map initialization error:', err)
      setError('Failed to load 3D map')
      setIsLoading(false)
    }
  }, [selectedCountry, onCountrySelect])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return

      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (error) {
  return (
      <div className="w-full h-96 border rounded-lg bg-gradient-to-b from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-white text-center">
          <h3 className="text-lg font-semibold mb-2">3D Map Unavailable</h3>
          <p className="text-sm opacity-80">Please use the country list below</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading 3D Map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mountRef} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  )
}