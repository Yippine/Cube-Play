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

// ========== 模組 5: ClickDetection - 點擊檢測系統 ==========
// Formula: ClickSystem = Raycaster(Camera, MousePosition) × EventListener(click|mousedown) × LayerIdentifier(Cubie -> FaceLayer) × HighlightRenderer(SelectedLayer)

let raycaster, mouse;
let selectedLayer = null;
let hoveredCubies = [];

function initRaycaster() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 綁定滑鼠點擊事件
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);

    console.log('✓ Raycaster 點擊檢測系統初始化完成');
}

function onMouseMove(event) {
    // 避免在動畫期間響應
    if (isAnimating) return;

    // 轉換為標準化設備座標 (NDC)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 設置射線
    raycaster.setFromCamera(mouse, camera);

    // 檢測交集
    const intersects = raycaster.intersectObjects(cubeGroup.children, true);

    // 清除之前的懸停效果
    clearHoverEffect();

    if (intersects.length > 0) {
        const cubie = intersects[0].object;
        if (cubie.type === 'Mesh') {
            // 識別面層
            const layer = identifyFaceLayer(cubie);
            if (layer) {
                // 應用懸停效果
                applyHoverEffect(layer);
            }
        }
    }
}

function onMouseDown(event) {
    // 避免在動畫期間響應
    if (isAnimating) return;

    // 轉換為標準化設備座標 (NDC)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 設置射線
    raycaster.setFromCamera(mouse, camera);

    // 檢測交集
    const intersects = raycaster.intersectObjects(cubeGroup.children, true);

    if (intersects.length > 0) {
        const cubie = intersects[0].object;
        if (cubie.type === 'Mesh') {
            // 識別面層
            const layer = identifyFaceLayer(cubie);
            if (layer) {
                selectLayer(layer);
                // 開始拖拽檢測
                startDragDetection(event, layer);
            }
        }
    }
}

function identifyFaceLayer(cubie) {
    // Formula: LayerIdentifier = Cubie.position -> dominant_axis -> face_direction
    const pos = cubie.position;
    const threshold = 0.5; // 判斷是否在外層的閾值

    // 判斷主導軸和方向
    if (Math.abs(pos.x - 1) < threshold) {
        return { axis: 'x', direction: 1, name: 'R', cubies: getCubiesInLayer('x', 1) };
    } else if (Math.abs(pos.x + 1) < threshold) {
        return { axis: 'x', direction: -1, name: 'L', cubies: getCubiesInLayer('x', -1) };
    } else if (Math.abs(pos.y - 1) < threshold) {
        return { axis: 'y', direction: 1, name: 'U', cubies: getCubiesInLayer('y', 1) };
    } else if (Math.abs(pos.y + 1) < threshold) {
        return { axis: 'y', direction: -1, name: 'D', cubies: getCubiesInLayer('y', -1) };
    } else if (Math.abs(pos.z - 1) < threshold) {
        return { axis: 'z', direction: 1, name: 'F', cubies: getCubiesInLayer('z', 1) };
    } else if (Math.abs(pos.z + 1) < threshold) {
        return { axis: 'z', direction: -1, name: 'B', cubies: getCubiesInLayer('z', -1) };
    }

    return null;
}

function getCubiesInLayer(axis, value) {
    // Formula: LayerFilter = cubeGroup.children -> filter(cubie.position[axis] === value)
    const threshold = 0.5;
    const cubies = [];

    cubeGroup.children.forEach(child => {
        if (child.type === 'Mesh') {
            const pos = child.position;
            if (axis === 'x' && Math.abs(pos.x - value) < threshold) {
                cubies.push(child);
            } else if (axis === 'y' && Math.abs(pos.y - value) < threshold) {
                cubies.push(child);
            } else if (axis === 'z' && Math.abs(pos.z - value) < threshold) {
                cubies.push(child);
            }
        }
    });

    return cubies;
}

function selectLayer(layer) {
    // 清除之前的選擇
    clearSelection();

    selectedLayer = layer;

    // 應用高亮效果
    applyHighlight(layer.cubies);

    console.log(`✓ 選中面層: ${layer.name} (${layer.cubies.length} 個小方塊)`);
}

