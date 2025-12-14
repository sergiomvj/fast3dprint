import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Text3D, Center } from '@react-three/drei'
import { Box, Send, Type, Image as ImageIcon, Upload } from 'lucide-react'

function App() {
  const [mode, setMode] = useState<'ai' | 'text' | 'image'>('ai')

  // AI State
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  // Text State
  const [textValue, setTextValue] = useState('Fast3D')
  const [textDepth, setTextDepth] = useState(0.5)

  // Image State
  const [frontImage, setFrontImage] = useState<File | null>(null)
  const [backImage, setBackImage] = useState<File | null>(null)

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
        const data = await response.json();
        console.log("AI Response:", data);
      } else if (mode === 'image') {
        if (!frontImage) return; // Back image optional?
        const formData = new FormData();
        formData.append('front_image', frontImage);
        if (backImage) formData.append('back_image', backImage);

        const response = await fetch('http://localhost:8000/generate-image', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        console.log("Image Response:", data);
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
      </nav>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel: Inputs */}
        <div className="w-80 border-r border-white/10 bg-slate-950/30 p-6 flex flex-col gap-6">

          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-black/20 p-1">
            <button
              onClick={() => setMode('ai')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${mode === 'ai' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              title="AI Generation"
            >
              <Box className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMode('text')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${mode === 'text' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              title="3D Text"
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMode('image')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${mode === 'image' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              title="Image to 3D"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>

          {mode === 'ai' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Describe your object
                </label>
                <textarea
                  className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  rows={4}
                  placeholder="A futuristic cyber helmet..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </div>
          )}

          {mode === 'text' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Text Content
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Depth: {textDepth}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={textDepth}
                  onChange={(e) => setTextDepth(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          )}

          {mode === 'image' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Front Image (Required)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-white/10 bg-black/20 hover:bg-black/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {frontImage ? (
                        <span className="text-sm text-cyan-400 truncate w-32">{frontImage.name}</span>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-4 text-slate-400" />
                          <p className="text-xs text-slate-500">Click to upload</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setFrontImage(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Back Image (Optional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-white/10 bg-black/20 hover:bg-black/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {backImage ? (
                        <span className="text-sm text-cyan-400 truncate w-32">{backImage.name}</span>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-4 text-slate-400" />
                          <p className="text-xs text-slate-500">Click to upload</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setBackImage(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || (mode === 'ai' && !prompt) || (mode === 'image' && !frontImage)}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 mt-auto"
          >
            {loading ? 'Processing...' : (
              <>
                <Send className="h-4 w-4" />
                {mode === 'text' ? 'Update View' : 'Generate 3D'}
              </>
            )}
          </button>
        </div>

        {/* Right Panel: 3D Viewer */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950">
          <Canvas shadows camera={{ position: [4, 4, 10], fov: 50 }}>
            <fog attach="fog" args={['#0f172a', 10, 30]} />
            <Stage environment="city" intensity={0.6}>
              {mode === 'text' ? (
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
              ) : (
                <mesh>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color={loading ? "orange" : "cyan"} roughness={0.3} metalness={0.8} />
                </mesh>
              )}
            </Stage>
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
