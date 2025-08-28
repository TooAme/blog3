// L站头像生成器 - 修复logo预览版本 v13.1
console.log('L站头像生成器加载 - 修复logo预览版本 v13.1');

(function() {
    'use strict';
    
    let selectedCharacter = '';
    let nickname = '';
    let logoImage = null;
    let characterVideo = null;
    let generatedGif = null;
    
    // DOM元素
    const characterSelect = document.getElementById('character-select');
    const nicknameInput = document.getElementById('nickname-input');
    const generateBtn = document.getElementById('generate-btn');

    const loadingContainer = document.getElementById('loading-container');
    const loadingText = document.getElementById('loading-text');
    const previewContainer = document.getElementById('preview-container');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewGif = document.getElementById('preview-gif');
    const hiddenCanvas = document.getElementById('hidden-canvas');
    const downloadBtn = document.getElementById('download-gif-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const selectionStatus = document.getElementById('selection-status');
    const selectedInfo = document.getElementById('selected-info');
    const parameterSection = document.getElementById('parameter-section');

    // 颜色选择器元素
    const colorModeRadios = document.querySelectorAll('input[name="color-mode"]');
    const color1Input = document.getElementById('color1');
    const color2Input = document.getElementById('color2');
    const colorPreview = document.getElementById('color-preview');
    const color2Group = document.getElementById('color2-group');
    const gradientAngleGroup = document.getElementById('gradient-angle-group');
    const angleInputContainer = document.getElementById('angle-input-container');
    const angleIndicator = document.getElementById('angle-indicator');
    const angleValue = document.getElementById('angle-value');
    const fontSelect = document.getElementById('font-select');
    const layoutPreviewCanvas = document.getElementById('layout-preview-canvas');
    const resetLayoutBtn = document.getElementById('reset-layout-btn');

    // 颜色相关变量
    let colorMode = 'single'; // 'single' 或 'gradient'
    let nicknameColor1 = '#25A5D0'; // 默认蓝色 (37, 165, 208)
    let nicknameColor2 = '#88D5FB'; // 默认浅蓝色 (136, 213, 251)
    let gradientAngle = 90; // 默认90度（从上到下）
    let selectedFont = 'Microsoft YaHei'; // 默认字体

    // 布局相关变量
    let layoutElements = {
        logo: { x: 80, y: 150, width: 120, height: 120, dragging: false },
        linuxdo: { x: 210, y: 150, width: 150, height: 30, dragging: false },
        nickname: { x: 200, y: 300, width: 200, height: 40, dragging: false }
    };
    let dragOffset = { x: 0, y: 0 };
    let isDragging = false;
    let dragElement = null;

    // 初始化
    function init() {
        loadLogo();
        bindEvents();
    }

    
    // 加载logo图片
    function loadLogo() {
        logoImage = new Image();
        logoImage.crossOrigin = 'anonymous';
        logoImage.onload = function() {
            console.log('Logo loaded successfully');
            // logo加载完成后更新预览
            updateLayoutPreview();
        };
        logoImage.onerror = function() {
            console.error('Failed to load logo');
            // 即使加载失败也更新预览（显示占位框）
            updateLayoutPreview();
        };
        logoImage.src = 'https://linux.do/uploads/default/original/3X/9/d/9dd49731091ce8656e94433a26a3ef36062b3994.png';
    }
    
    // 绑定事件
    function bindEvents() {
        characterSelect.addEventListener('change', function() {
            selectedCharacter = this.value;
            updateSelectionStatus();
            checkInputs();
        });

        nicknameInput.addEventListener('input', function() {
            nickname = this.value; // 保存原始值，在检查时再trim
            updateSelectionStatus();
            checkInputs();
            updateLayoutPreview();
        });

        // 颜色选择器事件
        colorModeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                colorMode = this.value;
                updateColorMode();
            });
        });

        color1Input.addEventListener('input', function() {
            nicknameColor1 = this.value;
            updateLayoutPreview();
        });

        color2Input.addEventListener('input', function() {
            nicknameColor2 = this.value;
            updateLayoutPreview();
        });

        // 字体选择事件
        fontSelect.addEventListener('change', function() {
            selectedFont = this.value;
            updateLayoutPreview();
        });

        // 角度选择器事件
        initAngleSelector();

        // 布局预览事件
        initLayoutPreview();

        generateBtn.addEventListener('click', generateAvatar);
        downloadBtn.addEventListener('click', downloadGif);
        regenerateBtn.addEventListener('click', resetGenerator);

        // 初始状态检查（不禁用按钮）
        checkInputs();
        initializeColorSelector();
    }
    
    // 更新按钮提示文本
    function checkInputs() {
        const trimmedNickname = nickname.trim();

        // 按钮始终保持启用状态
        generateBtn.disabled = false;
        generateBtn.removeAttribute('disabled');

        // 更新按钮文本提示
        if (!selectedCharacter && !trimmedNickname) {
            generateBtn.title = '请选择角色并输入昵称';
        } else if (!selectedCharacter) {
            generateBtn.title = '请选择角色';
        } else if (!trimmedNickname) {
            generateBtn.title = '请输入昵称';
        } else {
            generateBtn.title = '点击生成头像';
        }
    }

    // 初始化颜色选择器
    function initializeColorSelector() {
        updateColorMode();
        updateLayoutPreview();
    }

    // 初始化布局预览
    function initLayoutPreview() {
        if (!layoutPreviewCanvas) return;

        const canvas = layoutPreviewCanvas;

        // 鼠标按下事件
        canvas.addEventListener('mousedown', function(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 检查点击的是哪个元素
            for (const [key, element] of Object.entries(layoutElements)) {
                if (isPointInElement(x, y, element, key)) {
                    isDragging = true;
                    dragElement = key;
                    element.dragging = true;
                    dragOffset.x = x - element.x;
                    dragOffset.y = y - element.y;
                    canvas.style.cursor = 'grabbing';
                    updateLayoutPreview();
                    break;
                }
            }
        });

        // 鼠标移动事件
        canvas.addEventListener('mousemove', function(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (isDragging && dragElement) {
                const element = layoutElements[dragElement];
                element.x = x - dragOffset.x;
                element.y = y - dragOffset.y;

                // 限制在画布范围内
                element.x = Math.max(0, Math.min(canvas.width - element.width, element.x));
                element.y = Math.max(0, Math.min(canvas.height - element.height, element.y));

                updateLayoutPreview();
            } else {
                // 检查鼠标悬停
                let hovering = false;
                for (const [key, element] of Object.entries(layoutElements)) {
                    if (isPointInElement(x, y, element, key)) {
                        hovering = true;
                        break;
                    }
                }
                canvas.style.cursor = hovering ? 'grab' : 'default';
            }
        });

        // 鼠标释放事件
        canvas.addEventListener('mouseup', function() {
            if (isDragging && dragElement) {
                layoutElements[dragElement].dragging = false;
                isDragging = false;
                dragElement = null;
                canvas.style.cursor = 'default';
                updateLayoutPreview();
            }
        });

        // 重置布局按钮
        resetLayoutBtn.addEventListener('click', function() {
            layoutElements = {
                logo: { x: 80, y: 150, width: 120, height: 120, dragging: false },
                linuxdo: { x: 210, y: 150, width: 150, height: 30, dragging: false },
                nickname: { x: 200, y: 300, width: 200, height: 40, dragging: false }
            };
            updateLayoutPreview();
        });

        // 初始绘制
        updateLayoutPreview();
    }

    // 检查点是否在元素内
    function isPointInElement(x, y, element, elementType) {
        if (elementType === 'nickname') {
            // 昵称以中心点为基准
            return x >= element.x - element.width/2 && x <= element.x + element.width/2 &&
                   y >= element.y - element.height/2 && y <= element.y + element.height/2;
        } else {
            // logo和linuxdo以左上角为基准
            return x >= element.x && x <= element.x + element.width &&
                   y >= element.y && y <= element.y + element.height;
        }
    }

    // 更新颜色模式显示
    function updateColorMode() {
        if (colorMode === 'gradient') {
            color2Group.style.display = 'flex';
            gradientAngleGroup.style.display = 'flex';
        } else {
            color2Group.style.display = 'none';
            gradientAngleGroup.style.display = 'none';
        }
        // 更新布局预览
        updateLayoutPreview();
    }

    // 更新布局预览
    function updateLayoutPreview() {
        if (!layoutPreviewCanvas) return;

        const ctx = layoutPreviewCanvas.getContext('2d');
        const canvas = layoutPreviewCanvas;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制logo
        drawLayoutElement(ctx, 'logo');

        // 绘制LINUX DO文字
        drawLayoutElement(ctx, 'linuxdo');

        // 绘制昵称
        drawLayoutElement(ctx, 'nickname');
    }

    // 绘制布局元素
    function drawLayoutElement(ctx, elementType) {
        const element = layoutElements[elementType];

        if (elementType === 'logo') {
            // 如果logo图片已加载，绘制实际图片
            if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
                ctx.drawImage(logoImage, element.x, element.y, element.width, element.height);
            } else {
                // 否则绘制占位框
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(element.x, element.y, element.width, element.height);

                // 绘制logo文字
                ctx.fillStyle = '#666';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('LOGO', element.x + element.width/2, element.y + element.height/2);
            }

            // 绘制选择框
            if (element.dragging) {
                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = 2;
                ctx.strokeRect(element.x - 2, element.y - 2, element.width + 4, element.height + 4);
            }

        } else if (elementType === 'linuxdo') {
            // 绘制LINUX DO文字
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${Math.round(24 * 1.5)}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText('LINUX DO', element.x, element.y + 20);

            // 绘制选择框
            if (element.dragging) {
                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = 2;
                ctx.strokeRect(element.x - 5, element.y - 5, element.width + 10, element.height + 10);
            }

        } else if (elementType === 'nickname') {
            const displayText = nickname.trim() || '昵称';

            // 根据颜色模式设置填充样式
            if (colorMode === 'gradient') {
                const angleRad = (gradientAngle * Math.PI) / 180;
                const x1 = element.x - Math.cos(angleRad) * 100;
                const y1 = element.y - Math.sin(angleRad) * 30;
                const x2 = element.x + Math.cos(angleRad) * 100;
                const y2 = element.y + Math.sin(angleRad) * 30;

                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, nicknameColor1);
                gradient.addColorStop(1, nicknameColor2);
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = nicknameColor1;
            }

            ctx.font = `bold ${Math.round(32 * 1.5)}px "${selectedFont}", Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(displayText, element.x, element.y + 25);

            // 绘制选择框
            if (element.dragging) {
                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = 2;
                ctx.strokeRect(element.x - element.width/2 - 5, element.y - 5, element.width + 10, element.height + 10);
            }
        }
    }

    // 初始化角度选择器
    function initAngleSelector() {
        let isDragging = false;
        let clickCount = 0;
        let clickTimer = null;

        // 更新角度指示器位置
        function updateAngleIndicator() {
            const percentage = (gradientAngle / 360) * 100;
            angleIndicator.style.left = percentage + '%';
            angleValue.value = gradientAngle;
        }

        // 根据鼠标位置计算角度
        function calculateAngleFromPosition(x) {
            const rect = angleInputContainer.getBoundingClientRect();
            const percentage = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
            return Math.round((percentage / 100) * 360);
        }

        // 鼠标按下事件
        angleInputContainer.addEventListener('mousedown', function(e) {
            clickCount++;

            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    // 单击：开始拖拽
                    isDragging = true;
                    angleInputContainer.classList.add('active');

                    const newAngle = calculateAngleFromPosition(e.clientX);
                    gradientAngle = newAngle;
                    updateAngleIndicator();
                    updateLayoutPreview();

                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                // 双击：进入编辑模式
                clearTimeout(clickTimer);
                clickCount = 0;

                angleValue.readOnly = false;
                angleValue.focus();
                angleValue.select();
            }
        });

        // 鼠标移动事件
        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const newAngle = calculateAngleFromPosition(e.clientX);
                gradientAngle = newAngle;
                updateAngleIndicator();
                updateLayoutPreview();
            }
        });

        // 鼠标释放事件
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                angleInputContainer.classList.remove('active');
            }
        });

        // 输入框事件
        angleValue.addEventListener('blur', function() {
            let value = parseInt(this.value);
            if (isNaN(value)) {
                value = gradientAngle;
            } else {
                value = Math.max(0, Math.min(360, value));
            }

            gradientAngle = value;
            this.readOnly = true;
            updateAngleIndicator();
            updateLayoutPreview();
        });

        angleValue.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                this.blur();
            } else if (e.key === 'Escape') {
                this.value = gradientAngle;
                this.readOnly = true;
                this.blur();
            }
        });

        // 初始化位置
        updateAngleIndicator();
    }

    // 更新选择状态显示
    function updateSelectionStatus() {
        // 检查元素是否存在（可能被注释掉了）
        if (!selectionStatus || !selectedInfo) {
            return; // 如果元素不存在，直接返回
        }

        const trimmedNickname = nickname.trim();
        if (selectedCharacter && trimmedNickname.length > 0) {
            const characterName = characterSelect.options[characterSelect.selectedIndex].text;
            selectedInfo.textContent = `角色：${characterName}，昵称：${trimmedNickname}`;
            selectionStatus.style.display = 'block';
        } else {
            selectionStatus.style.display = 'none';
        }
    }


    // 更新加载状态
    function updateLoading(text) {
        loadingText.textContent = text;
    }

    // 显示加载动画
    function showLoading(text = '准备中...') {
        loadingContainer.style.display = 'block';
        updateLoading(text);
    }

    // 隐藏加载动画
    function hideLoading() {
        loadingContainer.style.display = 'none';
    }
    
    // 生成头像
    async function generateAvatar() {
        // 验证输入
        const trimmedNickname = nickname.trim();
        if (!selectedCharacter) {
            alert('请先选择角色！');
            return;
        }
        if (!trimmedNickname) {
            alert('请输入昵称！');
            return;
        }

        try {
            // 隐藏参数选择区域，显示加载动画
            parameterSection.style.display = 'none';
            showLoading('准备生成图片...');
            previewContainer.style.display = 'none';

            // 生成静态图片
            const staticImage = await generateStaticImage();
            updateLoading('检查角色视频...');

            // 尝试加载角色视频
            const characterVideoBlob = await loadCharacterVideo();

            if (characterVideoBlob) {
                console.log('检测到角色视频，开始合并流程');
                updateLoading('准备合并视频...');
                // 如果有角色视频，直接合并角色视频 + 静态图片渐显，返回GIF
                generatedGif = await mergeVideos(characterVideoBlob, staticImage);
                console.log('合并完成，GIF类型:', generatedGif?.type, '大小:', generatedGif?.size);
                updateLoading('合并完成！');
            } else {
                updateLoading('生成纯动画视频...');
                // 如果没有角色视频，生成纯渐显动画
                const animationVideo = await generateAnimationVideo(staticImage);
                updateLoading('转换为GIF...');

                // 转换为GIF
                try {
                    generatedGif = await convertToGif(animationVideo);
                    updateLoading('生成完成！');
                } catch (gifError) {
                    console.warn('GIF生成失败，使用静态图片:', gifError);
                    generatedGif = animationVideo;
                    updateLoading('生成完成（静态图片）！');
                }
            }

            // 显示预览，保持参数区域隐藏
            hideLoading();
            showPreview();

        } catch (error) {
            console.error('生成失败:', error);
            hideLoading();
            // 生成失败时重新显示参数区域
            parameterSection.style.display = 'block';
            alert(`生成失败: ${error.message || '未知错误'}，请检查输入并重试`);
        }
    }
    
    // 生成静态图片
    function generateStaticImage() {
        return new Promise((resolve) => {
            const canvas = hiddenCanvas;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // 设置画布大小 (1:1比例)
            canvas.width = 400;
            canvas.height = 400;
            
            // 白色背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 使用布局位置绘制元素

            // 绘制logo - 使用布局位置
            if (logoImage && logoImage.complete) {
                const logoLayout = layoutElements.logo;
                ctx.drawImage(logoImage, logoLayout.x, logoLayout.y, logoLayout.width, logoLayout.height);
            }

            // 绘制LINUX DO文字 - 使用布局位置
            const linuxdoLayout = layoutElements.linuxdo;
            ctx.fillStyle = '#0b0b0bff';
            ctx.font = `700 ${Math.round(24 * 1.6)}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText('LINUX DO', linuxdoLayout.x, linuxdoLayout.y + 20);

            // 绘制用户昵称 - 使用布局位置和选择的颜色
            const nicknameLayout = layoutElements.nickname;

            // 根据颜色模式设置填充样式
            if (colorMode === 'gradient') {
                // 创建带角度的渐变
                const angleRad = (gradientAngle * Math.PI) / 180;
                const x1 = nicknameLayout.x - Math.cos(angleRad) * 100;
                const y1 = nicknameLayout.y - Math.sin(angleRad) * 30;
                const x2 = nicknameLayout.x + Math.cos(angleRad) * 100;
                const y2 = nicknameLayout.y + Math.sin(angleRad) * 30;

                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, nicknameColor1);
                gradient.addColorStop(1, nicknameColor2);
                ctx.fillStyle = gradient;
            } else {
                // 单色
                ctx.fillStyle = nicknameColor1;
            }

            ctx.font = `bold ${Math.round(32 * 1.6)}px "${selectedFont}", YaHei`; // 使用选择的字体
            ctx.textAlign = 'center';
            ctx.fillText(nickname, nicknameLayout.x, nicknameLayout.y + 25);
            
            // 转换为图片数据
            canvas.toBlob(resolve, 'image/png');
        });
    }
    
    // 生成动画视频 (1.2秒，前0.4秒渐显，后0.8秒保持)
    async function generateAnimationVideo(staticImageBlob) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = 400;
            canvas.height = 400;

            const img = new Image();
            img.onload = function() {
                // 创建视频帧数据
                const frames = [];
                const fps = 30;
                const totalFrames = Math.floor(1.2 * fps); // 1.2秒
                const fadeFrames = Math.floor(0.4 * fps); // 前0.4秒渐显

                for (let i = 0; i < totalFrames; i++) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // 计算透明度
                    let alpha = 1;
                    if (i < fadeFrames) {
                        alpha = i / fadeFrames; // 渐显效果
                    }

                    ctx.globalAlpha = alpha;
                    ctx.drawImage(img, 0, 0);
                    ctx.globalAlpha = 1;

                    // 将帧转换为ImageData
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    frames.push(imageData);
                }

                // 这里应该将帧数据转换为视频，暂时返回静态图片
                resolve(staticImageBlob);
            };
            img.src = URL.createObjectURL(staticImageBlob);
        });
    }
    
    // 加载角色视频
    async function loadCharacterVideo() {
        const videoPath = `/mp4/${encodeURIComponent(selectedCharacter)}.mp4`;
        console.log(`尝试加载角色视频: ${videoPath}`);

        try {
            const response = await fetch(videoPath);
            if (!response.ok) {
                console.warn(`角色视频 ${selectedCharacter}.mp4 未找到 (${response.status})，跳过视频合并`);
                return null;
            }

            const blob = await response.blob();
            console.log(`成功加载角色视频: ${selectedCharacter}.mp4, 大小: ${blob.size} bytes, 类型: ${blob.type}`);

            // 验证是否为有效的视频文件
            if (!blob.type.startsWith('video/')) {
                console.warn(`文件类型不是视频: ${blob.type}`);
                return null;
            }

            return blob;
        } catch (error) {
            console.warn(`角色视频加载失败: ${error.message}，跳过视频合并`);
            return null;
        }
    }
    
    // 合并视频 - 角色视频 + 静态图片渐显
    async function mergeVideos(characterVideoBlob, staticImageBlob) {
        if (!characterVideoBlob) {
            console.log('没有角色视频，应该不会到这里');
            return null;
        }

        console.log('开始合并角色视频和静态图片渐显...');

        return new Promise((resolve, reject) => {
            // 创建视频元素来获取角色视频信息
            const characterVideo = document.createElement('video');
            characterVideo.crossOrigin = 'anonymous';
            characterVideo.muted = true; // 静音以避免自动播放限制
            characterVideo.preload = 'metadata';

            characterVideo.onloadedmetadata = async function() {
                try {
                    const duration = characterVideo.duration;
                    console.log(`角色视频加载成功 - 时长: ${duration}秒, 尺寸: ${characterVideo.videoWidth}x${characterVideo.videoHeight}`);

                    updateLoading(`处理角色视频（${duration.toFixed(1)}秒）...`);

                    // 确保视频数据已加载
                    if (characterVideo.readyState < 2) {
                        console.log('等待视频数据加载...');
                        characterVideo.addEventListener('loadeddata', async () => {
                            const mergedGif = await createMergedGif(characterVideo, staticImageBlob);
                            resolve(mergedGif);
                        });
                    } else {
                        // 创建合并后的GIF（角色视频 + 静态图片渐显）
                        const mergedGif = await createMergedGif(characterVideo, staticImageBlob);
                        resolve(mergedGif);
                    }
                } catch (error) {
                    console.error('视频合并失败:', error);
                    // 如果合并失败，生成纯渐显动画作为备用
                    const fallbackGif = await generateAnimationVideo(staticImageBlob);
                    resolve(fallbackGif);
                }
            };

            characterVideo.onerror = async function(e) {
                console.error('角色视频加载失败:', e);
                const fallbackGif = await generateAnimationVideo(staticImageBlob);
                resolve(fallbackGif);
            };

            characterVideo.onabort = async function() {
                console.error('角色视频加载被中止');
                const fallbackGif = await generateAnimationVideo(staticImageBlob);
                resolve(fallbackGif);
            };

            const videoUrl = URL.createObjectURL(characterVideoBlob);
            console.log('开始加载角色视频:', videoUrl);
            characterVideo.src = videoUrl;
        });
    }

    // 创建合并的GIF（角色视频 + 静态图片渐显）
    async function createMergedGif(characterVideo, staticImageBlob) {
        return new Promise((resolve, reject) => {
            if (typeof GIF === 'undefined') {
                console.error('GIF.js未加载');
                reject(new Error('GIF.js未加载'));
                return;
            }

            const gif = new GIF({
                workers: 1,
                quality: 15,
                width: 400,
                height: 400,
                workerScript: '/js/gif.worker.js'
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = 400;
            canvas.height = 400;

            console.log('开始合并视频：原视频 + 静态图片渐显');

            // 第一步：添加完整的角色视频帧（保持原有动画）
            updateLoading('提取参数...');
            addCharacterVideoFrames(characterVideo, gif, canvas, ctx)
            .then(() => {
                console.log('角色视频帧添加完成，开始添加静态图片渐显');
                // 第二步：添加静态图片的渐显动画（40帧）
                updateLoading('添加渐显动画...');
                return addStaticImageFadeFrames(gif, canvas, ctx);
            })
            .then(() => {
                console.log('所有帧添加完成，开始渲染GIF');
                // 第三步：渲染最终GIF
                updateLoading('合成最终GIF...');
                gif.on('finished', function(blob) {
                    console.log('合并GIF生成完成，包含原视频 + 静态渐显');
                    resolve(blob);
                });
                gif.on('progress', function(p) {
                    updateLoading(`合成GIF... ${Math.round(p * 100)}%`);
                });
                gif.on('abort', () => {
                    console.log('GIF渲染被中止');
                    reject(new Error('GIF渲染被中止'));
                });
                gif.render();
            })
            .catch((error) => {
                console.error('视频合并过程出错:', error);
                reject(error);
            });
        });
    }

    // 添加角色视频帧（保持完整的原始动画）
    async function addCharacterVideoFrames(video, gif, canvas, ctx) {
        return new Promise((resolve, reject) => {
            // 使用视频的原始帧率和完整时长
            const originalFrameRate = 30; // 假设原视频是30fps，可以调整
            const duration = video.duration; // 使用完整时长，不截断
            const frameCount = Math.floor(duration * originalFrameRate);

            console.log(`角色视频：完整${frameCount}帧，${duration}秒，视频尺寸：${video.videoWidth}x${video.videoHeight}`);

            let currentFrame = 0;
            let completedFrames = 0;

            function captureFrame() {
                if (currentFrame >= frameCount) {
                    console.log(`角色视频帧添加完成，实际添加了${completedFrames}帧`);
                    resolve();
                    return;
                }

                const time = (currentFrame / originalFrameRate);

                // 设置视频时间
                video.currentTime = time;

                // 等待视频跳转到指定时间
                const onSeeked = function() {
                    video.removeEventListener('seeked', onSeeked);

                    try {
                        // 清除画布
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // 计算视频在canvas中的位置和大小（保持宽高比）
                        const videoWidth = video.videoWidth || canvas.width;
                        const videoHeight = video.videoHeight || canvas.height;

                        const scale = Math.min(canvas.width / videoWidth, canvas.height / videoHeight);
                        const scaledWidth = videoWidth * scale;
                        const scaledHeight = videoHeight * scale;
                        const x = (canvas.width - scaledWidth) / 2;
                        const y = (canvas.height - scaledHeight) / 2;

                        // 绘制视频帧（不做任何透明度处理，保持原样）
                        ctx.drawImage(video, x, y, scaledWidth, scaledHeight);

                        // 添加到GIF，使用原视频的帧率
                        gif.addFrame(ctx, {
                            delay: Math.round(1000 / originalFrameRate), // 根据原帧率计算延迟
                            copy: true
                        });

                        completedFrames++;
                        if (completedFrames % 30 === 0) { // 每30帧打印一次进度
                            console.log(`已添加${completedFrames}/${frameCount}帧`);
                        }

                    } catch (error) {
                        console.error('绘制视频帧失败:', error);
                    }

                    currentFrame++;
                    // 快速处理下一帧
                    setTimeout(captureFrame, 10);
                };

                video.addEventListener('seeked', onSeeked);

                // 超时处理
                setTimeout(() => {
                    video.removeEventListener('seeked', onSeeked);
                    console.warn(`第${currentFrame}帧超时，跳过`);
                    currentFrame++;
                    setTimeout(captureFrame, 5);
                }, 1000);
            }



            // 确保视频已加载
            if (video.readyState >= 2) {
                captureFrame();
            } else {
                video.addEventListener('loadeddata', captureFrame);
            }
        });
    }

    // 添加静态图片的渐显帧（在原视频之后）
    async function addStaticImageFadeFrames(gif, canvas, ctx) {
        return new Promise((resolve) => {
            console.log('开始添加静态图片渐显帧（40帧）');

            // 渐显动画：40帧，2秒
            const totalFrames = 40;
            const fadeFrames = 20; // 前20帧渐显
            const frameDelay = 50; // 每帧50ms

            for (let i = 0; i < totalFrames; i++) {
                // 清除画布并设置白色背景
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 计算透明度
                let alpha;
                if (i < fadeFrames) {
                    // 前20帧：从0渐显到1
                    alpha = i / (fadeFrames - 1);
                } else {
                    // 后20帧：保持完全不透明
                    alpha = 1.0;
                }

                // 绘制静态图片内容（logo + 昵称）
                ctx.globalAlpha = alpha;
                drawStaticContent(ctx);
                ctx.globalAlpha = 1;

                // 添加到GIF
                gif.addFrame(ctx, {
                    delay: frameDelay,
                    copy: true
                });

                if (i % 10 === 0) {
                    console.log(`静态渐显帧进度: ${i+1}/${totalFrames}`);
                }
            }

            console.log('静态图片渐显帧添加完成（40帧）');
            resolve();
        });
    }

    // 绘制静态内容（logo + 昵称）- 使用布局位置
    function drawStaticContent(ctx) {
        // 绘制logo - 使用布局位置
        if (logoImage && logoImage.complete) {
            const logoLayout = layoutElements.logo;
            ctx.drawImage(logoImage, logoLayout.x, logoLayout.y, logoLayout.width, logoLayout.height);
        }

        // 绘制LINUX DO文字 - 使用布局位置
        const linuxdoLayout = layoutElements.linuxdo;
        ctx.fillStyle = '#0b0b0bff';
        ctx.font = `700 ${Math.round(24 * 1.6)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('LINUX DO', linuxdoLayout.x, linuxdoLayout.y + 20);

        // 绘制用户昵称 - 使用布局位置和选择的颜色
        const nicknameLayout = layoutElements.nickname;

        // 根据颜色模式设置填充样式
        if (colorMode === 'gradient') {
            // 创建带角度的渐变
            const angleRad = (gradientAngle * Math.PI) / 180;
            const x1 = nicknameLayout.x - Math.cos(angleRad) * 100;
            const y1 = nicknameLayout.y - Math.sin(angleRad) * 30;
            const x2 = nicknameLayout.x + Math.cos(angleRad) * 100;
            const y2 = nicknameLayout.y + Math.sin(angleRad) * 30;

            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, nicknameColor1);
            gradient.addColorStop(1, nicknameColor2);
            ctx.fillStyle = gradient;
        } else {
            // 单色
            ctx.fillStyle = nicknameColor1;
        }

        ctx.font = `bold ${Math.round(32 * 1.6)}px "${selectedFont}", YaHei`; // 使用选择的字体
        ctx.textAlign = 'center';
        ctx.fillText(nickname, nicknameLayout.x, nicknameLayout.y + 25);
    }
    




    // 转换为GIF
    async function convertToGif(videoBlob) {
        return new Promise((resolve, reject) => {
            if (typeof GIF === 'undefined') {
                console.warn('GIF.js未加载，返回原视频');
                resolve(videoBlob);
                return;
            }

            // 设置超时
            const timeout = setTimeout(() => {
                reject(new Error('GIF生成超时，请重试'));
            }, 60000); // 60秒超时

            const gif = new GIF({
                workers: 1, // 减少worker数量
                quality: 15, // 优化质量以适应高帧率
                width: 400,
                height: 400,
                workerScript: '/js/gif.worker.js' // 使用本地worker脚本
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = 400;
            canvas.height = 400;

            const img = new Image();
            img.onload = function() {
                try {
                    // 高帧率平滑渐显动画：40帧，2秒总时长
                    const totalFrames = 40;
                    const fadeFrames = 20; // 前20帧（1秒）为渐显
                    const frameDelay = 50; // 每帧50ms

                    console.log(`生成完整GIF: ${totalFrames}帧, 20fps`);

                    for (let i = 0; i < totalFrames; i++) {
                        // 清除画布
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // 计算透明度
                        let alpha;
                        if (i < fadeFrames) {
                            // 前20帧：从0渐显到1
                            alpha = i / (fadeFrames - 1);
                        } else {
                            // 后20帧：保持完全不透明
                            alpha = 1.0;
                        }

                        ctx.globalAlpha = alpha;
                        ctx.drawImage(img, 0, 0);
                        ctx.globalAlpha = 1;

                        // 添加帧到GIF
                        gif.addFrame(ctx, {
                            delay: frameDelay,
                            copy: true
                        });
                    }

                    gif.on('finished', function(blob) {
                        clearTimeout(timeout);
                        console.log('GIF生成完成');
                        resolve(blob);
                    });

                    gif.on('progress', function(p) {
                        console.log(`GIF渲染进度: ${Math.round(p * 100)}%`);
                        updateLoading(`转换为GIF... ${Math.round(p * 100)}%`);
                    });

                    gif.on('abort', function() {
                        clearTimeout(timeout);
                        reject(new Error('GIF生成被中止'));
                    });

                    console.log('开始渲染GIF...');
                    gif.render();

                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                }
            };

            img.onerror = function() {
                clearTimeout(timeout);
                reject(new Error('图片加载失败'));
            };

            img.src = URL.createObjectURL(videoBlob);
        });
    }
    
    // 显示预览
    function showPreview() {
        if (generatedGif && generatedGif.type && generatedGif.type.includes('gif')) {
            // 如果是GIF，显示循环播放的GIF
            const gifUrl = URL.createObjectURL(generatedGif);
            previewGif.src = gifUrl;
            previewGif.style.display = 'block';
            previewCanvas.style.display = 'none';

            // 清理之前的URL
            previewGif.onload = function() {
                // GIF加载完成后可以清理URL，但为了循环播放，我们保留它
            };
        } else {
            // 如果是静态图片，显示在Canvas上
            const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });
            generateStaticImageToCanvas(previewCanvas);
            previewCanvas.style.display = 'block';
            previewGif.style.display = 'none';
        }

        previewContainer.style.display = 'block';
    }

    // 在指定canvas上生成静态图片
    function generateStaticImageToCanvas(canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 第一排：logo和LINUX DO文字
        const firstRowY = 150;

        // 绘制logo (左侧) - 放大1.3倍
        if (logoImage && logoImage.complete) {
            const logoSize = Math.round(80 * 1.3); // 80 * 1.3 = 104
            const logoX = 80; // 稍微左移以适应更大的logo
            ctx.drawImage(logoImage, logoX, firstRowY - logoSize/2, logoSize, logoSize);
        }

        // 绘制LINUX DO文字 (右侧) - 放大1.3倍
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.round(24 * 1.3)}px Arial`; // 24 * 1.3 = 31.2 ≈ 31
        ctx.textAlign = 'left';
        ctx.fillText('LINUX DO', 200, firstRowY + 10);

        // 第二排：用户昵称 (居中，黄色) - 放大1.3倍
        const secondRowY = 280;
        ctx.fillStyle = '#FFD700';
        ctx.font = `bold ${Math.round(32 * 1.3)}px Arial`; // 32 * 1.3 = 41.6 ≈ 42
        ctx.textAlign = 'center';
        ctx.fillText(nickname, canvas.width / 2, secondRowY);
    }
    
    // 下载GIF
    function downloadGif() {
        if (!generatedGif) {
            alert('请先生成头像');
            return;
        }

        // 创建安全的文件名（避免特殊字符）
        const safeNickname = nickname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
        const safeCharacter = selectedCharacter.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
        const timestamp = new Date().getTime();

        // 根据文件类型确定扩展名
        const isGif = generatedGif.type && generatedGif.type.includes('gif');
        const extension = isGif ? 'gif' : 'png';
        const filename = `lstation_${safeNickname}_${safeCharacter}_${timestamp}.${extension}`;

        // 创建下载链接
        const url = URL.createObjectURL(generatedGif);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`文件已下载: ${filename} (类型: ${generatedGif.type || 'unknown'})`);
    }
    
    // 重置生成器
    function resetGenerator() {
        characterSelect.value = '';
        nicknameInput.value = '';
        selectedCharacter = '';
        nickname = '';
        generatedGif = null;

        // 重新显示参数选择区域
        parameterSection.style.display = 'block';
        previewContainer.style.display = 'none';
        hideLoading();

        // 清理预览元素
        if (previewGif.src) {
            URL.revokeObjectURL(previewGif.src);
            previewGif.src = '';
        }
        previewGif.style.display = 'none';
        previewCanvas.style.display = 'none';

        updateSelectionStatus();
        checkInputs();
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