function applyHighlight(cubies) {
    cubies.forEach(cubie => {
        cubie.userData.originalEmissive = cubie.userData.originalEmissive || [];

        cubie.material.forEach((mat, index) => {
            if (!cubie.userData.originalEmissive[index]) {
                cubie.userData.originalEmissive[index] = mat.emissive ? mat.emissive.getHex() : 0x000000;
            }
            if (mat.color.getHex() !== 0x000000) {
                mat.emissive = new THREE.Color(0x444444);
                mat.emissiveIntensity = 0.5;
            }
        });
    });
}

function applyHoverEffect(layer) {
    hoveredCubies = layer.cubies;
    hoveredCubies.forEach(cubie => {
        cubie.material.forEach((mat) => {
            if (mat.color.getHex() !== 0x000000) {
                mat.emissive = new THREE.Color(0x222222);
                mat.emissiveIntensity = 0.3;
            }
        });
    });
}

function clearHoverEffect() {
    hoveredCubies.forEach(cubie => {
        if (!selectedLayer || !selectedLayer.cubies.includes(cubie)) {
            cubie.material.forEach((mat) => {
                mat.emissive = new THREE.Color(0x000000);
                mat.emissiveIntensity = 0;
            });
        }
    });
    hoveredCubies = [];
}

function clearSelection() {
    if (selectedLayer) {
        selectedLayer.cubies.forEach(cubie => {
            cubie.material.forEach((mat, index) => {
                const originalEmissive = cubie.userData.originalEmissive?.[index] || 0x000000;
                mat.emissive = new THREE.Color(originalEmissive);
                mat.emissiveIntensity = 0;
            });
        });
        selectedLayer = null;
    }
}

// ========== 模組 6: DragDetection - 拖拽檢測與方向判斷 ==========
// Formula: DragSystem = EventListener(mousedown + mousemove + mouseup) × DragVector(Δx, Δy) × DirectionAlgorithm(Vector -> Axis + Clockwise|CCW) × ThresholdValidation(minDistance)

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragLayer = null;
const DRAG_THRESHOLD = 30; // 最小拖拽距離（像素）

function startDragDetection(event, layer) {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragLayer = layer;

    // 添加拖拽事件監聽
    document.addEventListener('mousemove', onDragMove, false);
    document.addEventListener('mouseup', onDragEnd, false);

    // 禁用 OrbitControls 避免衝突
    controls.enabled = false;
}

function onDragMove(event) {
    if (!isDragging || isAnimating) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 檢查是否達到旋轉閾值
    if (distance < DRAG_THRESHOLD) return;

    // 計算旋轉方向
    const rotationCommand = calculateRotationDirection(dragLayer, deltaX, deltaY);

    if (rotationCommand) {
        // 執行旋轉
        executeRotation(rotationCommand);

        // 重置拖拽狀態
        resetDragState();
    }
}

function onDragEnd() {
    resetDragState();
}

function resetDragState() {
    isDragging = false;
    dragLayer = null;

    // 移除事件監聽
    document.removeEventListener('mousemove', onDragMove, false);
    document.removeEventListener('mouseup', onDragEnd, false);

    // 重新啟用 OrbitControls
    if (!isAnimating) {
        controls.enabled = true;
    }
}

