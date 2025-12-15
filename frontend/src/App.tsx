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
  baseTextValue,
  textDepth,
  fontSize,
  letterSpacing,
  shapeType,
  shapeDims
}: {
  mode: string;
  loading: boolean;
  textValue: string;
  baseTextValue: string;
  textDepth: number;
  fontSize: number;
  letterSpacing: number;
  shapeType: string;
  shapeDims: { w: number, h: number, d: number };
}) {
  // Convert CM to MM (1 unit = 1mm)
  const scale = 10;

  // Dimensions in MM
  const w = shapeDims.w * scale;
  const h = shapeDims.h * scale;
  const d = shapeDims.d * scale;

  // Text Props in MM/Units
  const tDepth = textDepth * scale;
  // Base font size depends on context, but let's assume input 1.0 = 10mm (1cm) base size
  const fSize = fontSize * scale;

  return (
    <Stage environment="city" intensity={0.6}>
      {mode === 'ai' && (
        <mesh>
          <boxGeometry args={[100, 100, 100]} />
          <meshStandardMaterial color={loading ? "orange" : "cyan"} roughness={0.3} metalness={0.8} />
        </mesh>
      )}

      {mode === 'image' && (
        <mesh>
          <boxGeometry args={[100, 100, 100]} />
          <meshStandardMaterial color={loading ? "orange" : "cyan"} roughness={0.3} metalness={0.8} />
        </mesh>
      )}

      {mode === 'text' && (
        <Suspense fallback={null}>
          <Center top>
            <Text3D
              font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
              size={fSize}
              height={tDepth}
              letterSpacing={letterSpacing}
              curveSegments={12}
              bevelEnabled
              bevelThickness={2}
              bevelSize={2}
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
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color="cyan" roughness={0.3} metalness={0.8} />
            </mesh>
          )}
          {shapeType === 'cylinder' && (
            <mesh>
              <cylinderGeometry args={[w / 2, w / 2, h, 64]} />
              <meshStandardMaterial color="cyan" roughness={0.3} metalness={0.8} />
            </mesh>
          )}
          {shapeType === 'trophy' && (
            <group>
              {/*
                   TROPHY STRUCTURE (MM)
                   - Base Height = d
                   - Plaque Height = h
                   - Width = w
                   - Base Depth (Thickness) = 40mm (Fixed for stability)
                   - Plaque Thickness = 10mm
                */}

              {/* Base Mesh */}
              <mesh position={[0, d / 2, 0]}>
                <boxGeometry args={[w + 20, d, 40]} />
                <meshStandardMaterial color="#333" roughness={0.5} metalness={0.5} />
              </mesh>

              {/* Plaque Mesh */}
              <mesh position={[0, d + (h / 2), 0]}>
                <boxGeometry args={[w, h, 10]} />
                <meshStandardMaterial color="gold" roughness={0.2} metalness={1} />
              </mesh>

              {/* Plaque Text */}
              <Suspense fallback={null}>
                <Center position={[0, d + (h / 2), 6]} > {/* z = 5 (half thickness) + 1 (offset) */}
                  <Text3D
                    font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
                    size={fSize} // User controlled size
                    height={tDepth} // User controlled depth
                    letterSpacing={letterSpacing}
                  >
                    {textValue || "Trophy"}
                    <meshStandardMaterial color="white" />
                  </Text3D>
                </Center>
              </Suspense>

              {/* Base Text */}
              {baseTextValue && (
                <Suspense fallback={null}>
                  <Center position={[0, d / 2, 21]}> {/* z = 20 (half base thickness) + 1 */}
                    <Text3D
                      font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
                      size={fSize * 0.6} // Scale base text relative to global settings, or standard? using relative for now
                      height={tDepth}
                      letterSpacing={letterSpacing}
                    >
                      {baseTextValue}
                      <meshStandardMaterial color="white" />
                    </Text3D>
                  </Center>
                </Suspense>
              )}
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
    const result = exporter.parse(scene as any)
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
  // Units: CM
  const [textDepth, setTextDepth] = useState(0.5) // Espessura
  const [fontSize, setFontSize] = useState(3) // Tamanho (3cm default)
  const [letterSpacing, setLetterSpacing] = useState(0.1) // Largura (spacing)

  // Image State
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)

  // Shapes State
  const [shapeType, setShapeType] = useState<'cube' | 'cylinder' | 'trophy'>('cube')
  // Default dims in CM
  const [shapeDims, setShapeDims] = useState({ w: 10, h: 10, d: 5 })
  const [baseTextValue, setBaseTextValue] = useState('1st Place')

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

  const TextControls = () => (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 mt-2">
      <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Text Settings</label>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Size (Tamanho)</span>
          <span>{fontSize} cm</span>
        </div>
        <input type="range" min="1" max="10" step="0.5" value={fontSize} onChange={(e) => setFontSize(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Thickness (Espessura)</span>
          <span>{textDepth} cm</span>
        </div>
        <input type="range" min="0.1" max="5" step="0.1" value={textDepth} onChange={(e) => setTextDepth(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Spacing (Largura)</span>
          <span>{letterSpacing}</span>
        </div>
        <input type="range" min="-0.5" max="2" step="0.1" value={letterSpacing} onChange={(e) => setLetterSpacing(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
      </div>
    </div>
  )

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
              <div className="border border-dashed border-white/10 my-2" />
              <TextControls />
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

              <label className="block text-sm font-medium text-slate-400">Dimensions (cm) - W / H / D</label>
              <div className="flex gap-2">
                <input type="number" value={shapeDims.w} onChange={(e) => setShapeDims({ ...shapeDims, w: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="W" />
                <input type="number" value={shapeDims.h} onChange={(e) => setShapeDims({ ...shapeDims, h: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="H" />
                <input type="number" value={shapeDims.d} onChange={(e) => setShapeDims({ ...shapeDims, d: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="D" />
              </div>

              {shapeType === 'trophy' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mt-2">Plaque Text (Top)</label>
                    <input type="text" className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mt-2">Base Text (Bottom)</label>
                    <input type="text" className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none" value={baseTextValue} onChange={(e) => setBaseTextValue(e.target.value)} />
                  </div>

                  <TextControls />
                </>
              )}
            </div>
          )}

        </div>

        {/* Right Panel: 3D Viewer */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950">
          <Canvas shadows camera={{ position: [200, 200, 200], fov: 50 }}>
            <fog attach="fog" args={['#0f172a', 100, 500]} />
            <SceneContent
              mode={mode}
              loading={loading}
              textValue={textValue}
              baseTextValue={baseTextValue}
              textDepth={textDepth}
              fontSize={fontSize}
              letterSpacing={letterSpacing}
              shapeType={shapeType}
              shapeDims={shapeDims}
            />
            <Exporter triggerExport={triggerExport} setTriggerExport={setTriggerExport} />
            <OrbitControls makeDefault autoRotate={loading} />
          </Canvas>

          <div className="absolute bottom-4 left-4 text-xs text-slate-500">
            1 unit = 1 mm. Inputs are in CM.
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
