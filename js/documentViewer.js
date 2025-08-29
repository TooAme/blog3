/**
 * 博客文档查看器 - 支持PDF、Word、Excel、PPT等文件的嵌入显示
 * 作者: Stone Ocean
 * 功能: 在博客中嵌入和预览各种文档格式
 */

class DocumentViewer {
    constructor() {
        this.init();
        this.injectGlobalWPSStyles();
    }

    init() {
        // 页面加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeViewers());
        } else {
            this.initializeViewers();
        }
    }

    initializeViewers() {
        // 查找所有文档嵌入元素
        const docElements = document.querySelectorAll('[data-doc-viewer]');
        docElements.forEach(element => {
            this.createViewer(element);
        });
    }

    createViewer(element) {
        // 防止重复初始化
        if (element.hasAttribute('data-doc-viewer-initialized')) {
            return;
        }
        element.setAttribute('data-doc-viewer-initialized', 'true');

        const fileUrl = element.getAttribute('data-file-url');
        const fileType = element.getAttribute('data-file-type') || this.getFileType(fileUrl);
        const width = element.getAttribute('data-width') || '100%';
        const height = element.getAttribute('data-height') || '600px';
        const title = element.getAttribute('data-title') || '文档预览';

        if (!fileUrl) {
            console.error('DocumentViewer: 缺少文件URL');
            return;
        }

        // 创建查看器容器
        const container = this.createContainer(width, height, title, fileUrl, fileType);
        const viewer = this.createViewerByType(fileType, fileUrl, width, height);
        
        if (viewer) {
            container._contentArea.appendChild(viewer);
            element.appendChild(container);
        } else if (fileType.toLowerCase() === 'other') {
            // other类型只显示标题栏，不显示内容区域
            element.appendChild(container);
        } else {
            // 如果无法创建查看器，显示下载链接
            const downloadLink = this.createDownloadLink(fileUrl, title);
            element.appendChild(downloadLink);
        }
    }

    createContainer(width, height, title, fileUrl, fileType = '') {
        const container = document.createElement('div');
        container.className = 'doc-viewer-container';
        container.style.cssText = `
            width: ${width};
            height: ${height};
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        // 添加标题栏
        const titleBar = document.createElement('div');
        titleBar.className = 'doc-viewer-title';
        titleBar.style.cssText = `
            background: #f5f5f5;
            padding: 10px 15px;
            border-bottom: 1px solid #ddd;
            font-weight: 500;
            color: #333;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
        `;

        // 折叠/展开按钮（other类型不显示）
        const toggleBtn = document.createElement('button');
        if (fileType.toLowerCase() !== 'other') {
            toggleBtn.innerHTML = '▶';
            toggleBtn.title = '折叠/展开';
            toggleBtn.className = 'doc-viewer-toggle-btn';
            toggleBtn.style.cssText = `
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                color: #6c757d;
                transition: all 0.2s;
                font-size: 12px;
                margin-right: 8px;
            `;
            titleBar.appendChild(toggleBtn);
        }

        // 标题文本
        const titleText = document.createElement('span');
        titleText.textContent = title;
        titleText.style.cssText = `
            flex: 1;
        `;
        titleBar.appendChild(titleText);

        // 按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        // 下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = `<img src="/assets/download.svg" alt="下载" style="width: 16px; height: 16px;">`;
        downloadBtn.title = '下载文件';
        downloadBtn.className = 'doc-viewer-download-btn';
        downloadBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            color: #6c757d;
            transition: all 0.2s;
            font-size: 14px;
        `;
        downloadBtn.onclick = (e) => {
            e.stopPropagation();
            this.downloadFile(fileUrl, title);
        };
        buttonContainer.appendChild(downloadBtn);

        titleBar.appendChild(buttonContainer);
        container.appendChild(titleBar);

        // 内容区域
        const contentArea = document.createElement('div');
        contentArea.className = 'doc-viewer-content';
        contentArea.style.cssText = `
            height: 0;
            overflow: hidden;
            transition: height 0.3s ease;
        `;
        container.appendChild(contentArea);

        // 折叠/展开功能（other类型不需要）
        if (fileType.toLowerCase() === 'other') {
            // other类型只显示标题栏，固定高度
            container.style.height = '45px';
            contentArea.style.display = 'none';
        } else {
            // 其他类型的折叠/展开功能
            let isCollapsed = true;
            container.style.height = '45px';

            const toggleCollapse = () => {
                isCollapsed = !isCollapsed;
                if (isCollapsed) {
                    contentArea.style.height = '0';
                    toggleBtn.innerHTML = '▶';
                    container.style.height = '45px';
                } else {
                    contentArea.style.height = `calc(${height} - 45px)`;
                    toggleBtn.innerHTML = '▼';
                    container.style.height = height;
                }
            };

            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                toggleCollapse();
            };

            titleBar.onclick = (e) => {
                if (e.target === titleBar || e.target === titleText) {
                    toggleCollapse();
                }
            };
        }

        // 存储内容区域引用，供后续使用
        container._contentArea = contentArea;

        return container;
    }

    createViewerByType(fileType, fileUrl, width, height) {
        const adjustedHeight = `calc(${height} - 45px)`; // 减去标题栏高度

        switch (fileType.toLowerCase()) {
            case 'pdf':
                return this.createPDFViewer(fileUrl, width, adjustedHeight);
            case 'doc':
            case 'docx':
                return this.createOfficeViewer(fileUrl, width, adjustedHeight, 'word');
            case 'xls':
            case 'xlsx':
                return this.createOfficeViewer(fileUrl, width, adjustedHeight, 'excel');
            case 'ppt':
            case 'pptx':
                return this.createOfficeViewer(fileUrl, width, adjustedHeight, 'powerpoint');
            case 'txt':
                return this.createTextViewer(fileUrl, width, adjustedHeight);
            case 'other':
                return null; // other类型只显示标题栏和下载按钮
            default:
                return null;
        }
    }

    createPDFViewer(fileUrl, width, height) {
        // 使用PDF.js或浏览器内置PDF查看器
        const iframe = document.createElement('iframe');
        iframe.src = fileUrl;
        iframe.style.cssText = `
            width: 100%;
            height: ${height};
            border: none;
        `;
        iframe.setAttribute('allowfullscreen', 'true');
        return iframe;
    }

    createOfficeViewer(fileUrl, width, height, type) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: relative;
            width: 100%;
            height: ${height};
            background: #f8f9fa;
            border-radius: 4px;
        `;

        // 创建查看器选项 - 根据文件类型优化顺序
        const viewers = this.getOptimizedViewers(fileUrl, type);

        let currentViewerIndex = 0;
        let iframe = null;
        let loadingDiv = null;

        const createLoadingIndicator = () => {
            loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #666;
                font-size: 14px;
                text-align: center;
                z-index: 2;
            `;
            loadingDiv.innerHTML = `
                <div style="margin-bottom: 10px;">📄</div>
                <div>正在加载文档...</div>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    使用 ${viewers[currentViewerIndex].name}
                </div>
            `;
            return loadingDiv;
        };

        const createIframe = (viewerUrl) => {
            if (iframe) {
                iframe.remove();
            }

            iframe = document.createElement('iframe');
            iframe.src = viewerUrl;
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 4px;
            `;
            iframe.setAttribute('allowfullscreen', 'true');

            // 对于WPS链接，使用更宽松的sandbox设置
            if (viewerUrl.includes('kdocs.cn') || viewerUrl.includes('wps.cn')) {
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation');

                // 为WPS文档采用内容提取策略
                iframe.onload = () => {
                    // 延迟执行，确保WPS内容完全加载
                    setTimeout(() => {
                        this.extractWPSContent(iframe);
                    }, 2000);
                    setTimeout(() => {
                        this.extractWPSContent(iframe);
                    }, 5000);
                    setTimeout(() => {
                        this.extractWPSContent(iframe);
                    }, 8000);
                };
            } else {
                iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
            }

            return iframe;
        };

        const showFallbackUI = () => {
            container.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #666;
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="font-size: 48px; margin-bottom: 15px;">📄</div>
                    <div style="font-size: 16px; margin-bottom: 10px; font-weight: 500;">无法预览此文档</div>
                    <div style="font-size: 14px; color: #999; margin-bottom: 20px; line-height: 1.4;">
                        文档可能需要特殊权限或格式不支持在线预览<br>
                        请点击下方按钮下载查看
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                        <a href="${fileUrl}" target="_blank" style="
                            display: inline-block;
                            padding: 8px 16px;
                            background: #3498db;
                            color: white;
                            text-decoration: none;
                            border-radius: 4px;
                            font-size: 14px;
                            font-weight: 500;
                            transition: background 0.3s;
                        " onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">
                            📥 下载文档
                        </a>
                        <button onclick="window.open('${fileUrl}', '_blank')" style="
                            padding: 8px 16px;
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            font-size: 14px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: background 0.3s;
                        " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                            🔗 新窗口打开
                        </button>
                    </div>
                </div>
            `;
        };

        const tryNextViewer = () => {
            currentViewerIndex++;
            if (currentViewerIndex < viewers.length) {
                loadViewer();
            } else {
                showFallbackUI();
            }
        };

        const loadViewer = () => {
            container.innerHTML = '';

            const loading = createLoadingIndicator();
            const frame = createIframe(viewers[currentViewerIndex].url);

            container.appendChild(loading);
            container.appendChild(frame);

            let hasLoaded = false;
            let loadTimeout = null;

            // 对于WPS链接，使用更宽松的超时时间
            const isWPSViewer = viewers[currentViewerIndex].name.includes('WPS');
            const timeoutDuration = isWPSViewer ? 8000 : 15000;

            const hideLoading = () => {
                if (loading && loading.parentNode && !hasLoaded) {
                    hasLoaded = true;
                    console.log(`${viewers[currentViewerIndex].name} 加载完成`);
                    loading.style.opacity = '0';
                    setTimeout(() => {
                        if (loading.parentNode) {
                            loading.remove();
                        }
                    }, 300);
                }
            };

            const setLoadTimeout = () => {
                loadTimeout = setTimeout(() => {
                    if (!hasLoaded) {
                        console.warn(`${viewers[currentViewerIndex].name} 加载超时，但继续显示`);
                        hideLoading();
                        // 不自动切换到下一个查看器，让用户看到当前内容
                    }
                }, timeoutDuration);
            };

            frame.onload = () => {
                if (loadTimeout) clearTimeout(loadTimeout);
                console.log(`${viewers[currentViewerIndex].name} iframe onload 事件触发`);
                hideLoading();
            };

            frame.onerror = () => {
                if (loadTimeout) clearTimeout(loadTimeout);
                console.warn(`${viewers[currentViewerIndex].name} 加载失败，尝试下一个查看器`);
                tryNextViewer();
            };

            // 设置超时
            setLoadTimeout();

            // 对于所有查看器，都使用简单的延迟隐藏机制
            // 这样可以避免跨域问题导致的加载检测失败
            setTimeout(() => {
                if (!hasLoaded) {
                    console.log(`${viewers[currentViewerIndex].name} 延迟隐藏加载提示`);
                    hideLoading();
                }
            }, 2000); // 2秒后自动隐藏加载提示
        };

        // 开始加载第一个查看器
        loadViewer();

        return container;
    }

    createTextViewer(fileUrl, width, height) {
        const container = document.createElement('div');
        container.style.cssText = `
            width: 100%;
            height: ${height};
            overflow: auto;
            padding: 15px;
            background: #fff;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
        `;

        // 异步加载文本内容
        fetch(fileUrl)
            .then(response => response.text())
            .then(text => {
                container.textContent = text;
            })
            .catch(error => {
                container.innerHTML = `<p style="color: #e74c3c;">无法加载文本文件: ${error.message}</p>`;
            });

        return container;
    }

    createDownloadLink(fileUrl, title) {
        const container = document.createElement('div');
        container.className = 'doc-download-container';
        container.style.cssText = `
            padding: 20px;
            text-align: center;
            border: 2px dashed #ddd;
            border-radius: 8px;
            margin: 20px 0;
            background: #f9f9f9;
        `;

        const icon = document.createElement('div');
        icon.innerHTML = '📄';
        icon.style.cssText = `
            font-size: 48px;
            margin-bottom: 10px;
        `;

        const link = document.createElement('a');
        link.href = fileUrl;
        link.textContent = `下载 ${title}`;
        link.target = '_blank';
        link.style.cssText = `
            display: inline-block;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            transition: background 0.3s;
        `;
        
        link.addEventListener('mouseenter', () => {
            link.style.background = '#2980b9';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.background = '#3498db';
        });

        container.appendChild(icon);
        container.appendChild(link);
        
        return container;
    }

    getFileType(url) {
        if (!url) return 'unknown';
        
        const extension = url.split('.').pop().toLowerCase();
        const typeMap = {
            'pdf': 'pdf',
            'doc': 'doc',
            'docx': 'docx',
            'xls': 'xls',
            'xlsx': 'xlsx',
            'ppt': 'ppt',
            'pptx': 'pptx',
            'txt': 'txt',
            'other': 'other' // 添加other类型
        };
        
        return typeMap[extension] || 'unknown';
    }

    extractWPSContent(iframe) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            if (iframeDoc) {
                // 查找WPS文档的核心内容区域
                const contentSelectors = [
                    '.et-container-middle',
                    '.et-content-wrap',
                    '.content-wrap',
                    '.main-content',
                    '.document-content',
                    '.et-main-wrap',
                    '.workspace'
                ];

                let contentElement = null;

                // 按优先级查找内容元素
                console.log('开始查找WPS内容元素...');
                for (const selector of contentSelectors) {
                    contentElement = iframeDoc.querySelector(selector);
                    if (contentElement) {
                        console.log(`✅ 找到WPS内容元素: ${selector}`);
                        console.log('内容元素信息:', {
                            tagName: contentElement.tagName,
                            className: contentElement.className,
                            childElementCount: contentElement.childElementCount,
                            textContent: contentElement.textContent ? contentElement.textContent.substring(0, 100) + '...' : 'empty'
                        });
                        break;
                    } else {
                        console.log(`❌ 未找到: ${selector}`);
                    }
                }

                if (contentElement) {
                    // 创建纯净的内容容器
                    const cleanContainer = this.createCleanContentContainer(iframe, contentElement);

                    // 替换iframe
                    const iframeContainer = iframe.parentElement;
                    if (iframeContainer) {
                        // 隐藏原iframe
                        iframe.style.display = 'none';

                        // 添加纯净内容
                        iframeContainer.appendChild(cleanContainer);

                        console.log('WPS内容提取完成，已替换为纯净内容');
                    }
                } else {
                    console.log('未找到WPS内容元素，尝试提取整个body');
                    this.extractFullBody(iframe, iframeDoc);
                }
            }
        } catch (error) {
            console.log('WPS内容提取失败（跨域限制）:', error.message);
            // 尝试使用postMessage获取内容
            this.tryPostMessageExtraction(iframe);
        }
    }

    tryPostMessageExtraction(iframe) {
        try {
            // 尝试通过postMessage与iframe通信获取内容
            const extractMessage = {
                type: 'extractContent',
                selectors: [
                    '.et-container-middle',
                    '.et-content-wrap',
                    '.content-wrap',
                    '.main-content',
                    '.document-content'
                ]
            };

            iframe.contentWindow.postMessage(extractMessage, '*');

            // 监听返回的内容
            const messageHandler = (event) => {
                if (event.data && event.data.type === 'contentExtracted') {
                    console.log('通过postMessage获取到WPS内容');
                    this.createContentFromMessage(iframe, event.data.content);
                    window.removeEventListener('message', messageHandler);
                }
            };

            window.addEventListener('message', messageHandler);

            // 5秒后如果没有收到回复，回退到隐藏模式
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                console.log('postMessage提取超时，回退到隐藏模式');
                this.hideWPSElements(iframe);
            }, 5000);

        } catch (error) {
            console.log('postMessage提取也失败:', error.message);
            // 最后的备用方案：隐藏界面元素
            this.hideWPSElements(iframe);
        }
    }

    createContentFromMessage(iframe, contentHTML) {
        try {
            // 从postMessage获取的内容创建纯净容器
            const cleanContainer = document.createElement('div');
            cleanContainer.className = 'wps-clean-content';
            cleanContainer.style.cssText = `
                width: 100%;
                height: 100%;
                overflow: auto;
                background: #ffffff;
                position: relative;
                border: none;
                margin: 0;
                padding: 15px;
                box-sizing: border-box;
            `;

            // 设置内容并清理
            cleanContainer.innerHTML = contentHTML;
            this.cleanClonedContent(cleanContainer);
            this.applyContentStyles(cleanContainer);

            // 替换iframe
            const iframeContainer = iframe.parentElement;
            if (iframeContainer) {
                iframe.style.display = 'none';
                iframeContainer.appendChild(cleanContainer);
                console.log('从postMessage创建的WPS内容已显示');
            }

        } catch (error) {
            console.log('从postMessage创建内容失败:', error.message);
        }
    }

    createCleanContentContainer(iframe, contentElement) {
        // 创建纯净的内容容器
        const cleanContainer = document.createElement('div');
        cleanContainer.className = 'wps-clean-content';
        cleanContainer.style.cssText = `
            width: 100%;
            height: 100%;
            overflow: auto;
            background: #ffffff;
            position: relative;
            border: none;
            margin: 0;
            padding: 0;
        `;

        try {
            // 深度克隆内容元素
            const clonedContent = contentElement.cloneNode(true);

            // 清理克隆内容中的不需要元素
            this.cleanClonedContent(clonedContent);

            // 添加到容器
            cleanContainer.appendChild(clonedContent);

            // 应用样式修复
            this.applyContentStyles(cleanContainer);

        } catch (error) {
            console.log('内容克隆失败:', error.message);
            // 如果克隆失败，创建一个简单的内容提示
            cleanContainer.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #666;
                    font-size: 16px;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <div style="font-size: 48px; margin-bottom: 15px;">📄</div>
                        <div>WPS文档内容提取中...</div>
                        <div style="font-size: 14px; color: #999; margin-top: 10px;">
                            如果长时间无法显示，请点击下载按钮获取文档
                        </div>
                    </div>
                </div>
            `;
        }

        return cleanContainer;
    }

    cleanClonedContent(clonedContent) {
        // 清理克隆内容中的不需要元素
        const selectorsToRemove = [
            '.et-cmb-bar-wrap',
            '.component-header-wrap',
            '.et-edit-bar-wrap',
            '.et-toolbar-wrap',
            '.et-header-wrap',
            '.et-menu-bar',
            '.et-status-bar',
            '.toolbar-wrap',
            '.header-wrap',
            '.shadow',
            '[class*="shadow"]',
            '[class*="toolbar"]',
            '[class*="menu"]',
            '[class*="header"]',
            '[class*="bar"]'
        ];

        selectorsToRemove.forEach(selector => {
            const elements = clonedContent.querySelectorAll(selector);
            elements.forEach(element => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        });

        // 移除所有事件监听器和脚本
        const scripts = clonedContent.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
    }

    applyContentStyles(container) {
        // 为提取的内容应用样式
        const style = document.createElement('style');
        style.innerHTML = `
            .wps-clean-content * {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }

            .wps-clean-content table {
                width: 100% !important;
                border-collapse: collapse !important;
            }

            .wps-clean-content img {
                max-width: 100% !important;
                height: auto !important;
            }

            .wps-clean-content {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                line-height: 1.6 !important;
            }
        `;

        container.appendChild(style);
    }

    extractFullBody(iframe, iframeDoc) {
        // 如果找不到特定内容元素，提取整个body
        try {
            const body = iframeDoc.body;
            if (body) {
                const cleanContainer = this.createCleanContentContainer(iframe, body);

                const iframeContainer = iframe.parentElement;
                if (iframeContainer) {
                    iframe.style.display = 'none';
                    iframeContainer.appendChild(cleanContainer);
                    console.log('已提取WPS文档的完整body内容');
                }
            }
        } catch (error) {
            console.log('提取完整body失败:', error.message);
        }
    }

    injectGlobalWPSStyles() {
        // 在页面头部注入全局CSS样式来隐藏WPS界面元素
        const existingStyle = document.getElementById('wps-hide-elements-style');
        if (existingStyle) {
            return; // 如果已经注入过，就不重复注入
        }

        const style = document.createElement('style');
        style.id = 'wps-hide-elements-style';
        style.type = 'text/css';
        style.innerHTML = `
            /* 暴力隐藏WPS文档查看器中的界面元素 */
            iframe[src*="kdocs.cn"] .et-cmb-bar-wrap,
            iframe[src*="kdocs.cn"] .component-header-wrap,
            iframe[src*="kdocs.cn"] .et-edit-bar-wrap,
            iframe[src*="kdocs.cn"] .et-toolbar-wrap,
            iframe[src*="kdocs.cn"] .et-header-wrap,
            iframe[src*="kdocs.cn"] .et-menu-bar,
            iframe[src*="kdocs.cn"] .et-status-bar,
            iframe[src*="kdocs.cn"] .toolbar-wrap,
            iframe[src*="kdocs.cn"] .header-wrap,
            iframe[src*="kdocs.cn"] .shadow,
            iframe[src*="kdocs.cn"] [class*="shadow"],
            iframe[src*="kdocs.cn"] .et-shadow,
            iframe[src*="kdocs.cn"] .wps-shadow,
            iframe[src*="kdocs.cn"] .kdocs-shadow,
            iframe[src*="wps.cn"] .et-cmb-bar-wrap,
            iframe[src*="wps.cn"] .component-header-wrap,
            iframe[src*="wps.cn"] .et-edit-bar-wrap,
            iframe[src*="wps.cn"] .et-toolbar-wrap,
            iframe[src*="wps.cn"] .et-header-wrap,
            iframe[src*="wps.cn"] .et-menu-bar,
            iframe[src*="wps.cn"] .et-status-bar,
            iframe[src*="wps.cn"] .toolbar-wrap,
            iframe[src*="wps.cn"] .header-wrap,
            iframe[src*="wps.cn"] .shadow,
            iframe[src*="wps.cn"] [class*="shadow"],
            iframe[src*="wps.cn"] .et-shadow,
            iframe[src*="wps.cn"] .wps-shadow,
            iframe[src*="wps.cn"] .kdocs-shadow {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                z-index: -1 !important;
                pointer-events: none !important;
            }

            /* 暴力隐藏：通过属性选择器隐藏更多shadow相关元素 */
            iframe[src*="kdocs.cn"] [class^="shadow"],
            iframe[src*="kdocs.cn"] [class$="shadow"],
            iframe[src*="kdocs.cn"] [id*="shadow"],
            iframe[src*="wps.cn"] [class^="shadow"],
            iframe[src*="wps.cn"] [class$="shadow"],
            iframe[src*="wps.cn"] [id*="shadow"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }

            /* 调整WPS内容区域 - 消除空白 */
            iframe[src*="kdocs.cn"] .et-content-wrap,
            iframe[src*="kdocs.cn"] .content-wrap,
            iframe[src*="kdocs.cn"] .main-content,
            iframe[src*="kdocs.cn"] .document-content,
            iframe[src*="kdocs.cn"] .et-main-wrap,
            iframe[src*="kdocs.cn"] .main-wrap,
            iframe[src*="kdocs.cn"] .workspace,
            iframe[src*="kdocs.cn"] .et-workspace,
            iframe[src*="wps.cn"] .et-content-wrap,
            iframe[src*="wps.cn"] .content-wrap,
            iframe[src*="wps.cn"] .main-content,
            iframe[src*="wps.cn"] .document-content,
            iframe[src*="wps.cn"] .et-main-wrap,
            iframe[src*="wps.cn"] .main-wrap,
            iframe[src*="wps.cn"] .workspace,
            iframe[src*="wps.cn"] .et-workspace {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                height: 100vh !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                transform: translateY(0) !important;
            }

            /* 调整iframe内的body和html以消除空白 */
            iframe[src*="kdocs.cn"] body,
            iframe[src*="kdocs.cn"] html,
            iframe[src*="wps.cn"] body,
            iframe[src*="wps.cn"] html {
                margin: 0 !important;
                padding: 0 !important;
                height: 100vh !important;
                overflow: hidden !important;
            }

            /* 暴力模式：隐藏iframe顶部区域 */
            .doc-viewer-container iframe[src*="kdocs.cn"]::before,
            .doc-viewer-container iframe[src*="wps.cn"]::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 60px;
                background: white;
                z-index: 9999;
                pointer-events: none;
            }
        `;

        document.head.appendChild(style);
        console.log('全局WPS样式注入完成');
    }

    injectWPSStyles(iframe) {
        try {
            // 尝试向WPS iframe中注入CSS样式来隐藏界面元素
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            if (iframeDoc) {
                // 创建样式元素
                const style = iframeDoc.createElement('style');
                style.type = 'text/css';
                style.innerHTML = `
                    /* 隐藏WPS文档预览界面中的不需要元素 */
                    .et-cmb-bar-wrap {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    .component-header-wrap {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    .et-edit-bar-wrap {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    /* 额外隐藏可能的其他界面元素 */
                    .et-toolbar-wrap,
                    .et-header-wrap,
                    .et-menu-bar,
                    .et-status-bar,
                    .toolbar-wrap,
                    .header-wrap {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    /* 确保文档内容区域占满整个空间 */
                    .et-content-wrap,
                    .content-wrap {
                        top: 0 !important;
                        height: 100% !important;
                    }
                `;

                // 将样式添加到iframe的head中
                const head = iframeDoc.head || iframeDoc.getElementsByTagName('head')[0];
                if (head) {
                    head.appendChild(style);
                    console.log('WPS样式注入成功');
                }
            }
        } catch (error) {
            // 由于跨域限制，可能无法直接访问iframe内容
            console.log('无法直接注入WPS样式（跨域限制）:', error.message);

            // 使用postMessage尝试与iframe通信
            this.tryPostMessageStyleInjection(iframe);
        }
    }

    tryPostMessageStyleInjection(iframe) {
        try {
            // 尝试通过postMessage向iframe发送样式注入请求
            const message = {
                type: 'injectStyles',
                styles: `
                    .et-cmb-bar-wrap,
                    .component-header-wrap,
                    .et-edit-bar-wrap,
                    .et-toolbar-wrap,
                    .et-header-wrap,
                    .et-menu-bar,
                    .et-status-bar,
                    .toolbar-wrap,
                    .header-wrap {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    .et-content-wrap,
                    .content-wrap {
                        top: 0 !important;
                        height: 100% !important;
                    }
                `
            };

            iframe.contentWindow.postMessage(message, '*');
            console.log('尝试通过postMessage注入WPS样式');
        } catch (error) {
            console.log('postMessage样式注入也失败:', error.message);
        }
    }

    hideWPSElements(iframe) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            if (iframeDoc) {
                // 暴力隐藏模式 - 要隐藏的WPS界面元素选择器
                const selectorsToHide = [
                    '.et-cmb-bar-wrap',
                    '.component-header-wrap',
                    '.et-edit-bar-wrap',
                    '.et-toolbar-wrap',
                    '.et-header-wrap',
                    '.et-menu-bar',
                    '.et-status-bar',
                    '.toolbar-wrap',
                    '.header-wrap',
                    '.et-ad-wrap',
                    '.ad-wrap',
                    '.promotion-wrap',
                    '.et-promotion-wrap',
                    '.shadow',  // 新增：隐藏shadow组件
                    '[class*="shadow"]',  // 隐藏所有包含shadow的class
                    '.et-shadow',
                    '.wps-shadow',
                    '.kdocs-shadow'
                ];

                // 暴力隐藏：遍历并彻底隐藏所有匹配的元素
                selectorsToHide.forEach(selector => {
                    const elements = iframeDoc.querySelectorAll(selector);
                    elements.forEach(element => {
                        // 多重隐藏策略
                        element.style.setProperty('display', 'none', 'important');
                        element.style.setProperty('visibility', 'hidden', 'important');
                        element.style.setProperty('opacity', '0', 'important');
                        element.style.setProperty('height', '0', 'important');
                        element.style.setProperty('width', '0', 'important');
                        element.style.setProperty('overflow', 'hidden', 'important');
                        element.style.setProperty('position', 'absolute', 'important');
                        element.style.setProperty('left', '-9999px', 'important');
                        element.style.setProperty('top', '-9999px', 'important');
                        element.style.setProperty('z-index', '-1', 'important');

                        // 移除元素的所有子节点
                        while (element.firstChild) {
                            element.removeChild(element.firstChild);
                        }

                        // 添加隐藏标记
                        element.setAttribute('data-wps-hidden', 'true');
                    });
                });

                // 暴力模式：直接删除元素
                setTimeout(() => {
                    selectorsToHide.forEach(selector => {
                        const elements = iframeDoc.querySelectorAll(selector);
                        elements.forEach(element => {
                            if (element.parentNode) {
                                element.parentNode.removeChild(element);
                            }
                        });
                    });
                }, 500);

                // 调整内容区域样式 - 消除空白
                const contentSelectors = [
                    '.et-content-wrap',
                    '.content-wrap',
                    '.main-content',
                    '.document-content',
                    '.et-main-wrap',
                    '.main-wrap',
                    '.workspace',
                    '.et-workspace'
                ];

                contentSelectors.forEach(selector => {
                    const elements = iframeDoc.querySelectorAll(selector);
                    elements.forEach(element => {
                        element.style.setProperty('top', '0', 'important');
                        element.style.setProperty('height', '100vh', 'important');
                        element.style.setProperty('padding-top', '0', 'important');
                        element.style.setProperty('margin-top', '0', 'important');
                        element.style.setProperty('position', 'absolute', 'important');
                        element.style.setProperty('left', '0', 'important');
                        element.style.setProperty('right', '0', 'important');
                        element.style.setProperty('bottom', '0', 'important');
                        element.style.setProperty('transform', 'translateY(0)', 'important');
                    });
                });

                // 调整body和html样式以消除空白
                if (iframeDoc.body) {
                    iframeDoc.body.style.setProperty('margin', '0', 'important');
                    iframeDoc.body.style.setProperty('padding', '0', 'important');
                    iframeDoc.body.style.setProperty('height', '100vh', 'important');
                    iframeDoc.body.style.setProperty('overflow', 'hidden', 'important');
                }

                if (iframeDoc.documentElement) {
                    iframeDoc.documentElement.style.setProperty('margin', '0', 'important');
                    iframeDoc.documentElement.style.setProperty('padding', '0', 'important');
                    iframeDoc.documentElement.style.setProperty('height', '100vh', 'important');
                }

                console.log('WPS界面元素暴力隐藏完成');

                // 额外步骤：消除空白区域
                this.eliminateWhitespace(iframeDoc);

                // 启动DOM变化监控
                this.startDOMObserver(iframeDoc, iframe);
            }
        } catch (error) {
            console.log('无法直接隐藏WPS元素（跨域限制）:', error.message);
            // 启用暴力模式的备用方案
            this.bruteForceHideElements(iframe);
        }
    }

    startDOMObserver(iframeDoc, iframe) {
        try {
            // 创建MutationObserver来监控iframe内部的DOM变化
            const observer = new MutationObserver((mutations) => {
                let needsHiding = false;

                mutations.forEach((mutation) => {
                    // 检查新添加的节点
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // 检查是否是需要隐藏的元素
                            const selectorsToCheck = [
                                '.et-cmb-bar-wrap',
                                '.component-header-wrap',
                                '.et-edit-bar-wrap',
                                '.shadow',
                                '[class*="shadow"]'
                            ];

                            selectorsToCheck.forEach(selector => {
                                if (node.matches && node.matches(selector)) {
                                    needsHiding = true;
                                    this.hideElement(node);
                                }

                                // 检查子元素
                                if (node.querySelectorAll) {
                                    const childElements = node.querySelectorAll(selector);
                                    if (childElements.length > 0) {
                                        needsHiding = true;
                                        childElements.forEach(child => this.hideElement(child));
                                    }
                                }
                            });
                        }
                    });
                });

                if (needsHiding) {
                    console.log('DOM变化监控：检测到新的界面元素，已隐藏');
                }
            });

            // 开始观察
            observer.observe(iframeDoc.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });

            console.log('DOM变化监控已启动');

            // 30分钟后停止观察
            setTimeout(() => {
                observer.disconnect();
                console.log('DOM变化监控已停止');
            }, 30 * 60 * 1000);

        } catch (error) {
            console.log('无法启动DOM变化监控:', error.message);
        }
    }

    hideElement(element) {
        // 立即隐藏单个元素
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important');
        element.style.setProperty('opacity', '0', 'important');
        element.style.setProperty('height', '0', 'important');
        element.style.setProperty('width', '0', 'important');
        element.style.setProperty('overflow', 'hidden', 'important');
        element.style.setProperty('position', 'absolute', 'important');
        element.style.setProperty('left', '-9999px', 'important');
        element.style.setProperty('top', '-9999px', 'important');
        element.style.setProperty('z-index', '-1', 'important');
        element.setAttribute('data-wps-hidden', 'true');

        // 尝试删除元素
        setTimeout(() => {
            try {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            } catch (e) {
                // 删除失败，元素已被隐藏
            }
        }, 100);
    }

    eliminateWhitespace(iframeDoc) {
        try {
            // 强制调整所有可能造成空白的元素
            const allElements = iframeDoc.querySelectorAll('*');
            allElements.forEach(element => {
                const computedStyle = window.getComputedStyle(element);

                // 如果元素是隐藏的，确保它不占用空间
                if (element.hasAttribute('data-wps-hidden') ||
                    computedStyle.display === 'none' ||
                    computedStyle.visibility === 'hidden') {
                    element.style.setProperty('height', '0', 'important');
                    element.style.setProperty('width', '0', 'important');
                    element.style.setProperty('margin', '0', 'important');
                    element.style.setProperty('padding', '0', 'important');
                    element.style.setProperty('border', 'none', 'important');
                    element.style.setProperty('position', 'absolute', 'important');
                    element.style.setProperty('left', '-10000px', 'important');
                }
            });

            // 查找并调整主要容器
            const mainContainers = iframeDoc.querySelectorAll('body > div, body > main, body > section');
            mainContainers.forEach(container => {
                if (!container.hasAttribute('data-wps-hidden')) {
                    container.style.setProperty('position', 'absolute', 'important');
                    container.style.setProperty('top', '0', 'important');
                    container.style.setProperty('left', '0', 'important');
                    container.style.setProperty('right', '0', 'important');
                    container.style.setProperty('bottom', '0', 'important');
                    container.style.setProperty('height', '100vh', 'important');
                    container.style.setProperty('width', '100%', 'important');
                }
            });

            console.log('空白区域消除完成');
        } catch (error) {
            console.log('消除空白区域失败:', error.message);
        }
    }

    eliminateWhitespaceExternal(iframe) {
        // 外部调用的空白消除方法
        try {
            // 调整iframe容器样式
            const container = iframe.parentElement;
            if (container) {
                container.style.setProperty('overflow', 'hidden', 'important');
                container.style.setProperty('position', 'relative', 'important');
            }

            // 调整iframe样式
            iframe.style.setProperty('position', 'absolute', 'important');
            iframe.style.setProperty('top', '0', 'important');
            iframe.style.setProperty('left', '0', 'important');
            iframe.style.setProperty('width', '100%', 'important');
            iframe.style.setProperty('height', '100%', 'important');
            iframe.style.setProperty('margin', '0', 'important');
            iframe.style.setProperty('padding', '0', 'important');
            iframe.style.setProperty('border', 'none', 'important');

            console.log('外部空白消除完成');
        } catch (error) {
            console.log('外部空白消除失败:', error.message);
        }
    }

    bruteForceHideElements(iframe) {
        // 暴力模式备用方案：使用多种方法尝试隐藏元素
        console.log('启用暴力隐藏模式备用方案');

        // 方案1：通过postMessage发送暴力隐藏指令
        const bruteForceMessage = {
            type: 'bruteForceHide',
            selectors: [
                '.et-cmb-bar-wrap',
                '.component-header-wrap',
                '.et-edit-bar-wrap',
                '.et-toolbar-wrap',
                '.et-header-wrap',
                '.et-menu-bar',
                '.et-status-bar',
                '.toolbar-wrap',
                '.header-wrap',
                '.shadow',
                '[class*="shadow"]',
                '.et-shadow',
                '.wps-shadow',
                '.kdocs-shadow'
            ]
        };

        try {
            iframe.contentWindow.postMessage(bruteForceMessage, '*');
        } catch (e) {
            console.log('postMessage暴力隐藏失败:', e.message);
        }

        // 方案2：创建覆盖层来遮挡不需要的元素
        this.createOverlayMask(iframe);

        // 方案3：定期检查并隐藏元素
        this.startPeriodicHiding(iframe);
    }

    createOverlayMask(iframe) {
        // 创建一个无空白的覆盖层来遮挡WPS界面元素
        const overlay = document.createElement('div');
        overlay.className = 'wps-overlay-mask';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 0;
            background: transparent;
            z-index: 9999;
            pointer-events: none;
            overflow: hidden;
        `;

        // 将覆盖层添加到iframe的父容器中
        const container = iframe.parentElement;
        if (container) {
            container.style.position = 'relative';
            container.appendChild(overlay);

            // 调整iframe位置以消除空白
            iframe.style.setProperty('position', 'absolute', 'important');
            iframe.style.setProperty('top', '0', 'important');
            iframe.style.setProperty('left', '0', 'important');
            iframe.style.setProperty('width', '100%', 'important');
            iframe.style.setProperty('height', '100%', 'important');
            iframe.style.setProperty('margin', '0', 'important');
            iframe.style.setProperty('padding', '0', 'important');

            console.log('创建无空白覆盖层');
        }
    }

    startPeriodicHiding(iframe) {
        // 持续监控并隐藏元素（暴力模式）
        let attempts = 0;
        const maxAttempts = 60; // 增加到60次，持续1分钟

        const hideInterval = setInterval(() => {
            attempts++;

            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    const selectorsToHide = [
                        '.et-cmb-bar-wrap',
                        '.component-header-wrap',
                        '.et-edit-bar-wrap',
                        '.et-toolbar-wrap',
                        '.et-header-wrap',
                        '.et-menu-bar',
                        '.et-status-bar',
                        '.toolbar-wrap',
                        '.header-wrap',
                        '.shadow',
                        '[class*="shadow"]',
                        '[class^="shadow"]',
                        '[class$="shadow"]',
                        '[id*="shadow"]',
                        '.et-shadow',
                        '.wps-shadow',
                        '.kdocs-shadow'
                    ];

                    let hiddenCount = 0;
                    selectorsToHide.forEach(selector => {
                        const elements = iframeDoc.querySelectorAll(selector);
                        elements.forEach(element => {
                            // 每次都重新隐藏，确保动态添加的元素也被隐藏
                            element.style.setProperty('display', 'none', 'important');
                            element.style.setProperty('visibility', 'hidden', 'important');
                            element.style.setProperty('opacity', '0', 'important');
                            element.style.setProperty('height', '0', 'important');
                            element.style.setProperty('width', '0', 'important');
                            element.style.setProperty('overflow', 'hidden', 'important');
                            element.style.setProperty('position', 'absolute', 'important');
                            element.style.setProperty('left', '-9999px', 'important');
                            element.style.setProperty('top', '-9999px', 'important');
                            element.style.setProperty('z-index', '-1', 'important');
                            element.setAttribute('data-wps-hidden', 'true');
                            hiddenCount++;

                            // 暴力删除元素
                            if (attempts > 5) { // 5秒后开始删除元素
                                try {
                                    if (element.parentNode) {
                                        element.parentNode.removeChild(element);
                                    }
                                } catch (e) {
                                    // 删除失败，继续隐藏
                                }
                            }
                        });
                    });

                    // 持续调整内容区域
                    const contentSelectors = [
                        '.et-content-wrap',
                        '.content-wrap',
                        '.main-content',
                        '.document-content',
                        '.et-main-wrap',
                        '.main-wrap',
                        '.workspace',
                        '.et-workspace'
                    ];

                    contentSelectors.forEach(selector => {
                        const elements = iframeDoc.querySelectorAll(selector);
                        elements.forEach(element => {
                            element.style.setProperty('position', 'absolute', 'important');
                            element.style.setProperty('top', '0', 'important');
                            element.style.setProperty('left', '0', 'important');
                            element.style.setProperty('right', '0', 'important');
                            element.style.setProperty('bottom', '0', 'important');
                            element.style.setProperty('height', '100vh', 'important');
                            element.style.setProperty('width', '100%', 'important');
                            element.style.setProperty('padding', '0', 'important');
                            element.style.setProperty('margin', '0', 'important');
                        });
                    });

                    if (hiddenCount > 0) {
                        console.log(`持续隐藏检查 ${attempts}/${maxAttempts}：处理了 ${hiddenCount} 个元素`);
                    }
                }
            } catch (error) {
                // 跨域限制，无法访问
            }

            if (attempts >= maxAttempts) {
                clearInterval(hideInterval);
                console.log('持续隐藏检查结束');
                // 启动长期监控
                this.startLongTermMonitoring(iframe);
            }
        }, 1000); // 每秒检查一次
    }

    startLongTermMonitoring(iframe) {
        // 长期监控，每10秒检查一次
        const longTermInterval = setInterval(() => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    const shadowElements = iframeDoc.querySelectorAll('.shadow, [class*="shadow"], .et-cmb-bar-wrap, .component-header-wrap, .et-edit-bar-wrap');
                    if (shadowElements.length > 0) {
                        console.log(`长期监控：发现 ${shadowElements.length} 个需要隐藏的元素`);
                        shadowElements.forEach(element => {
                            element.style.setProperty('display', 'none', 'important');
                            element.style.setProperty('visibility', 'hidden', 'important');
                            try {
                                if (element.parentNode) {
                                    element.parentNode.removeChild(element);
                                }
                            } catch (e) {
                                // 删除失败，继续隐藏
                            }
                        });
                    }
                }
            } catch (error) {
                // 跨域限制，无法访问
            }
        }, 10000); // 每10秒检查一次

        // 30分钟后停止长期监控
        setTimeout(() => {
            clearInterval(longTermInterval);
            console.log('长期监控结束');
        }, 30 * 60 * 1000);
    }

    getOptimizedViewers(fileUrl, type) {
        const encodedUrl = encodeURIComponent(fileUrl);

        // 检查是否是特殊的文档服务链接
        const isWPSLink = fileUrl.includes('kdocs.cn') || fileUrl.includes('wps.cn');
        const isTencentLink = fileUrl.includes('docs.qq.com');
        const isMSLink = fileUrl.includes('office.com') || fileUrl.includes('sharepoint.com');

        // 基础查看器配置
        const allViewers = {
            googleDocs: {
                name: 'Google Docs',
                url: `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`,
                description: '使用Google文档查看器',
                priority: { excel: 3, word: 2, powerpoint: 2, default: 3 }
            },
            wpsCloud: {
                name: 'WPS云文档',
                url: this.getWPSViewerUrl(fileUrl, type),
                description: '使用WPS云文档查看器',
                priority: { excel: isWPSLink ? 1 : 2, word: isWPSLink ? 1 : 2, powerpoint: isWPSLink ? 1 : 2, default: isWPSLink ? 1 : 2 }
            },
            msOfficeView: {
                name: 'Microsoft Office',
                url: `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`,
                description: '使用Microsoft Office在线查看器',
                priority: { excel: isMSLink ? 1 : 4, word: isMSLink ? 1 : 4, powerpoint: isMSLink ? 1 : 4, default: isMSLink ? 1 : 4 }
            },
            office365Embed: {
                name: 'Office365嵌入',
                url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`,
                description: '使用Office365嵌入式查看器',
                priority: { excel: isMSLink ? 2 : 5, word: isMSLink ? 2 : 5, powerpoint: isMSLink ? 2 : 5, default: isMSLink ? 2 : 5 }
            },
            tencentDocs: {
                name: '腾讯文档',
                url: `https://docs.qq.com/api/preview?url=${encodedUrl}&type=${type}&embedded=true`,
                description: '使用腾讯文档查看器',
                priority: { excel: isTencentLink ? 1 : 6, word: isTencentLink ? 1 : 6, powerpoint: isTencentLink ? 1 : 6, default: isTencentLink ? 1 : 6 }
            }
        };

        // 如果是WPS链接，只使用WPS相关的查看器，并启用暴力隐藏模式
        if (isWPSLink) {
            // 标记为WPS链接，启用暴力隐藏模式
            setTimeout(() => {
                const containers = document.querySelectorAll('.doc-viewer-container');
                containers.forEach(container => {
                    const iframe = container.querySelector('iframe[src*="kdocs"], iframe[src*="wps"]');
                    if (iframe) {
                        container.classList.add('brute-force-mode');
                        console.log('启用暴力隐藏模式');
                    }
                });
            }, 100);

            return [allViewers.wpsCloud];
        }

        // 如果是腾讯文档链接，优先使用腾讯文档查看器
        if (isTencentLink) {
            return [allViewers.tencentDocs, allViewers.googleDocs];
        }

        // 如果是Microsoft链接，优先使用Microsoft查看器
        if (isMSLink) {
            return [allViewers.msOfficeView, allViewers.office365Embed, allViewers.googleDocs];
        }

        // 根据文件类型确定优先级
        const fileTypeKey = type.toLowerCase();
        const typeMapping = {
            'xls': 'excel',
            'xlsx': 'excel',
            'doc': 'word',
            'docx': 'word',
            'ppt': 'powerpoint',
            'pptx': 'powerpoint'
        };

        const priorityKey = typeMapping[fileTypeKey] || 'default';

        // 按优先级排序查看器
        const sortedViewers = Object.values(allViewers).sort((a, b) => {
            const aPriority = a.priority[priorityKey] || a.priority.default;
            const bPriority = b.priority[priorityKey] || b.priority.default;
            return aPriority - bPriority;
        });

        return sortedViewers;
    }

    getWPSViewerUrl(fileUrl, type) {
        // 检查是否是金山文档的分享链接
        if (fileUrl.includes('kdocs.cn/l/')) {
            // 如果是金山文档分享链接，添加嵌入参数来隐藏界面元素
            const url = new URL(fileUrl);

            // 添加参数来隐藏WPS界面元素
            url.searchParams.set('embed', '1');           // 嵌入模式
            url.searchParams.set('toolbar', '0');         // 隐藏工具栏
            url.searchParams.set('header', '0');          // 隐藏头部
            url.searchParams.set('menubar', '0');         // 隐藏菜单栏
            url.searchParams.set('statusbar', '0');       // 隐藏状态栏
            url.searchParams.set('editbar', '0');         // 隐藏编辑栏
            url.searchParams.set('commentbar', '0');      // 隐藏评论栏
            url.searchParams.set('chrome', '0');          // 隐藏浏览器界面元素
            url.searchParams.set('widget', '0');          // 隐藏小部件
            url.searchParams.set('navpane', '0');         // 隐藏导航面板

            return url.toString();
        }

        // 检查是否是其他WPS相关链接
        if (fileUrl.includes('wps.cn') || fileUrl.includes('kdocs.cn')) {
            // 如果已经是WPS相关链接，添加嵌入参数
            const url = new URL(fileUrl);

            // 添加参数来隐藏界面元素
            url.searchParams.set('embed', '1');
            url.searchParams.set('toolbar', '0');
            url.searchParams.set('header', '0');
            url.searchParams.set('menubar', '0');
            url.searchParams.set('statusbar', '0');
            url.searchParams.set('editbar', '0');

            return url.toString();
        }

        // WPS云文档查看器URL生成（用于外部文件）
        const encodedUrl = encodeURIComponent(fileUrl);

        // 根据文件类型选择合适的WPS查看器
        const wpsTypeMap = {
            'excel': 'et',
            'xls': 'et',
            'xlsx': 'et',
            'word': 'wps',
            'doc': 'wps',
            'docx': 'wps',
            'powerpoint': 'wpp',
            'ppt': 'wpp',
            'pptx': 'wpp'
        };

        const wpsType = wpsTypeMap[type.toLowerCase()] || 'et'; // 默认使用表格查看器

        // 使用金山文档的在线预览服务，并添加参数来隐藏界面元素
        return `https://www.kdocs.cn/view?url=${encodedUrl}&type=${wpsType}&mode=embed&toolbar=0&header=0&menubar=0&statusbar=0&editbar=0&chrome=0`;
    }

    downloadFile(fileUrl, fileName) {
        try {
            // 创建一个临时的 a 标签来触发下载
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName || 'document';
            link.target = '_blank';
            
            // 添加到 DOM 并触发点击
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
        } catch (error) {
            console.error('下载文件失败:', error);
            // 如果下载失败，尝试在新窗口打开
            window.open(fileUrl, '_blank');
        }
    }

    // 静态方法：快速创建文档查看器
    static embed(options) {
        const {
            container,
            fileUrl,
            fileType,
            width = '100%',
            height = '600px',
            title = '文档预览'
        } = options;

        if (!container || !fileUrl) {
            console.error('DocumentViewer.embed: 缺少必要参数');
            return;
        }

        const element = typeof container === 'string' 
            ? document.querySelector(container)
            : container;

        if (!element) {
            console.error('DocumentViewer.embed: 找不到容器元素');
            return;
        }

        element.setAttribute('data-doc-viewer', 'true');
        element.setAttribute('data-file-url', fileUrl);
        if (fileType) element.setAttribute('data-file-type', fileType);
        element.setAttribute('data-width', width);
        element.setAttribute('data-height', height);
        element.setAttribute('data-title', title);

        const viewer = new DocumentViewer();
        viewer.createViewer(element);
    }
}