function calculateRotationDirection(layer, deltaX, deltaY) {
    // Formula: DirectionAlgorithm = layer.axis + drag_vector + camera_orientation -> rotation_axis + clockwise_direction
    const axis = layer.axis;
    const name = layer.name;

    // 判斷主導拖拽方向
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    let rotationAxis = axis;
    let direction = 1; // 1 = 順時針 (+90°), -1 = 逆時針 (-90°)

    // 根據面層方向和拖拽向量計算旋轉方向
    if (axis === 'x') {
        // R (右) 或 L (左) 面
        if (isHorizontal) {
            rotationAxis = 'x';
            direction = (name === 'R') ? (deltaX > 0 ? -1 : 1) : (deltaX > 0 ? 1 : -1);
        } else {
            rotationAxis = 'x';
            direction = (name === 'R') ? (deltaY > 0 ? 1 : -1) : (deltaY > 0 ? -1 : 1);
        }
    } else if (axis === 'y') {
        // U (上) 或 D (下) 面
        if (isHorizontal) {
            rotationAxis = 'y';
            direction = (name === 'U') ? (deltaX > 0 ? 1 : -1) : (deltaX > 0 ? -1 : 1);
        } else {
            rotationAxis = 'y';
            direction = (name === 'U') ? (deltaY > 0 ? -1 : 1) : (deltaY > 0 ? 1 : -1);
        }
    } else if (axis === 'z') {
        // F (前) 或 B (後) 面
        if (isHorizontal) {
            rotationAxis = 'z';
            direction = (name === 'F') ? (deltaX > 0 ? -1 : 1) : (deltaX > 0 ? 1 : -1);
        } else {
            rotationAxis = 'z';
            direction = (name === 'F') ? (deltaY > 0 ? 1 : -1) : (deltaY > 0 ? -1 : 1);
        }
    }

    return {
        layer: layer,
        axis: rotationAxis,
        direction: direction,
        angle: direction * Math.PI / 2 // ±90°
    };
}

// ========== 模組 7: RotationMath - 旋轉數學邏輯 ==========
// Formula: RotationLogic = FaceLayerFilter(9 cubies) × RotationMatrix(axis, ±90°) × Transform(cubie.position) × Quaternion(cubie.rotation) × StateUpdate(cubeState)

let isAnimating = false;

function executeRotation(rotationCommand, isUndoAction = false) {
    if (isAnimating) return;

    console.log(`執行旋轉: ${rotationCommand.layer.name} 軸=${rotationCommand.axis} 方向=${rotationCommand.direction > 0 ? '順時針' : '逆時針'}`);

    // 開啟動畫鎖定
    isAnimating = true;

    // 新增：首次旋轉時自動啟動計時器（僅在 playing 狀態）
    if (!isUndoAction && cubeState.gameState === 'playing' && cubeState.timerStartTime === null) {
        cubeState.startTimer();
    }

    // 新增：增加步數計數（還原操作不計入步數）
    if (!isUndoAction && cubeState.gameState === 'playing') {
        cubeState.incrementMoveCount();
    }

    // 創建臨時旋轉群組
    const tempGroup = new THREE.Group();
    scene.add(tempGroup);

    // 添加面層小方塊到臨時群組
    const cubies = rotationCommand.layer.cubies;
    const cubieParents = [];

    cubies.forEach(cubie => {
        // 保存原始父物件
        cubieParents.push(cubie.parent);

        // 保存世界座標
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        cubie.getWorldPosition(worldPos);
        cubie.getWorldQuaternion(worldQuat);

        // 從原父物件移除
        cubie.parent.remove(cubie);

        // 設置世界座標
        cubie.position.copy(worldPos);
        cubie.quaternion.copy(worldQuat);

        // 添加到臨時群組
        tempGroup.add(cubie);
    });

    // 執行旋轉動畫
    animateRotation(tempGroup, rotationCommand, () => {
        // 動畫完成回調 - 應用最終變換
        applyFinalTransform(tempGroup, cubies, cubeGroup);

        // 移除臨時群組
        scene.remove(tempGroup);

        // 更新狀態
        updateCubeState(rotationCommand);

        // 釋放動畫鎖定
        isAnimating = false;
        controls.enabled = true;

        // 清除選擇
        clearSelection();

        // 新增：更新控制面板按鈕狀態
        cubeState.updateControlPanelState();

        console.log('✓ 旋轉完成');
    });
}

