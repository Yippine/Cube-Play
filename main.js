// Three.js 魔術方塊應用 - 入口文件
// Formula: FunctionalSystem = Scene3D + Cube3x3x3 + OrbitControls + AnimationLoop

// 檢查 Three.js 是否載入成功
if (typeof THREE === 'undefined') {
    console.error('Three.js 未成功載入！');
    alert('Three.js 載入失敗，請檢查網路連線或 CDN 可用性。');
}

console.log('Three.js 版本:', THREE.REVISION);
console.log('應用初始化中...');

// ========== 模組 1: SceneManager - 場景管理 ==========
// Formula: Scene3D = Camera + Lights + Renderer

let scene, camera, renderer, controls;
let cubeGroup;

function initScene() {
    // 創建場景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // 創建相機 - PerspectiveCamera(fov, aspect, near, far)
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // 創建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 添加光源 - 環境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 添加光源 - 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    console.log('✓ Scene3D 初始化完成');
}

// ========== 模組 2: CubeBuilder - 魔術方塊建構 ==========
// Formula: Cube3x3x3 = ∫[i=0->26](Cubie(Geometry × Material × Position))

function buildRubiksCube() {
    cubeGroup = new THREE.Group();

    // 魔術方塊標準配色
    // 白=上(+Y), 黃=下(-Y), 紅=前(+Z), 橙=後(-Z), 綠=右(+X), 藍=左(-X)
    const faceColors = {
        white: 0xffffff,   // 上面
        yellow: 0xffff00,  // 下面
        red: 0xff0000,     // 前面
        orange: 0xff8800,  // 後面
        green: 0x00ff00,   // 右面
        blue: 0x0000ff     // 左面
    };

    const cubeSize = 0.95; // 小方塊大小（留 0.05 間隙）
    const spacing = 1.0;   // 方塊間距

    // 生成 3×3×3 = 27 個小方塊
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                // 創建小方塊幾何體
                const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

                // 為每個面創建不同顏色的材質
                const materials = [
                    new THREE.MeshStandardMaterial({ color: x === 1 ? faceColors.green : 0x000000 }),  // 右面
                    new THREE.MeshStandardMaterial({ color: x === -1 ? faceColors.blue : 0x000000 }),   // 左面
                    new THREE.MeshStandardMaterial({ color: y === 1 ? faceColors.white : 0x000000 }),   // 上面
                    new THREE.MeshStandardMaterial({ color: y === -1 ? faceColors.yellow : 0x000000 }), // 下面
                    new THREE.MeshStandardMaterial({ color: z === 1 ? faceColors.red : 0x000000 }),     // 前面
                    new THREE.MeshStandardMaterial({ color: z === -1 ? faceColors.orange : 0x000000 })  // 後面
                ];

                const cube = new THREE.Mesh(geometry, materials);
                cube.position.set(x * spacing, y * spacing, z * spacing);

                // 添加黑色邊框
                const edges = new THREE.EdgesGeometry(geometry);
                const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
                const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
                cube.add(edgeLines);

                cubeGroup.add(cube);
            }
        }
    }

    scene.add(cubeGroup);
    console.log('✓ Cube3x3x3 建構完成 (27 個小方塊)');
}

// ========== 模組 3: ControlManager - 交互控制 ==========
// Formula: OrbitControls(target, enableDamping)

function initControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 15;

    console.log('✓ OrbitControls 初始化完成');
}

// ========== 模組 4: RenderLoop - 渲染循環 ==========
// Formula: AnimationLoop = requestAnimationFrame -> controls.update -> renderer.render

function animate() {
    requestAnimationFrame(animate);

    // 更新控制器（阻尼效果需要）
    controls.update();

    // 渲染場景
    renderer.render(scene, camera);
}

// ========== 響應式設計 ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========== 應用初始化 ==========
// Formula: Init = SceneSetup -> CubeModeling -> ControlsIntegration -> RenderLoopStart

function init() {
    console.log('========== 魔術方塊應用啟動 ==========');
    initScene();
    buildRubiksCube();
    initControls();
    animate();
    console.log('========== 應用運行中 (60 FPS) ==========');
}

// 等待 DOM 載入完成後初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}