// 自动初始化
if (typeof window !== 'undefined') {
    window.DocumentViewer = DocumentViewer;
    const viewer = new DocumentViewer();

    // 启用全局暴力隐藏模式监听器
    const enableBruteForceMode = () => {
        // 监听所有WPS iframe的加载
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const wpsIframes = node.querySelectorAll ?
                            node.querySelectorAll('iframe[src*="kdocs"], iframe[src*="wps"]') : [];

                        if (node.tagName === 'IFRAME' && (node.src.includes('kdocs') || node.src.includes('wps'))) {
                            wpsIframes = [node];
                        }

                        wpsIframes.forEach(iframe => {
                            console.log('检测到WPS iframe，启用暴力隐藏模式');
                            const container = iframe.closest('.doc-viewer-container');
                            if (container) {
                                container.classList.add('brute-force-mode');
                            }

                            // 立即开始暴力隐藏
                            setTimeout(() => viewer.hideWPSElements(iframe), 500);
                            setTimeout(() => viewer.hideWPSElements(iframe), 2000);
                            setTimeout(() => viewer.hideWPSElements(iframe), 5000);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 立即检查现有的WPS iframe
        const existingWPSIframes = document.querySelectorAll('iframe[src*="kdocs"], iframe[src*="wps"]');
        existingWPSIframes.forEach(iframe => {
            const container = iframe.closest('.doc-viewer-container');
            if (container) {
                container.classList.add('brute-force-mode');
            }
            setTimeout(() => viewer.hideWPSElements(iframe), 1000);
        });
    };

    // 页面加载完成后启用暴力模式
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableBruteForceMode);
    } else {
        enableBruteForceMode();
    }
}

// 导出模块（如果支持）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentViewer;
}