function applyFinalTransform(tempGroup, cubies, targetGroup) {
    // Formula: Transform = tempGroup.rotation -> cubie.worldPosition + cubie.worldRotation -> targetGroup
    cubies.forEach(cubie => {
        // 獲取世界座標和旋轉
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        cubie.getWorldPosition(worldPos);
        cubie.getWorldQuaternion(worldQuat);

        // 從臨時群組移除
        tempGroup.remove(cubie);

        // 設置新位置和旋轉
        cubie.position.copy(worldPos);
        cubie.quaternion.copy(worldQuat);

        // 歸正位置到最接近的網格點（避免浮點誤差）
        cubie.position.x = Math.round(cubie.position.x);
        cubie.position.y = Math.round(cubie.position.y);
        cubie.position.z = Math.round(cubie.position.z);

        // 添加回主群組
        targetGroup.add(cubie);
    });
}

// ========== 模組 8: AnimationSystem - 旋轉動畫系統 ==========
// Formula: Animation = Tween(startValue, endValue, duration) × EasingFunc(easeInOutCubic) × RAF(interpolate) × onComplete(commitState + unlock) × AnimationLock(isAnimating)

const ANIMATION_DURATION = 400; // 毫秒
let currentAnimation = null;

function animateRotation(tempGroup, rotationCommand, onComplete) {
    // 緩動函數：easeInOutCubic
    const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const startTime = performance.now();
    const startAngle = 0;
    const endAngle = rotationCommand.angle;
    const axis = rotationCommand.axis;

    currentAnimation = {
        startTime: startTime,
        duration: ANIMATION_DURATION,
        update: function(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
            const easedProgress = easeInOutCubic(progress);

            // 計算當前角度
            const currentAngle = startAngle + (endAngle - startAngle) * easedProgress;

            // 應用旋轉
            if (axis === 'x') {
                tempGroup.rotation.x = currentAngle;
            } else if (axis === 'y') {
                tempGroup.rotation.y = currentAngle;
            } else if (axis === 'z') {
                tempGroup.rotation.z = currentAngle;
            }

            // 檢查動畫是否完成
            if (progress >= 1) {
                currentAnimation = null;
                onComplete();
                return false; // 停止動畫
            }

            return true; // 繼續動畫
        }
    };
}

function updateAnimation() {
    if (currentAnimation) {
        const continueAnimation = currentAnimation.update(performance.now());
        if (!continueAnimation) {
            currentAnimation = null;
        }
    }
}

// ========== 模組 9: StateManagement - 狀態管理系統 ==========
// Formula: StateSystem = CubeStateClass × StateMatrix(27 cubies) × OperationHistory(queue) × UpdateMethod(applyRotation) × RestoreMethod(undoRotation) × TimerManagement × MoveCounter × GameState

class CubeState {
    constructor() {
        this.cubies = [];
        this.history = [];
        this.maxHistoryLength = 100;

        // 新增：計時器狀態
        this.timerStartTime = null;
        this.timerIntervalId = null;
        this.elapsedTime = 0; // 毫秒

        // 新增：步數計數器
        this.moveCount = 0;

        // 新增：遊戲狀態
        this.gameState = 'idle'; // 'idle' | 'scrambling' | 'playing' | 'solved'
    }

    initialize(cubeGroup) {
        // 初始化狀態矩陣
        this.cubies = [];
        cubeGroup.children.forEach((child, index) => {
            if (child.type === 'Mesh') {
                // 分配唯一 ID
                const id = `${child.position.x}_${child.position.y}_${child.position.z}`;
                child.userData.id = id;
                child.userData.originalIndex = index;

                this.cubies.push({
                    id: id,
                    position: child.position.clone(),
                    rotation: child.quaternion.clone(),
                    originalIndex: index
                });
            }
        });

        console.log(`✓ CubeState 初始化完成 (${this.cubies.length} 個小方塊)`);
    }

    updateState(rotationCommand) {
        // 記錄操作到歷史
        this.history.push({
            layer: rotationCommand.layer.name,
            axis: rotationCommand.axis,
            direction: rotationCommand.direction,
            timestamp: Date.now()
        });

        // 限制歷史長度
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift();
        }

        // 更新狀態矩陣（在 applyFinalTransform 後同步）
        this.syncState(cubeGroup);

