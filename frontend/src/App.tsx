import { useState, Suspense, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Stage, Text3D, Center } from '@react-three/drei'
import { Box, Send, Type, Image as ImageIcon, Upload, Shapes, Download } from 'lucide-react'
import { STLExporter } from 'three-stdlib'
import * as THREE from 'three'

function SceneContent({
  mode,
  loading,
  textValue,
  textDepth,
  shapeType,
  shapeDims
}: {
  mode: string;
  loading: boolean;
  textValue: string;
  textDepth: number;
  shapeType: string;
  shapeDims: { w: number, h: number, d: number };
}) {
  return (
    <Stage environment="city" intensity={0.6}>
      {mode === 'ai' && (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={loading ? "orange" : "cyan"} roughness={0.3} metalness={0.8} />
        </mesh>
      )}

      {mode === 'image' && (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={loading ? "orange" : "cyan"} roughness={0.3} metalness={0.8} />
        </mesh>
      )}

      {mode === 'text' && (
        <Suspense fallback={null}>
          <Center top>
            <Text3D
              font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
              size={1}
              height={textDepth}
              curveSegments={12}
              bevelEnabled
              bevelThickness={0.02}
              bevelSize={0.02}
              bevelOffset={0}
              bevelSegments={5}
            >
              {textValue}
              <meshStandardMaterial color="cyan" roughness={0.3} metalness={0.8} />
            </Text3D>
          </Center>
        </Suspense>
      )}

      {mode === 'shapes' && (
        <>
          {shapeType === 'cube' && (
            <mesh>
              <boxGeometry args={[shapeDims.w, shapeDims.h, shapeDims.d]} />
              <meshStandardMaterial color="cyan" roughness={0.3} metalness={0.8} />
            </mesh>
          )}
          {shapeType === 'cylinder' && (
            <mesh>
              <cylinderGeometry args={[shapeDims.w / 2, shapeDims.w / 2, shapeDims.h, 32]} />
              <meshStandardMaterial color="cyan" roughness={0.3} metalness={0.8} />
            </mesh>
          )}
          {shapeType === 'trophy' && (
            <group>
              {/* Base */}
              <mesh position={[0, shapeDims.d / 2, 0]}>
                <boxGeometry args={[shapeDims.w + 0.4, shapeDims.d, 1]} />
                <meshStandardMaterial color="#333" roughness={0.5} metalness={0.5} />
              </mesh>
              {/* Plaque */}
              <mesh position={[0, shapeDims.d + (shapeDims.h / 2), 0]}>
                <boxGeometry args={[shapeDims.w, shapeDims.h, 0.2]} />
                <meshStandardMaterial color="gold" roughness={0.2} metalness={1} />
              </mesh>
              {/* Text on Trophy */}
              <Suspense fallback={null}>
                <Center position={[0, shapeDims.d + (shapeDims.h / 2), 0.15]}>
                  <Text3D
                    font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
                    size={Math.min(shapeDims.w, shapeDims.h) * 0.2}
                    height={0.05}
                  >
                    {textValue || "Trophy"}
                    <meshStandardMaterial color="white" />
                  </Text3D>
                </Center>
              </Suspense>
            </group>
          )}
        </>
      )}
    </Stage>
  )
}

