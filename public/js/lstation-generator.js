// L站头像生成器
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
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const previewContainer = document.getElementById('preview-container');
    const previewCanvas = document.getElementById('preview-canvas');
    const hiddenCanvas = document.getElementById('hidden-canvas');
    const downloadBtn = document.getElementById('download-gif-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    
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
        };
        logoImage.onerror = function() {
            console.error('Failed to load logo');
        };
        logoImage.src = '/img/logo.png';
    }
    
    // 绑定事件
    function bindEvents() {
        characterSelect.addEventListener('change', function() {
            selectedCharacter = this.value;
            checkInputs();
        });
        
        nicknameInput.addEventListener('input', function() {
            nickname = this.value.trim();
            checkInputs();
        });
        
        generateBtn.addEventListener('click', generateAvatar);
        downloadBtn.addEventListener('click', downloadGif);
        regenerateBtn.addEventListener('click', resetGenerator);
    }
    
    // 检查输入是否完整
    function checkInputs() {
        const isValid = selectedCharacter && nickname;
        generateBtn.disabled = !isValid;
    }
    
    // 更新进度
    function updateProgress(percent, text) {
        progressBar.style.width = percent + '%';
        progressText.textContent = text;
    }
    
    // 生成头像
    async function generateAvatar() {
        try {
            generateBtn.disabled = true;
            progressContainer.style.display = 'block';
            previewContainer.style.display = 'none';

            updateProgress(10, '准备生成图片...');

            // 生成静态图片
            const staticImage = await generateStaticImage();
            updateProgress(30, '生成动画视频...');

            // 生成动画视频
            const animationVideo = await generateAnimationVideo(staticImage);
            updateProgress(60, '检查角色视频...');

            // 尝试加载角色视频
            const characterVideoBlob = await loadCharacterVideo();

            let finalVideo;
            if (characterVideoBlob) {
                updateProgress(80, '合并视频...');
                // 如果有角色视频，进行合并
                finalVideo = await mergeVideos(characterVideoBlob, animationVideo);
            } else {
                updateProgress(80, '跳过视频合并...');
                // 如果没有角色视频，直接使用动画视频
                finalVideo = animationVideo;
            }

            updateProgress(90, '转换为GIF...');

            // 转换为GIF
            generatedGif = await convertToGif(finalVideo);
            updateProgress(100, '生成完成！');

            // 显示预览
            showPreview();

        } catch (error) {
            console.error('生成失败:', error);
            updateProgress(0, '生成失败');
            alert(`生成失败: ${error.message || '未知错误'}，请检查输入并重试`);
        } finally {
            generateBtn.disabled = false;
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 1000);
        }
    }
    
    // 生成静态图片
    function generateStaticImage() {
        return new Promise((resolve) => {
            const canvas = hiddenCanvas;
            const ctx = canvas.getContext('2d');
            
            // 设置画布大小 (1:1比例)
            canvas.width = 400;
            canvas.height = 400;
            
            // 白色背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 第一排：logo和LINUX DO文字
            const firstRowY = 150;
            
            // 绘制logo (左侧)
            if (logoImage && logoImage.complete) {
                const logoSize = 80;
                const logoX = 100;
                ctx.drawImage(logoImage, logoX, firstRowY - logoSize/2, logoSize, logoSize);
            }
            
            // 绘制LINUX DO文字 (右侧)
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('LINUX DO', 200, firstRowY + 8);
            
            // 第二排：用户昵称 (居中，黄色)
            const secondRowY = 280;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(nickname, canvas.width / 2, secondRowY);
            
            // 转换为图片数据
            canvas.toBlob(resolve, 'image/png');
        });
    }
    
    // 生成动画视频 (1.2秒，前0.4秒渐显，后0.8秒保持)
    async function generateAnimationVideo(staticImageBlob) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
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
        try {
            const response = await fetch(videoPath);
            if (!response.ok) {
                console.warn(`角色视频 ${selectedCharacter}.mp4 未找到，跳过视频合并`);
                return null;
            }
            console.log(`成功加载角色视频: ${selectedCharacter}.mp4`);
            return await response.blob();
        } catch (error) {
            console.warn(`角色视频加载失败: ${error.message}，跳过视频合并`);
            return null;
        }
    }
    
    // 合并视频
    async function mergeVideos(characterVideoBlob, animationVideoBlob) {
        if (!characterVideoBlob) {
            console.log('没有角色视频，直接使用动画视频');
            return animationVideoBlob;
        }

        // 这里需要使用FFmpeg.js或类似库来合并视频
        // 目前暂时返回动画视频作为占位
        console.log('角色视频存在，但视频合并功能待实现，暂时使用动画视频');
        return animationVideoBlob;
    }
    
    // 转换为GIF
    async function convertToGif(videoBlob) {
        return new Promise((resolve, reject) => {
            if (typeof GIF === 'undefined') {
                console.warn('GIF.js未加载，返回静态图片');
                resolve(videoBlob);
                return;
            }

            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: 400,
                height: 400
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 400;
            canvas.height = 400;

            const img = new Image();
            img.onload = function() {
                // 生成GIF帧
                const fps = 15; // 降低帧率以减小文件大小
                const totalFrames = Math.floor(1.2 * fps);
                const fadeFrames = Math.floor(0.4 * fps);

                for (let i = 0; i < totalFrames; i++) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // 计算透明度
                    let alpha = 1;
                    if (i < fadeFrames) {
                        alpha = i / fadeFrames;
                    }

                    ctx.globalAlpha = alpha;
                    ctx.drawImage(img, 0, 0);
                    ctx.globalAlpha = 1;

                    // 添加帧到GIF
                    gif.addFrame(canvas, {delay: 1000/fps});
                }

                gif.on('finished', function(blob) {
                    resolve(blob);
                });

                gif.on('progress', function(p) {
                    updateProgress(90 + p * 10, `转换为GIF... ${Math.round(p * 100)}%`);
                });

                gif.render();
            };

            img.onerror = function() {
                reject(new Error('图片加载失败'));
            };

            img.src = URL.createObjectURL(videoBlob);
        });
    }
    
    // 显示预览
    function showPreview() {
        const ctx = previewCanvas.getContext('2d');
        
        // 重新绘制预览图片
        generateStaticImageToCanvas(previewCanvas);
        
        previewContainer.style.display = 'block';
    }
    
    // 在指定canvas上生成静态图片
    function generateStaticImageToCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        
        // 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 第一排：logo和LINUX DO文字
        const firstRowY = 150;
        
        // 绘制logo (左侧)
        if (logoImage && logoImage.complete) {
            const logoSize = 80;
            const logoX = 100;
            ctx.drawImage(logoImage, logoX, firstRowY - logoSize/2, logoSize, logoSize);
        }
        
        // 绘制LINUX DO文字 (右侧)
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('LINUX DO', 200, firstRowY + 8);
        
        // 第二排：用户昵称 (居中，黄色)
        const secondRowY = 280;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px Arial';
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
        const filename = `lstation_${safeNickname}_${safeCharacter}_${timestamp}.gif`;

        // 创建下载链接
        const url = URL.createObjectURL(generatedGif);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`GIF已下载: ${filename}`);
    }
    
    // 重置生成器
    function resetGenerator() {
        characterSelect.value = '';
        nicknameInput.value = '';
        selectedCharacter = '';
        nickname = '';
        generatedGif = null;
        previewContainer.style.display = 'none';
        progressContainer.style.display = 'none';
        checkInputs();
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