        console.log(`✓ 狀態已更新 (歷史記錄: ${this.history.length} 步)`);
    }

    syncState(cubeGroup) {
        // 同步當前狀態
        cubeGroup.children.forEach((child) => {
            if (child.type === 'Mesh' && child.userData.id) {
                const stateEntry = this.cubies.find(c => c.id === child.userData.id);
                if (stateEntry) {
                    stateEntry.position = child.position.clone();
                    stateEntry.rotation = child.quaternion.clone();
                }
            }
        });
    }

    getState() {
        return {
            cubies: this.cubies.map(c => ({...c})),
            history: [...this.history]
        };
    }

    undoLastRotation() {
        if (this.history.length === 0) {
            console.log('沒有可還原的操作');
            return null;
        }

        const lastOperation = this.history[this.history.length - 1];

        // 生成反向旋轉命令
        const undoCommand = {
            layer: {
                name: lastOperation.layer,
                axis: lastOperation.axis,
                cubies: getCubiesInLayer(lastOperation.axis, lastOperation.direction)
            },
            axis: lastOperation.axis,
            direction: -lastOperation.direction, // 反向
            angle: -lastOperation.direction * Math.PI / 2
        };

        // 移除最後一條歷史記錄（因為執行還原時會再次記錄）
        this.history.pop();

        return undoCommand;
    }

    serialize() {
        // 序列化狀態（為未來保存功能預留）
        return JSON.stringify({
            cubies: this.cubies,
            history: this.history
        });
    }

    deserialize(data) {
        // 反序列化狀態
        const state = JSON.parse(data);
        this.cubies = state.cubies;
        this.history = state.history;
    }

    // ========== 新增：計時器管理方法 ==========
    startTimer() {
        if (this.timerIntervalId !== null) return; // 避免重複啟動

        this.timerStartTime = Date.now() - this.elapsedTime;
        this.timerIntervalId = setInterval(() => {
            this.elapsedTime = Date.now() - this.timerStartTime;
            this.updateTimerDisplay();
        }, 100); // 每 100ms 更新一次（更流暢）

        console.log('✓ 計時器已啟動');
    }

    stopTimer() {
        if (this.timerIntervalId === null) return;

        clearInterval(this.timerIntervalId);
        this.timerIntervalId = null;

        console.log('✓ 計時器已停止');
    }

    resetTimer() {
        this.stopTimer();
        this.elapsedTime = 0;
        this.timerStartTime = null;
        this.updateTimerDisplay();

        console.log('✓ 計時器已重置');
    }

    updateTimerDisplay() {
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const displayElement = document.querySelector('#timer-display .display-value');
        if (displayElement) {
            displayElement.textContent = formattedTime;
        }
    }

    // ========== 新增：步數計數器方法 ==========
    incrementMoveCount() {
        this.moveCount++;
        this.updateMoveCounterDisplay();
    }

    decrementMoveCount() {
        if (this.moveCount > 0) {
            this.moveCount--;
            this.updateMoveCounterDisplay();
        }
    }

    resetMoveCount() {
        this.moveCount = 0;
        this.updateMoveCounterDisplay();

        console.log('✓ 步數計數器已重置');
    }

    updateMoveCounterDisplay() {
        const displayElement = document.querySelector('#move-counter .display-value');
        if (displayElement) {
            displayElement.textContent = this.moveCount;
        }
    }

    // ========== 新增：遊戲狀態管理方法 ==========
    updateGameState(newState) {
        const validStates = ['idle', 'scrambling', 'playing', 'solved'];
        if (!validStates.includes(newState)) {
            console.error(`無效的遊戲狀態: ${newState}`);
            return;
        }

        this.gameState = newState;
        console.log(`✓ 遊戲狀態更新為: ${newState}`);

        // 根據狀態更新 UI
        this.updateControlPanelState();
    }

    updateControlPanelState() {
        const btnReset = document.getElementById('btn-reset');
        const btnScramble = document.getElementById('btn-scramble');
        const btnUndo = document.getElementById('btn-undo');

        if (!btnReset || !btnScramble || !btnUndo) return;

        // 根據遊戲狀態禁用/啟用按鈕
        if (this.gameState === 'scrambling' || isAnimating) {
            btnReset.disabled = true;
            btnScramble.disabled = true;
            btnUndo.disabled = true;
        } else {
            btnReset.disabled = false;
            btnScramble.disabled = false;
            btnUndo.disabled = this.history.length === 0;
        }
    }
}

