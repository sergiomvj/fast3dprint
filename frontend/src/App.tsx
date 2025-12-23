import { useState, Suspense, useEffect, useMemo } from 'react'
import { Canvas, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, Stage, Text3D, Center } from '@react-three/drei'
import { Box, Type, Image as ImageIcon, Shapes, Download, Loader2 } from 'lucide-react'
import { STLExporter, PLYLoader } from 'three-stdlib'


function GeneratedModel({ url, scale = 1 }: { url: string, scale?: number }) {
  // useLoader expects the loader class and the url
  const geometry = useLoader(PLYLoader, url)

  // Clean up geometry on unmount
  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  // Center geometry logic can be handled by <Center> but helpful to normalize
  useMemo(() => {
    geometry.computeVertexNormals()
    geometry.center()
  }, [geometry])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} scale={[scale, scale, scale]}>
      <meshStandardMaterial color="lightgray" roughness={0.5} metalness={0.5} vertexColors={false} />
    </mesh>
  )
}

function SceneContent({
  mode,
  loading,
  generatedModelUrl,
  textValue,
  baseTextValue,
  textDepth,
  fontSize,
  letterSpacing,
  baseTextDepth,
  baseFontSize,
  baseLetterSpacing,

  shapeType,
  shapeDims,
  selectedFont
}: {
  mode: string;
  loading: boolean;
  generatedModelUrl: string | null;
  textValue: string;
  baseTextValue: string;
  textDepth: number;
  fontSize: number;
  letterSpacing: number;
  baseTextDepth: number;
  baseFontSize: number;
  baseLetterSpacing: number;
  shapeType: string;
  shapeDims: { w: number, h: number, d: number };
  selectedFont: string;
}) {
  const scale = 10;
  const w = shapeDims.w * scale;
  const h = shapeDims.h * scale;
  const d = shapeDims.d * scale;
  const tDepth = textDepth * scale;
  const fSize = fontSize * scale;
  const bDepth = baseTextDepth * scale;
  const bSize = baseFontSize * scale;

  return (
    <Stage environment="city" intensity={0.6} adjustCamera={true}>
      {mode === 'ai' && (
        <>
          {/* If loading show placeholder box pulsing */}
          {loading && (
            <mesh>
              <boxGeometry args={[50, 50, 50]} />
              <meshStandardMaterial color="#333" wireframe />
            </mesh>
          )}

          {/* If we have a model and not loading */}
          {!loading && generatedModelUrl && (
            <Suspense fallback={null}>
              <Center>
                <GeneratedModel url={generatedModelUrl} scale={100} />
              </Center>
            </Suspense>
          )}

          {/* Initial state placeholder if nothing generated yet and not loading */}
          {!loading && !generatedModelUrl && (
            <mesh>
              <boxGeometry args={[10, 10, 10]} />
              <meshStandardMaterial color="#222" transparent opacity={0.5} />
            </mesh>
          )}
        </>
      )}

      {mode === 'image' && (
        <mesh>
          <boxGeometry args={[50, 50, 50]} />
          <meshStandardMaterial color={loading ? "orange" : "cyan"} roughness={0.3} metalness={0.8} />
        </mesh>
      )}

      {mode === 'text' && (
        <Suspense fallback={null}>
          <Center top>
            <Text3D
              font={selectedFont}
              size={fSize}
              height={tDepth}
              letterSpacing={letterSpacing}
              curveSegments={12}
              bevelEnabled
              bevelThickness={2}
              bevelSize={1}
              bevelOffset={0}
              bevelSegments={3}
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
          {shapeType === 'hexagon' && (
            <mesh>
              <cylinderGeometry args={[w / 2, w / 2, h, 6]} />
              <meshStandardMaterial color="cyan" roughness={0.3} metalness={0.8} />
            </mesh>
          )}
          {shapeType === 'trophy' && (
            <group>
              <mesh position={[0, d / 2, 0]}>
                <boxGeometry args={[w + 20, d, 40]} />
                <meshStandardMaterial color="#333" roughness={0.5} metalness={0.5} />
              </mesh>
              <mesh position={[0, d + (h / 2), 0]}>
                <boxGeometry args={[w, h, 10]} />
                <meshStandardMaterial color="gold" roughness={0.2} metalness={1} />
              </mesh>
              <Suspense fallback={null}>
                <Center position={[0, d + (h / 2), 5]} disableZ>
                  <Text3D
                    font={selectedFont}
                    size={fSize}
                    height={tDepth}
                    letterSpacing={letterSpacing}
                  >
                    {textValue || "Trophy"}
                    <meshStandardMaterial color="white" />
                  </Text3D>
                </Center>
              </Suspense>
              {baseTextValue && (
                <Suspense fallback={null}>
                  <Center position={[0, d / 2, 20]} disableZ>
                    <Text3D
                      font={selectedFont}
                      size={bSize}
                      height={bDepth}
                      letterSpacing={baseLetterSpacing}
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
  useEffect(() => {
    if (triggerExport) {
      const exporter = new STLExporter()
      const options = { binary: true } as { binary: true }
      // Export only meshes, ignore helpers/grid
      const result = exporter.parse(scene as any, options)
      const blob = new Blob([result.buffer as ArrayBuffer], { type: 'application/octet-stream' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'fast3dprint_model.stl'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTriggerExport(false)
    }
  }, [triggerExport, scene, setTriggerExport])
  return null
}

function App() {
  const [mode, setMode] = useState<'ai' | 'text' | 'image' | 'shapes'>('ai')

  // AI State
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null)

  // Text State
  const [textValue, setTextValue] = useState('Fast3D')
  const [textDepth, setTextDepth] = useState(0.5)
  const [fontSize, setFontSize] = useState(3)
  const [letterSpacing, setLetterSpacing] = useState(0.1)

  // Base Text Settings (Trophy)
  const [baseTextValue, setBaseTextValue] = useState('1st Place')
  const [baseTextDepth, setBaseTextDepth] = useState(0.5)
  const [baseFontSize, setBaseFontSize] = useState(2)
  const [baseLetterSpacing, setBaseLetterSpacing] = useState(0.1)

  // Font State
  const fonts = {
    'Helvetica': 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
    'Gentilis': 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json',
    'Droid Sans': 'https://threejs.org/examples/fonts/droid/droid_sans_regular.typeface.json',
    'Optimer': 'https://threejs.org/examples/fonts/optimer_regular.typeface.json'
  }
  const [selectedFont, setSelectedFont] = useState(fonts['Helvetica'])

  // Image State
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)

  // Shapes
  const [shapeType, setShapeType] = useState<'cube' | 'cylinder' | 'trophy'>('cube')
  const [shapeDims, setShapeDims] = useState({ w: 10, h: 10, d: 5 })

  const [triggerExport, setTriggerExport] = useState(false)

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedModelUrl(null); // Reset previous model
    try {
      if (mode === 'ai') {
        if (!prompt) return;
        const response = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, steps: 64, guidance: 15.0 }),
        });
        const data = await response.json();

        if (data.result && data.result.status === 'success') {
          // Construct full URL
          // Backend returns like /static/uuid.ply
          const fullUrl = `http://localhost:8000${data.result.model_url}`;
          setGeneratedModelUrl(fullUrl);
        } else {
          console.error("Generation failed or returned unexpected format", data);
          alert("Generation failed. See console.");
        }

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
      alert("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  const TextControls = ({
    title,
    _fontSize, _setFontSize,
    _depth, _setDepth,
    _spacing, _setSpacing
  }: {
    title: string;
    _fontSize: number, _setFontSize: (v: number) => void;
    _depth: number, _setDepth: (v: number) => void;
    _spacing: number, _setSpacing: (v: number) => void;
  }) => (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 mt-2">
      <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{title}</label>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Size</span><span>{_fontSize} cm</span>
        </div>
        <input type="range" min="0.5" max="10" step="0.5" value={_fontSize} onChange={(e) => _setFontSize(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Thickness</span><span>{_depth} cm</span>
        </div>
        <input type="range" min="0.1" max="5" step="0.1" value={_depth} onChange={(e) => _setDepth(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Spacing</span><span>{_spacing}</span>
        </div>
        <input type="range" min="-0.5" max="2" step="0.1" value={_spacing} onChange={(e) => _setSpacing(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-900 text-white font-sans">
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

      <main className="flex flex-1 overflow-hidden">
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
              <textarea className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. a futuristic chair" />
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2 font-medium disabled:opacity-50 hover:bg-cyan-500 transition-all"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Generating..." : "Generate 3D Model"}
              </button>
              <p className="text-xs text-slate-500">Note: Generation takes 10-20 seconds on GPU.</p>
            </div>
          )}

          {mode === 'text' && (
            <div className="flex flex-col gap-4">
              <label className="block text-sm font-medium text-slate-400">Text Content</label>
              <input type="text" className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none" value={textValue} onChange={(e) => setTextValue(e.target.value)} />

              <label className="block text-sm font-medium text-slate-400">Font Family</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white focus:border-cyan-500 outline-none"
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
              >
                {Object.entries(fonts).map(([name, url]) => (
                  <option key={name} value={url}>{name}</option>
                ))}
              </select>

              <TextControls
                title="Generic Text Settings"
                _fontSize={fontSize} _setFontSize={setFontSize}
                _depth={textDepth} _setDepth={setTextDepth}
                _spacing={letterSpacing} _setSpacing={setLetterSpacing}
              />
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
                <option value="hexagon">Hexagon Prism</option>
                <option value="trophy">Trophy</option>
              </select>

              <label className="block text-sm font-medium text-slate-400">Dimensions (cm)</label>
              <div className="flex gap-2">
                <input type="number" value={shapeDims.w} onChange={(e) => setShapeDims({ ...shapeDims, w: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="W" />
                <input type="number" value={shapeDims.h} onChange={(e) => setShapeDims({ ...shapeDims, h: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="H" />
                <input type="number" value={shapeDims.d} onChange={(e) => setShapeDims({ ...shapeDims, d: parseFloat(e.target.value) })} className="w-full rounded-lg bg-black/20 p-2 text-white" placeholder="D" />
              </div>

              {shapeType === 'trophy' && (
                <>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-slate-400">Plaque Text (Top)</label>
                    <input type="text" className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white mt-1" value={textValue} onChange={(e) => setTextValue(e.target.value)} />
                    <TextControls
                      title="Plaque Text Settings"
                      _fontSize={fontSize} _setFontSize={setFontSize}
                      _depth={textDepth} _setDepth={setTextDepth}
                      _spacing={letterSpacing} _setSpacing={setLetterSpacing}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-slate-400">Base Text (Bottom)</label>
                    <input type="text" className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white mt-1" value={baseTextValue} onChange={(e) => setBaseTextValue(e.target.value)} />
                    <TextControls
                      title="Base Text Settings"
                      _fontSize={baseFontSize} _setFontSize={setBaseFontSize}
                      _depth={baseTextDepth} _setDepth={setBaseTextDepth}
                      _spacing={baseLetterSpacing} _setSpacing={setBaseLetterSpacing}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950">
          <Canvas shadows camera={{ position: [50, 50, 50], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <fog attach="fog" args={['#0f172a', 50, 300]} />
            <SceneContent
              mode={mode}
              loading={loading}
              generatedModelUrl={generatedModelUrl}
              textValue={textValue}
              baseTextValue={baseTextValue}
              textDepth={textDepth}
              fontSize={fontSize}
              letterSpacing={letterSpacing}
              baseTextDepth={baseTextDepth}
              baseFontSize={baseFontSize}
              baseLetterSpacing={baseLetterSpacing}
              shapeType={shapeType}
              shapeDims={shapeDims}
              selectedFont={selectedFont}
            />
            <Exporter triggerExport={triggerExport} setTriggerExport={setTriggerExport} />
            <OrbitControls makeDefault autoRotate={loading} />
          </Canvas>
          <div className="absolute bottom-4 left-4 text-xs text-slate-500 select-none pointer-events-none">
            {mode === 'ai' ? 'Powered by OpenAI Shap-E' : 'Simple Shapes & Text Mode'}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
