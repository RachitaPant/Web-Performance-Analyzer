"use client";

import { Canvas} from "@react-three/fiber";
import { OrbitControls,useGLTF,useAnimations } from "@react-three/drei";
import { useEffect } from "react";
function Model(){
    const{scene,animations}=useGLTF("/models/model3.glb")
    const { actions } = useAnimations(animations, scene);

    useEffect(() => {
      if (actions) {
        actions[Object.keys(actions)[0]]?.play(); // Play the first animation
      }
    }, [actions]);
    return <primitive object={scene} scale={0.1}/>
}
export default function ModelViewer() {
  return (
    <div className="w-[50%] h-[400px]">
      <Canvas camera={{position:[0,2,100]}}>
      
        <ambientLight intensity={2.5} />
        <directionalLight position={[1, 2, 3]} intensity={1} />

       
        <Model />

        <OrbitControls />
      </Canvas>
    </div>
  );
}