// 全域狀態實例
let cubeState = new CubeState();

function updateCubeState(rotationCommand) {
    cubeState.updateState(rotationCommand);
}

// ========== 模組 4: RenderLoop - 渲染循環 ==========
// Formula: AnimationLoop = requestAnimationFrame -> controls.update -> animation.update -> renderer.render

function animate() {
    requestAnimationFrame(animate);

    // 更新動畫
    updateAnimation();

    // 更新控制器（阻尼效果需要）
    controls.update();

    // 渲染場景
    renderer.render(scene, camera);
}

// ========== 模組 10: ControlPanelFunctions - 控制面板功能 ==========
// Formula: ControlPanel = ResetFunction + ScrambleFunction + UndoFunction

// 重置功能
function handleReset() {
    if (isAnimating) return;

    if (confirm('確定要重置魔術方塊嗎？這將清除所有進度。')) {
        console.log('執行重置功能...');

        // 停止計時器
        cubeState.stopTimer();

        // 重置所有小方塊到初始位置和旋轉
        cubeGroup.children.forEach((child, index) => {
            if (child.type === 'Mesh') {
                // 計算初始位置
                const cubeIndex = index;
                const x = Math.floor(cubeIndex / 9) - 1;
                const y = Math.floor((cubeIndex % 9) / 3) - 1;
                const z = (cubeIndex % 3) - 1;

                child.position.set(x, y, z);
                child.quaternion.set(0, 0, 0, 1); // 重置旋轉
            }
        });

        // 重置狀態
        cubeState.resetTimer();
        cubeState.resetMoveCount();
        cubeState.history = [];
        cubeState.updateGameState('idle');
        cubeState.syncState(cubeGroup);

        console.log('✓ 魔術方塊已重置');
    }
}

// 打亂功能
function handleScramble() {
    if (isAnimating) return;

    console.log('執行打亂功能...');

    // 更新遊戲狀態
    cubeState.updateGameState('scrambling');

    // 生成隨機打亂序列（20-30 次）
    const moveCount = 20 + Math.floor(Math.random() * 11); // 20-30
    const moves = generateRandomMoves(moveCount);

    console.log(`生成打亂序列: ${moveCount} 步`);

    // 執行打亂動畫序列
    executeScrambleSequence(moves, 0, () => {
        // 打亂完成後重置計時器和步數
        cubeState.resetTimer();
        cubeState.resetMoveCount();
        cubeState.history = []; // 清除打亂操作歷史
        cubeState.updateGameState('playing');

        console.log('✓ 魔術方塊已打亂，開始計時！');
    });
}

// 生成隨機旋轉命令
function generateRandomMoves(count) {
    const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
    const axisMap = { 'R': 'x', 'L': 'x', 'U': 'y', 'D': 'y', 'F': 'z', 'B': 'z' };
    const directionMap = { 'R': 1, 'L': -1, 'U': 1, 'D': -1, 'F': 1, 'B': -1 };

    const moves = [];
    let lastFace = null;

    for (let i = 0; i < count; i++) {
        // 避免連續兩次旋轉同一面
        let face;
        do {
            face = faces[Math.floor(Math.random() * faces.length)];
        } while (face === lastFace);

        lastFace = face;

        const axis = axisMap[face];
        const direction = directionMap[face];

        moves.push({
            layer: {
                name: face,
                axis: axis,
                cubies: getCubiesInLayer(axis, direction)
            },
            axis: axis,
            direction: direction,
            angle: direction * Math.PI / 2
        });
    }

    return moves;
}

// 執行打亂動畫序列（遞迴）
function executeScrambleSequence(moves, index, onComplete) {
    if (index >= moves.length) {
        // 所有動作完成
        onComplete();
        return;
    }

    const move = moves[index];

    // 執行當前動作（使用較短的動畫時間以加快打亂速度）
    const originalDuration = ANIMATION_DURATION;

    executeRotationImmediate(move, originalDuration, () => {
        // 執行下一個動作
        executeScrambleSequence(moves, index + 1, onComplete);
    });
}

