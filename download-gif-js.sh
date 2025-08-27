#!/bin/bash
echo "正在下载gif.js库文件..."

echo "下载gif.js主文件..."
curl -o themes/wixo/source/js/gif.js https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js

echo "下载gif.worker.js文件..."
curl -o themes/wixo/source/js/gif.worker.js https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js

echo "下载完成！"
echo ""
echo "文件已保存到:"
echo "- themes/wixo/source/js/gif.js"
echo "- themes/wixo/source/js/gif.worker.js"
echo ""
echo "重要提示：两个文件都是必需的！"
echo "- gif.js: 主要的GIF生成库"
echo "- gif.worker.js: Worker脚本，用于后台处理"
echo ""
echo "现在可以运行 hexo generate 来重新生成博客"