function Exporter({ triggerExport, setTriggerExport }: { triggerExport: boolean, setTriggerExport: (v: boolean) => void }) {
  const { scene } = useThree()

  if (triggerExport) {
    const exporter = new STLExporter()
    const result = exporter.parse(scene as any) // Cast to any to avoid strict type issues with STLExporter
    const blob = new Blob([result], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'model.stl'
    link.click()
    setTriggerExport(false)
  }
  return null
}

function App() {
  const [mode, setMode] = useState<'ai' | 'text' | 'image' | 'shapes'>('ai')

  // AI State
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  // Text State
  const [textValue, setTextValue] = useState('Fast3D')
  const [textDepth, setTextDepth] = useState(0.5)

  // Image State
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)

  // Shapes State
  const [shapeType, setShapeType] = useState<'cube' | 'cylinder' | 'trophy'>('cube')
  const [shapeDims, setShapeDims] = useState({ w: 1, h: 1, d: 1 })

  // Export State
  const [triggerExport, setTriggerExport] = useState(false)

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (mode === 'ai') {
        if (!prompt) return;
        const response = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        await response.json();
      } else if (mode === 'image') {
        if (!frontImage) return;
        const formData = new FormData();
        formData.append('front_image', frontImage);
        if (backImage) formData.append('back_image', backImage);

        const response = await fetch('http://localhost:8000/generate-image', {
          method: 'POST',
          body: formData,
        });
        await response.json();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-900 text-white font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-white/10 bg-slate-950/50 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Box className="h-6 w-6 text-cyan-400" />
          <span className="text-xl font-bold tracking-tight">Fast3dPrint</span>
        </div>
        <button
          onClick={() => setTriggerExport(true)}
          className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download STL
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel: Inputs */}
        <div className="w-80 border-r border-white/10 bg-slate-950/30 p-6 flex flex-col gap-6 overflow-y-auto">

          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-black/20 p-1">
            <button onClick={() => setMode('ai')} className={`flex-1 flex items-center justify-center rounded-md py-2 transition-all ${mode === 'ai' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`} title="AI Generate"><Box className="h-4 w-4" /></button>
            <button onClick={() => setMode('text')} className={`flex-1 flex items-center justify-center rounded-md py-2 transition-all ${mode === 'text' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`} title="3D Text"><Type className="h-4 w-4" /></button>
            <button onClick={() => setMode('image')} className={`flex-1 flex items-center justify-center rounded-md py-2 transition-all ${mode === 'image' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`} title="Image to 3D"><ImageIcon className="h-4 w-4" /></button>
            <button onClick={() => setMode('shapes')} className={`flex-1 flex items-center justify-center rounded-md py-2 transition-all ${mode === 'shapes' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`} title="Shapes"><Shapes className="h-4 w-4" /></button>
          </div>

          {mode === 'ai' && (
            <div className="flex flex-col gap-4">
              <label className="block text-sm font-medium text-slate-400">Describe object</label>
              <textarea className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
              <button onClick={handleGenerate} disabled={loading || !prompt} className="rounded-lg bg-cyan-600 py-2 font-medium disabled:opacity-50">Generate</button>
            </div>
          )}

          {mode === 'text' && (
            <div className="flex flex-col gap-4">
              <label className="block text-sm font-medium text-slate-400">Text Content</label>
              <input type="text" className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
              <label className="block text-sm font-medium text-slate-400">Depth: {textDepth}</label>
              <input type="range" min="0.1" max="5" step="0.1" value={textDepth} onChange={(e) => setTextDepth(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
            </div>
          )}

          {mode === 'image' && (
            <div className="flex flex-col gap-4">
              <div className="border-2 border-dashed border-white/10 p-4 rounded-lg text-center cursor-pointer hover:bg-white/5 relative">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setFrontImage(e.target.files[0])} />
                <span className="text-sm text-slate-400">{frontImage ? frontImage.name : "Upload Front Image"}</span>
              </div>
              <div className="border-2 border-dashed border-white/10 p-4 rounded-lg text-center cursor-pointer hover:bg-white/5 relative">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setBackImage(e.target.files[0])} />
                <span className="text-sm text-slate-400">{backImage ? backImage.name : "Upload Back Image"}</span>
              </div>
              <button onClick={handleGenerate} disabled={loading || !frontImage} className="rounded-lg bg-cyan-600 py-2 font-medium disabled:opacity-50">Generate</button>
            </div>
          )}

          {mode === 'shapes' && (
            <div className="flex flex-col gap-4">
              <label className="block text-sm font-medium text-slate-400">Shape Type</label>
              <select
                value={shapeType}
                onChange={(e) => setShapeType(e.target.value as any)}
                className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none"
              >
                <option value="cube">Cube / Box</option>
                <option value="cylinder">Cylinder</option>
                <option value="trophy">Trophy</option>
              </select>

              <label className="block text-sm font-medium text-slate-400">Dimensions (W / H / D)</label>
              <div className="flex gap-2">
                <input type="number" value={shapeDims.w} onChange={(e) => setShapeDims({ ...shapeDims, w: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="W" />
                <input type="number" value={shapeDims.h} onChange={(e) => setShapeDims({ ...shapeDims, h: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="H" />
                <input type="number" value={shapeDims.d} onChange={(e) => setShapeDims({ ...shapeDims, d: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="D" />
              </div>

              {shapeType === 'trophy' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mt-2">Plaque Text</label>
                  <input type="text" className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Panel: 3D Viewer */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950">
          <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
            <fog attach="fog" args={['#0f172a', 10, 30]} />
            <SceneContent
              mode={mode}
              loading={loading}
              textValue={textValue}
              textDepth={textDepth}
              shapeType={shapeType}
              shapeDims={shapeDims}
            />
            <Exporter triggerExport={triggerExport} setTriggerExport={setTriggerExport} />
            <OrbitControls makeDefault autoRotate={loading} />
          </Canvas>

          <div className="absolute bottom-4 left-4 text-xs text-slate-500">
            Use mouse to rotate, zoom, and pan.
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