// 立即執行旋轉（不計入步數，用於打亂）
function executeRotationImmediate(rotationCommand, duration, onComplete) {
    if (isAnimating) {
        // 等待當前動畫完成
        setTimeout(() => executeRotationImmediate(rotationCommand, duration, onComplete), 50);
        return;
    }

    isAnimating = true;

    // 創建臨時旋轉群組
    const tempGroup = new THREE.Group();
    scene.add(tempGroup);

    const cubies = rotationCommand.layer.cubies;

    cubies.forEach(cubie => {
        const worldPos = new THREE.Vector3();
        const worldQuat = new THREE.Quaternion();
        cubie.getWorldPosition(worldPos);
        cubie.getWorldQuaternion(worldQuat);

        cubie.parent.remove(cubie);
        cubie.position.copy(worldPos);
        cubie.quaternion.copy(worldQuat);
        tempGroup.add(cubie);
    });

    // 執行快速旋轉動畫（200ms 加速）
    animateRotationFast(tempGroup, rotationCommand, 200, () => {
        applyFinalTransform(tempGroup, cubies, cubeGroup);
        scene.remove(tempGroup);
        isAnimating = false;
        onComplete();
    });
}

// 快速旋轉動畫（用於打亂）
function animateRotationFast(tempGroup, rotationCommand, duration, onComplete) {
    const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const startTime = performance.now();
    const startAngle = 0;
    const endAngle = rotationCommand.angle;
    const axis = rotationCommand.axis;

    currentAnimation = {
        startTime: startTime,
        duration: duration,
        update: function(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);

            const currentAngle = startAngle + (endAngle - startAngle) * easedProgress;

            if (axis === 'x') {
                tempGroup.rotation.x = currentAngle;
            } else if (axis === 'y') {
                tempGroup.rotation.y = currentAngle;
            } else if (axis === 'z') {
                tempGroup.rotation.z = currentAngle;
            }

            if (progress >= 1) {
                currentAnimation = null;
                onComplete();
                return false;
            }

            return true;
        }
    };
}

// 還原功能
function handleUndo() {
    if (isAnimating || cubeState.history.length === 0) return;

    console.log('執行還原功能...');

    const undoCommand = cubeState.undoLastRotation();

    if (undoCommand) {
        // 減少步數（如果在 playing 狀態）
        if (cubeState.gameState === 'playing') {
            cubeState.decrementMoveCount();
        }

        // 執行反向旋轉（標記為還原操作）
        executeRotation(undoCommand, true);

        console.log('✓ 已還原上一步操作');
    }
}

// 初始化控制面板事件監聽
function initControlPanel() {
    const btnReset = document.getElementById('btn-reset');
    const btnScramble = document.getElementById('btn-scramble');
    const btnUndo = document.getElementById('btn-undo');

    if (btnReset) {
        btnReset.addEventListener('click', handleReset);
    }

    if (btnScramble) {
        btnScramble.addEventListener('click', handleScramble);
    }

    if (btnUndo) {
        btnUndo.addEventListener('click', handleUndo);
    }

    // 初始化顯示
    cubeState.updateTimerDisplay();
    cubeState.updateMoveCounterDisplay();
    cubeState.updateControlPanelState();

    console.log('✓ 控制面板已初始化');
}

// ========== 響應式設計 ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========== 應用初始化 ==========
// Formula: Init = SceneSetup -> CubeModeling -> ControlsIntegration -> InteractionSetup -> StateInitialization -> RenderLoopStart

function init() {
    console.log('========== 魔術方塊應用啟動 ==========');
    initScene();
    buildRubiksCube();
    initControls();
    initRaycaster();
    cubeState.initialize(cubeGroup);
    initControlPanel(); // 新增：初始化控制面板
    animate();
    console.log('========== 應用運行中 (60 FPS) ==========');
    console.log('提示: 點擊並拖拽面層進行旋轉操作，或使用控制面板功能');
}

// 等待 DOM 載入完成後初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}