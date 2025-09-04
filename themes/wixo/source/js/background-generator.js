// 动态背景生成器 - v1.0
console.log('动态背景生成器加载 - v1.0');

(function() {
    'use strict';

    // 全局变量
    let currentSize = 'banner'; // 当前选择的尺寸类别
    let currentBackground = 'blank'; // 当前选择的背景预设
    let customBackground = null; // 自定义背景图片
    let backgroundOpacity = 1.0; // 背景透明度
    let stickers = []; // 贴图数组
    let stickerCounter = 0; // 贴图计数器
    let selectedElement = null; // 当前选中的元素
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let logoImage = null; // logo图片

    // 尺寸配置
    const sizeConfig = {
        banner: { width: 1067, height: 300 },
        card: { width: 600, height: 400 }
    };

    // 布局元素配置
    let layoutElements = {
        logo: { x: 50, y: 50, scale: 1, rotation: 0 },
        linuxdo: { x: 150, y: 50, scale: 1, rotation: 0 },
        nickname: { x: 250, y: 50, scale: 1, rotation: 0 }
    };

    // DOM元素获取
    const canvas = document.getElementById('layout-preview-canvas');
    const ctx = canvas.getContext('2d');
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    const hiddenCanvas = document.getElementById('hidden-canvas');
    const hiddenCtx = hiddenCanvas.getContext('2d');
    
    const sizeOptions = document.querySelectorAll('.size-option');
    const backgroundSelector = document.getElementById('background-selector');
    const backgroundSelectorHeader = document.getElementById('background-selector-header');
    const backgroundDropdown = document.getElementById('background-dropdown');
    const selectedBackgroundName = document.querySelector('.selected-background-name');
    const backgroundCards = document.querySelectorAll('.background-card');
    
    const nicknameInput = document.getElementById('nickname');
    const fontSelect = document.getElementById('font-select');
    const colorModeRadios = document.querySelectorAll('input[name="color-mode"]');
    const color1Input = document.getElementById('color1');
    const color2Input = document.getElementById('color2');
    const color1Group = document.getElementById('color1-group');
    const color2Group = document.getElementById('color2-group');
    const gradientAngleGroup = document.getElementById('gradient-angle-group');
    const angleIndicator = document.getElementById('angle-indicator');
    const angleValue = document.getElementById('angle-value');
    
    const generateBtn = document.getElementById('generate-btn');
    const customBgBtn = document.getElementById('custom-bg-btn');
    const addStickerBtn = document.getElementById('add-sticker-btn');
    const resetLayoutBtn = document.getElementById('reset-layout-btn');
    const bgFileInput = document.getElementById('bg-file-input');
    const stickerFileInput = document.getElementById('sticker-file-input');
    const bgOpacityControl = document.getElementById('bg-opacity-control');
    const bgOpacitySlider = document.getElementById('bg-opacity-slider');
    const bgOpacityValue = document.getElementById('bg-opacity-value');
    
    const parameterSection = document.getElementById('parameter-section');
    const previewContainer = document.getElementById('preview-container');
    const loadingContainer = document.getElementById('loading-container');
    const loadingText = document.getElementById('loading-text');
    const downloadGifBtn = document.getElementById('download-gif-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');

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

    // 初始化
    function init() {
        // 检查画布是否存在
        if (!canvas) {
            console.error('画布元素未找到');
            return;
        }

        // 加载logo图片
        loadLogo();

        // 设置初始画布尺寸
        updateCanvasSize();

        // 绑定事件监听器
        bindEventListeners();

        // 初始化布局元素位置
        initializeLayoutElements();

        // 更新预览
        updateLayoutPreview();
    }

    // 绑定事件监听器
    function bindEventListeners() {
        // 尺寸选择
        sizeOptions.forEach(option => {
            option.addEventListener('click', handleSizeChange);
        });

        // 背景预设选择
        backgroundSelectorHeader.addEventListener('click', toggleBackgroundDropdown);
        backgroundCards.forEach(card => {
            card.addEventListener('click', handleBackgroundChange);
        });

        // 表单输入
        nicknameInput.addEventListener('input', updateLayoutPreview);
        fontSelect.addEventListener('change', updateLayoutPreview);
        colorModeRadios.forEach(radio => {
            radio.addEventListener('change', updateColorMode);
        });
        color1Input.addEventListener('input', updateLayoutPreview);
        color2Input.addEventListener('input', updateLayoutPreview);

        // 初始化角度调整
        initAngleAdjust();

        // 按钮事件
        generateBtn.addEventListener('click', generateBackground);
        customBgBtn.addEventListener('click', () => bgFileInput.click());
        addStickerBtn.addEventListener('click', () => stickerFileInput.click());
        resetLayoutBtn.addEventListener('click', resetLayout);
        
        // 文件上传
        bgFileInput.addEventListener('change', handleBackgroundUpload);
        stickerFileInput.addEventListener('change', handleStickerUpload);
        
        // 背景透明度滑块事件
        bgOpacitySlider.addEventListener('input', function() {
            backgroundOpacity = this.value / 100;
            bgOpacityValue.textContent = this.value + '%';
            updateLayoutPreview();
        });

        // 画布交互事件
        canvas.addEventListener('mousedown', handleCanvasMouseDown);
        canvas.addEventListener('mousemove', handleCanvasMouseMove);
        canvas.addEventListener('mouseup', handleCanvasMouseUp);
        canvas.addEventListener('click', handleCanvasClick);

        // 键盘事件
        document.addEventListener('keydown', handleKeyDown);

        // 预览控制按钮
        downloadGifBtn.addEventListener('click', downloadGif);
        regenerateBtn.addEventListener('click', resetGenerator);

        // 点击外部关闭下拉框
        document.addEventListener('click', function(e) {
            if (!backgroundSelector.contains(e.target)) {
                backgroundSelector.classList.remove('open');
            }
        });
    }

    // 更新画布尺寸
    function updateCanvasSize() {
        const size = sizeConfig[currentSize];
        canvas.width = size.width;
        canvas.height = size.height;
        previewCanvas.width = size.width;
        previewCanvas.height = size.height;
        hiddenCanvas.width = size.width;
        hiddenCanvas.height = size.height;
        
        // 重新初始化布局元素位置
        initializeLayoutElements();
    }

    // 初始化布局元素位置
    function initializeLayoutElements() {
        const size = sizeConfig[currentSize];
        const centerY = size.height / 2;
        
        layoutElements = {
            logo: { 
                x: size.width * 0.1, 
                y: centerY, 
                scale: currentSize === 'banner' ? 0.8 : 1, 
                rotation: 0 
            },
            linuxdo: { 
                x: size.width * 0.3, 
                y: centerY, 
                scale: currentSize === 'banner' ? 0.8 : 1, 
                rotation: 0 
            },
            nickname: { 
                x: size.width * 0.6, 
                y: centerY, 
                scale: currentSize === 'banner' ? 0.8 : 1, 
                rotation: 0 
            }
        };
    }

    // 处理尺寸变化
    function handleSizeChange(e) {
        // 移除所有选中状态
        sizeOptions.forEach(opt => opt.classList.remove('selected'));
        // 添加选中状态
        e.currentTarget.classList.add('selected');
        
        // 更新当前尺寸
        currentSize = e.currentTarget.dataset.size;
        
        // 更新画布尺寸
        updateCanvasSize();
        
        // 更新预览
        updateLayoutPreview();
        
        console.log('尺寸已切换到:', currentSize);
    }

    // 切换背景下拉框
    function toggleBackgroundDropdown() {
        backgroundSelector.classList.toggle('open');
    }

    // 处理背景预设变化
    function handleBackgroundChange(e) {
        const backgroundValue = e.currentTarget.dataset.value;
        const backgroundName = e.currentTarget.querySelector('.background-name').textContent;
        
        currentBackground = backgroundValue;
        selectedBackgroundName.textContent = backgroundName;
        backgroundSelector.classList.remove('open');
        
        // 如果选择了自定义背景，清除预设背景
        if (backgroundValue === 'blank') {
            customBackground = null;
            bgOpacityControl.style.display = 'none';
        }
        
        updateLayoutPreview();
        console.log('背景预设已切换到:', backgroundValue);
    }

    // 更新颜色模式显示
    function updateColorMode() {
        const selectedMode = document.querySelector('input[name="color-mode"]:checked').value;

        if (selectedMode === 'gradient') {
            color2Group.style.display = 'block';
            gradientAngleGroup.style.display = 'block';
        } else {
            color2Group.style.display = 'none';
            gradientAngleGroup.style.display = 'none';
        }

        updateLayoutPreview();
    }

    // 角度调整相关变量
    let gradientAngle = 90;
    let isDraggingAngle = false;

    // 更新角度指示器位置
    function updateAngleIndicator() {
        const percentage = (gradientAngle / 360) * 100;
        angleIndicator.style.left = percentage + '%';
        angleValue.value = gradientAngle;
    }

    // 根据鼠标位置计算角度
    function calculateAngleFromPosition(clientX) {
        const rect = document.getElementById('angle-input-container').getBoundingClientRect();
        const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        return Math.round((percentage / 100) * 360);
    }

    // 开始角度调整
    function startAngleAdjust(e) {
        e.preventDefault();

        let clickCount = 0;
        let clickTimer = null;

        clickCount++;

        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                if (clickCount === 1) {
                    // 单击开始拖拽
                    isDraggingAngle = true;
                    const angleContainer = document.getElementById('angle-input-container');
                    angleContainer.classList.add('active');

                    const newAngle = calculateAngleFromPosition(e.clientX);
                    gradientAngle = newAngle;
                    updateAngleIndicator();
                    updateLayoutPreview();

                    clickCount = 0;
                }
            }, 300);
        } else if (clickCount === 2) {
            // 双击重置为90度
            clearTimeout(clickTimer);
            gradientAngle = 90;
            updateAngleIndicator();
            updateLayoutPreview();
            clickCount = 0;
        }
    }

    // 初始化角度调整事件
    function initAngleAdjust() {
        const angleContainer = document.getElementById('angle-input-container');
        if (!angleContainer) return;

        // 鼠标按下事件
        angleContainer.addEventListener('mousedown', startAngleAdjust);

        // 鼠标移动事件
        document.addEventListener('mousemove', function(e) {
            if (isDraggingAngle) {
                const newAngle = calculateAngleFromPosition(e.clientX);
                gradientAngle = newAngle;
                updateAngleIndicator();
                updateLayoutPreview();
            }
        });

        // 鼠标释放事件
        document.addEventListener('mouseup', function() {
            if (isDraggingAngle) {
                isDraggingAngle = false;
                const angleContainer = document.getElementById('angle-input-container');
                angleContainer.classList.remove('active');
            }
        });

        // 角度值输入框事件
        const angleValueInput = document.getElementById('angle-value');
        if (angleValueInput) {
            angleValueInput.addEventListener('click', function() {
                this.readOnly = false;
                this.select();
            });

            angleValueInput.addEventListener('blur', function() {
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

            angleValueInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                } else if (e.key === 'Escape') {
                    this.value = gradientAngle;
                    this.readOnly = true;
                    this.blur();
                }
            });
        }

        // 初始化位置
        updateAngleIndicator();
    }

    // 更新布局预览
    function updateLayoutPreview() {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制背景
        drawBackground(ctx);

        // 绘制布局元素
        drawLayoutElements(ctx);
    }

    // 绘制背景
    function drawBackground(context) {
        const size = sizeConfig[currentSize];

        // 绘制基础背景色
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size.width, size.height);

        // 绘制自定义背景（如果有）
        if (customBackground) {
            context.globalAlpha = backgroundOpacity;
            drawImageCover(context, customBackground, 0, 0, size.width, size.height);
            context.globalAlpha = 1.0;
        }
        // 绘制预设背景
        else if (currentBackground === 'matrix') {
            drawMatrixBackground(context, size);
        } else if (currentBackground === 'gradient') {
            drawGradientBackground(context, size);
        } else if (currentBackground === 'particles') {
            drawParticlesBackground(context, size);
        }
    }

    // 绘制Matrix背景（静态版本，用于右侧预览）
    function drawMatrixBackground(context, size) {
        // 黑色背景
        context.fillStyle = '#000000';
        context.fillRect(0, 0, size.width, size.height);

        // Matrix字符集
        const charSets = [
            "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン123456789",
            "ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴァィゥェォャュョッABCDEFGHIJKLMNOPQRSTUVWXYZ",
            "アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロヲン0987654321",
            "ンヲロヨモホノトソコオレメヘネテセケエルユムフヌツスクウリミヒニチシキイワラヤマハナタサカア",
            "ガザダバパギジヂビピグズヅブプゲゼデベペゴゾドボポヴァィゥェォャュョッ!@#$%^&*()_+-=[]{}|;:,.<>?"
        ];

        const columnWidth = 25;
        const columns = Math.floor(size.width / columnWidth);
        const fontSize = 16;
        const lineHeight = 18;

        context.font = `bold ${fontSize}px monospace`;
        context.textAlign = 'center';

        // 绘制每一列（静态显示，显示动画0%时的状态）
        for (let col = 0; col < columns; col++) {
            const x = col * columnWidth + columnWidth / 2;
            const charSet = charSets[col % charSets.length];
            const columnHeight = Math.floor(size.height / lineHeight) + 10;

            // 静态显示：显示完整的字符流，从顶部开始
            for (let row = 0; row < columnHeight; row++) {
                const y = row * lineHeight;

                if (y < size.height + lineHeight) {
                    // 使用固定的字符索引，避免随机闪烁
                    const charIndex = (col * 7 + row * 3) % charSet.length;
                    const char = charSet[charIndex];

                    // 创建渐变效果（从白色到绿色到透明）
                    const progress = row / columnHeight;
                    let color;

                    if (progress < 0.05) {
                        color = '#ffffff'; // 顶部白色
                    } else if (progress < 0.1) {
                        color = '#ffffff';
                    } else if (progress < 0.2) {
                        color = '#00ff41'; // 亮绿色
                    } else if (progress < 0.3) {
                        color = '#00dd33';
                    } else if (progress < 0.4) {
                        color = '#00bb22';
                    } else if (progress < 0.5) {
                        color = '#009911';
                    } else if (progress < 0.6) {
                        color = '#007700';
                    } else if (progress < 0.7) {
                        color = '#005500';
                    } else if (progress < 0.8) {
                        color = '#003300';
                    } else if (progress < 0.9) {
                        const alpha = 1 - (progress - 0.8) * 5;
                        color = `rgba(0, 255, 65, ${alpha * 0.5})`;
                    } else {
                        color = 'transparent';
                    }

                    if (color !== 'transparent') {
                        context.fillStyle = color;
                        context.fillText(char, x, y);
                    }
                }
            }
        }
    }

    // 绘制彩虹渐变背景
    function drawGradientBackground(context, size) {
        const gradient = context.createLinearGradient(0, 0, size.width, size.height);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.16, '#ff7f00');
        gradient.addColorStop(0.33, '#ffff00');
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(0.66, '#0000ff');
        gradient.addColorStop(0.83, '#4b0082');
        gradient.addColorStop(1, '#9400d3');

        context.fillStyle = gradient;
        context.fillRect(0, 0, size.width, size.height);
    }

    // 绘制粒子背景
    function drawParticlesBackground(context, size) {
        // 绘制深蓝色渐变背景
        const gradient = context.createRadialGradient(
            size.width/2, size.height/2, 0,
            size.width/2, size.height/2, Math.max(size.width, size.height)/2
        );
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(1, '#2a5298');

        context.fillStyle = gradient;
        context.fillRect(0, 0, size.width, size.height);

        // 绘制粒子
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const particleCount = Math.floor((size.width * size.height) / 5000);

        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * size.width;
            const y = Math.random() * size.height;
            const radius = Math.random() * 2 + 0.5;

            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
    }

    // 绘制布局元素
    function drawLayoutElements(context) {
        // 绘制Logo
        drawLayoutElement(context, 'logo');

        // 绘制LINUX DO文字
        drawLayoutElement(context, 'linuxdo');

        // 绘制昵称
        drawLayoutElement(context, 'nickname');

        // 绘制贴图
        stickers.forEach(sticker => {
            drawLayoutElement(context, sticker.id);
        });
    }

    // 绘制单个布局元素
    function drawLayoutElement(context, elementId) {
        const element = layoutElements[elementId];
        if (!element) return;

        context.save();
        context.translate(element.x, element.y);
        context.rotate(element.rotation * Math.PI / 180);
        context.scale(element.scale, element.scale);

        // 绘制选中边框
        if (selectedElement === elementId) {
            context.strokeStyle = '#ff6600';
            context.lineWidth = 2;
            context.setLineDash([5, 5]);

            let bounds = getElementBounds(elementId);
            context.strokeRect(-bounds.width/2, -bounds.height/2, bounds.width, bounds.height);
            context.setLineDash([]);
        }

        // 根据元素类型绘制内容
        switch(elementId) {
            case 'logo':
                drawLogo(context);
                break;
            case 'linuxdo':
                drawLinuxDoText(context);
                break;
            case 'nickname':
                drawNickname(context);
                break;
            default:
                if (elementId.startsWith('sticker')) {
                    drawSticker(context, elementId);
                }
                break;
        }

        context.restore();
    }

    // 绘制Logo
    function drawLogo(context) {
        const size = 40;

        // 如果logo图片已加载，绘制实际图片
        if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
            context.drawImage(logoImage, -size/2, -size/2, size, size);
        } else {
            // 否则绘制占位框
            context.fillStyle = '#f0f0f0';
            context.fillRect(-size/2, -size/2, size, size);

            // 绘制占位文字
            context.fillStyle = '#666666';
            context.font = 'bold 8px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('LOGO', 0, 0);
        }
    }

    // 绘制LINUX DO文字
    function drawLinuxDoText(context) {
        context.fillStyle = '#000000';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('LINUX DO', 0, 0);
    }

    // 绘制昵称
    function drawNickname(context) {
        const nickname = nicknameInput.value || '昵称';
        const font = fontSelect.value;
        const colorMode = document.querySelector('input[name="color-mode"]:checked').value;

        context.font = `bold 28px ${font}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        if (colorMode === 'gradient') {
            const angle = gradientAngle * Math.PI / 180;
            const gradient = context.createLinearGradient(
                -50 * Math.cos(angle), -50 * Math.sin(angle),
                50 * Math.cos(angle), 50 * Math.sin(angle)
            );
            gradient.addColorStop(0, color1Input.value);
            gradient.addColorStop(1, color2Input.value);
            context.fillStyle = gradient;
        } else {
            context.fillStyle = color1Input.value;
        }

        context.fillText(nickname, 0, 0);
    }

    // 绘制贴图
    function drawSticker(context, stickerId) {
        const sticker = stickers.find(s => s.id === stickerId);
        if (!sticker || !sticker.image) return;

        const size = 50;
        context.drawImage(sticker.image, -size/2, -size/2, size, size);
    }

    // 获取元素边界
    function getElementBounds(elementId) {
        switch(elementId) {
            case 'logo':
                return { width: 40, height: 40 };
            case 'linuxdo':
                return { width: 120, height: 30 };
            case 'nickname':
                return { width: 100, height: 35 };
            default:
                if (elementId.startsWith('sticker')) {
                    return { width: 50, height: 50 };
                }
                return { width: 50, height: 50 };
        }
    }

    // 获取画布坐标（考虑缩放）
    function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        return { x, y };
    }

    // 画布鼠标事件处理
    function handleCanvasMouseDown(e) {
        const coords = getCanvasCoordinates(e);

        // 检查是否点击了某个元素
        const clickedElement = getElementAtPosition(coords.x, coords.y);

        if (clickedElement) {
            selectedElement = clickedElement;
            isDragging = true;
            dragOffset.x = coords.x - layoutElements[clickedElement].x;
            dragOffset.y = coords.y - layoutElements[clickedElement].y;
            updateLayoutPreview();
        } else {
            selectedElement = null;
            updateLayoutPreview();
        }
    }

    function handleCanvasMouseMove(e) {
        if (!isDragging || !selectedElement) return;

        const coords = getCanvasCoordinates(e);

        layoutElements[selectedElement].x = coords.x - dragOffset.x;
        layoutElements[selectedElement].y = coords.y - dragOffset.y;

        updateLayoutPreview();
    }

    function handleCanvasMouseUp() {
        isDragging = false;
    }

    function handleCanvasClick() {
        // 点击事件在mousedown中处理
    }

    // 获取指定位置的元素
    function getElementAtPosition(x, y) {
        // 按z-index顺序检查（贴图 > 昵称 > linuxdo > logo）
        const elements = ['nickname', 'linuxdo', 'logo'];

        // 先检查贴图
        for (let sticker of stickers) {
            if (isPointInElement(x, y, sticker.id)) {
                return sticker.id;
            }
        }

        // 再检查其他元素
        for (let elementId of elements) {
            if (isPointInElement(x, y, elementId)) {
                return elementId;
            }
        }

        return null;
    }

    // 检查点是否在元素内
    function isPointInElement(x, y, elementId) {
        const element = layoutElements[elementId];
        if (!element) return false;

        const bounds = getElementBounds(elementId);
        const halfWidth = bounds.width / 2 * element.scale;
        const halfHeight = bounds.height / 2 * element.scale;

        return x >= element.x - halfWidth && x <= element.x + halfWidth &&
               y >= element.y - halfHeight && y <= element.y + halfHeight;
    }

    // 键盘事件处理
    function handleKeyDown(e) {
        if (!selectedElement) return;

        const element = layoutElements[selectedElement];
        let updated = false;

        switch(e.key) {
            case 'q':
            case 'Q':
                element.rotation = (element.rotation - 15) % 360;
                updated = true;
                break;
            case 'e':
            case 'E':
                element.rotation = (element.rotation + 15) % 360;
                updated = true;
                break;
            case '=':
            case '+':
                if (selectedElement.startsWith('sticker')) {
                    element.scale = element.scale * 1.1;
                } else {
                    element.scale = Math.min(3, element.scale * 1.1);
                }
                updated = true;
                break;
            case '-':
            case '_':
                if (selectedElement.startsWith('sticker')) {
                    element.scale = Math.max(0.01, element.scale * 0.9);
                } else {
                    element.scale = Math.max(0.2, element.scale * 0.9);
                }
                updated = true;
                break;
            case 'r':
            case 'R':
                element.rotation = 0;
                element.scale = 1;
                updated = true;
                break;
            case 'Delete':
            case 'Backspace':
                if (selectedElement) {
                    if (selectedElement.startsWith('sticker')) {
                        deleteSticker(selectedElement);
                    } else {
                        // 其他元素不能删除，只能重置
                        const element = layoutElements[selectedElement];
                        if (element) {
                            element.rotation = 0;
                            element.scale = selectedElement === 'logo' || selectedElement === 'linuxdo' || selectedElement === 'nickname' ?
                                (currentSize === 'banner' ? 0.8 : 1) : 1;
                            updateLayoutPreview();
                        }
                    }
                    e.preventDefault();
                }
                return;
        }

        if (updated) {
            updateLayoutPreview();
            e.preventDefault();
        }
    }

    // 文件上传处理
    function handleBackgroundUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                customBackground = img;
                currentBackground = 'blank';
                selectedBackgroundName.textContent = '自定义背景';
                bgOpacityControl.style.display = 'block';
                updateLayoutPreview();
                console.log('自定义背景已加载');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);

        event.target.value = '';
    }

    function handleStickerUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const stickerId = 'sticker' + (++stickerCounter);
                const size = sizeConfig[currentSize];

                const sticker = {
                    id: stickerId,
                    image: img
                };

                stickers.push(sticker);

                layoutElements[stickerId] = {
                    x: size.width / 2,
                    y: size.height / 2,
                    scale: 1,
                    rotation: 0
                };

                selectedElement = stickerId;
                updateLayoutPreview();
                console.log('贴图已添加:', stickerId);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);

        event.target.value = '';
    }

    // 删除贴图
    function deleteSticker(stickerId) {
        if (!stickerId || !stickerId.startsWith('sticker')) {
            console.warn('无效的贴图ID:', stickerId);
            return;
        }

        if (layoutElements[stickerId]) {
            delete layoutElements[stickerId];
        }

        stickers = stickers.filter(sticker => sticker.id !== stickerId);

        if (selectedElement === stickerId) {
            selectedElement = null;
        }

        updateLayoutPreview();
        console.log('贴图已删除:', stickerId);
    }

    // 重置布局
    function resetLayout() {
        if (confirm('确定要重置布局吗？这将清除所有自定义设置。')) {
            customBackground = null;
            backgroundOpacity = 1.0;
            bgOpacityControl.style.display = 'none';
            bgOpacitySlider.value = 100;
            bgOpacityValue.textContent = '100%';
            stickers = [];
            stickerCounter = 0;
            selectedElement = null;
            currentBackground = 'blank';
            selectedBackgroundName.textContent = '空白预设';

            initializeLayoutElements();
            updateLayoutPreview();
            console.log('布局已重置');
        }
    }

    // 工具函数：按比例绘制图片
    function drawImageCover(ctx, img, x, y, width, height) {
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
            drawHeight = height;
            drawWidth = height * imgRatio;
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = width;
            drawHeight = width / imgRatio;
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
        }

        ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
    }

    // 生成动态背景
    function generateBackground() {
        console.log('开始生成动态背景');

        try {
            // 隐藏主容器，显示加载动画
            const mainContainer = document.querySelector('.background-generator-container');
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }
            showLoading('准备生成背景...');
            previewContainer.style.display = 'none';

            // 延迟执行生成过程，让加载动画显示
            setTimeout(() => {
                generateAnimatedBackground();
            }, 100);

        } catch (error) {
            console.error('生成背景时出错:', error);
            alert('生成失败，请重试');
            hideLoading();
        }
    }

    // 生成动画背景
    function generateAnimatedBackground() {
        const size = sizeConfig[currentSize];

        // 检查GIF库是否加载
        if (typeof GIF === 'undefined') {
            console.error('GIF.js未加载');
            alert('GIF生成库未加载，请刷新页面重试');
            hideLoading();
            return;
        }

        // 清除选中状态，避免选框被包含在生成的图片中
        const previousSelectedElement = selectedElement;
        selectedElement = null;

        // 创建GIF生成器
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: size.width,
            height: size.height,
            workerScript: '/js/gif.worker.js'
        });

        const frameCount = 30; // 30帧动画
        const frameDuration = 100; // 每帧100ms

        updateLoadingText('生成动画帧...');

        // 生成动画帧
        for (let frame = 0; frame < frameCount; frame++) {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = size.width;
            frameCanvas.height = size.height;
            const frameCtx = frameCanvas.getContext('2d');

            // 绘制背景（带动画效果）
            drawAnimatedBackground(frameCtx, size, frame, frameCount);

            // 绘制布局元素
            drawLayoutElements(frameCtx);

            // 添加帧到GIF
            gif.addFrame(frameCanvas, { delay: frameDuration });
        }

        updateLoadingText('正在生成GIF...');

        // 渲染GIF
        gif.on('finished', function(blob) {
            console.log('GIF生成完成');
            // 恢复选中状态
            selectedElement = previousSelectedElement;
            showPreview(blob);
        });

        gif.on('progress', function(p) {
            const percent = Math.round(p * 100);
            updateLoadingText(`生成进度: ${percent}%`);
        });

        gif.render();
    }

    // 绘制动画背景
    function drawAnimatedBackground(context, size, frame, totalFrames) {
        // 绘制基础背景色
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size.width, size.height);

        // 绘制自定义背景（如果有）
        if (customBackground) {
            context.globalAlpha = backgroundOpacity;
            drawImageCover(context, customBackground, 0, 0, size.width, size.height);
            context.globalAlpha = 1.0;
        }
        // 绘制动画预设背景
        else if (currentBackground === 'matrix') {
            drawAnimatedMatrixBackground(context, size, frame, totalFrames);
        } else if (currentBackground === 'gradient') {
            drawAnimatedGradientBackground(context, size, frame, totalFrames);
        } else if (currentBackground === 'particles') {
            drawAnimatedParticlesBackground(context, size, frame, totalFrames);
        }
    }

    // 绘制动画Matrix背景
    function drawAnimatedMatrixBackground(context, size, frame, totalFrames) {
        // 黑色背景
        context.fillStyle = '#000000';
        context.fillRect(0, 0, size.width, size.height);

        // Matrix字符集
        const charSets = [
            "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン123456789",
            "ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴァィゥェォャュョッABCDEFGHIJKLMNOPQRSTUVWXYZ",
            "アカサタナハマヤラワイキシチニヒミリウクスツヌフムユルエケセテネヘメレオコソトノホモヨロヲン0987654321",
            "ンヲロヨモホノトソコオレメヘネテセケエルユムフヌツスクウリミヒニチシキイワラヤマハナタサカア",
            "ガザダバパギジヂビピグズヅブプゲゼデベペゴゾドボポヴァィゥェォャュョッ!@#$%^&*()_+-=[]{}|;:,.<>?"
        ];

        const columnWidth = 25;
        const columns = Math.floor(size.width / columnWidth);
        const fontSize = 16;
        const lineHeight = 18;

        context.font = `bold ${fontSize}px monospace`;
        context.textAlign = 'center';

        // 动画进度
        const animationProgress = frame / totalFrames;

        // 绘制每一列
        for (let col = 0; col < columns; col++) {
            const x = col * columnWidth + columnWidth / 2;
            const charSet = charSets[col % charSets.length];

            // 每列不同的动画速度和延迟
            const columnDelay = (col * 0.1) % 1;
            const columnSpeed = 2.5 + (col % 3) * 0.5; // 2.5-4.0秒的不同速度
            const adjustedProgress = ((animationProgress + columnDelay) * columnSpeed) % 1;

            const columnHeight = Math.floor(size.height / lineHeight) + 20;
            const startY = -columnHeight * lineHeight + adjustedProgress * (size.height + columnHeight * lineHeight);

            // 绘制字符流
            for (let row = 0; row < columnHeight; row++) {
                const y = startY + row * lineHeight;

                if (y > -lineHeight && y < size.height + lineHeight) {
                    // 随机选择字符，但在动画过程中保持一定的稳定性
                    const charIndex = Math.floor((col * 7 + row * 3 + Math.floor(animationProgress * 10)) % charSet.length);
                    const char = charSet[charIndex];

                    // 计算在流中的位置（0=顶部，1=底部）
                    const positionInStream = row / columnHeight;

                    // 创建渐变效果
                    let color;
                    if (positionInStream < 0.05) {
                        color = '#ffffff'; // 顶部亮白色
                    } else if (positionInStream < 0.1) {
                        color = '#ffffff';
                    } else if (positionInStream < 0.2) {
                        color = '#00ff41'; // 亮绿色
                    } else if (positionInStream < 0.3) {
                        color = '#00dd33';
                    } else if (positionInStream < 0.4) {
                        color = '#00bb22';
                    } else if (positionInStream < 0.5) {
                        color = '#009911';
                    } else if (positionInStream < 0.6) {
                        color = '#007700';
                    } else if (positionInStream < 0.7) {
                        color = '#005500';
                    } else if (positionInStream < 0.8) {
                        color = '#003300';
                    } else if (positionInStream < 0.9) {
                        const alpha = 1 - (positionInStream - 0.8) * 5;
                        color = `rgba(0, 255, 65, ${alpha * 0.5})`;
                    } else {
                        const alpha = Math.max(0, 1 - (positionInStream - 0.9) * 10);
                        color = `rgba(0, 255, 65, ${alpha * 0.2})`;
                    }

                    context.fillStyle = color;
                    context.fillText(char, x, y);
                }
            }
        }
    }

    // 绘制动画彩虹渐变背景
    function drawAnimatedGradientBackground(context, size, frame, totalFrames) {
        const progress = frame / totalFrames;
        const angle = progress * Math.PI * 2;

        const gradient = context.createLinearGradient(
            size.width/2 + Math.cos(angle) * size.width/2,
            size.height/2 + Math.sin(angle) * size.height/2,
            size.width/2 - Math.cos(angle) * size.width/2,
            size.height/2 - Math.sin(angle) * size.height/2
        );

        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.16, '#ff7f00');
        gradient.addColorStop(0.33, '#ffff00');
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(0.66, '#0000ff');
        gradient.addColorStop(0.83, '#4b0082');
        gradient.addColorStop(1, '#9400d3');

        context.fillStyle = gradient;
        context.fillRect(0, 0, size.width, size.height);
    }

    // 绘制动画粒子背景
    function drawAnimatedParticlesBackground(context, size, frame, totalFrames) {
        // 绘制深蓝色渐变背景
        const gradient = context.createRadialGradient(
            size.width/2, size.height/2, 0,
            size.width/2, size.height/2, Math.max(size.width, size.height)/2
        );
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(1, '#2a5298');

        context.fillStyle = gradient;
        context.fillRect(0, 0, size.width, size.height);

        // 绘制动画粒子
        const progress = frame / totalFrames;
        const particleCount = Math.floor((size.width * size.height) / 5000);

        for (let i = 0; i < particleCount; i++) {
            const seed = i * 0.1;
            const x = ((seed * 1000 + progress * 100) % 1) * size.width;
            const y = ((seed * 1500 + progress * 80) % 1) * size.height;
            const radius = Math.sin(progress * Math.PI * 2 + seed) * 1.5 + 2;
            const alpha = Math.sin(progress * Math.PI * 4 + seed) * 0.3 + 0.7;

            context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            context.beginPath();
            context.arc(x, y, Math.max(0.5, radius), 0, Math.PI * 2);
            context.fill();
        }
    }

    // 显示预览
    function showPreview(blob) {
        hideLoading();

        // 确保主容器隐藏
        const mainContainer = document.querySelector('.background-generator-container');
        if (mainContainer) {
            mainContainer.style.display = 'none';
        }

        // 根据当前尺寸类型设置预览容器样式
        previewContainer.className = '';
        previewContainer.classList.add(`preview-${currentSize}`);

        // 创建预览图片
        const url = URL.createObjectURL(blob);
        const previewGif = document.getElementById('preview-gif');
        previewGif.src = url;
        previewGif.style.display = 'block';

        // 隐藏canvas预览
        const previewCanvas = document.getElementById('preview-canvas');
        previewCanvas.style.display = 'none';

        // 显示预览容器
        previewContainer.style.display = 'block';

        // 存储blob用于下载
        window.generatedBlob = blob;

        console.log('预览显示完成，类型:', currentSize);
    }

    // 下载GIF
    function downloadGif() {
        if (!window.generatedBlob) {
            alert('没有可下载的内容');
            return;
        }

        const url = URL.createObjectURL(window.generatedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `动态背景_${currentSize}_${Date.now()}.gif`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('GIF下载完成');
    }

    // 重置生成器
    function resetGenerator() {
        // 重新显示主容器（现在统一使用block布局）
        const mainContainer = document.querySelector('.background-generator-container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
        }
        previewContainer.style.display = 'none';
        hideLoading();

        // 清理生成的blob
        if (window.generatedBlob) {
            URL.revokeObjectURL(window.generatedBlob);
            delete window.generatedBlob;
        }

        console.log('生成器已重置');
    }

    // 显示加载动画
    function showLoading(text) {
        loadingText.textContent = text || '加载中...';
        loadingContainer.style.display = 'flex';
    }

    // 隐藏加载动画
    function hideLoading() {
        loadingContainer.style.display = 'none';
    }

    // 更新加载文本
    function updateLoadingText(text) {
        loadingText.textContent = text;
    }

    // 页面加载完成后初始化
    document.addEventListener('DOMContentLoaded', init);

})();
