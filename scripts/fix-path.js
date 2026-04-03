const fs = require('fs');
const path = require('path');

// 构建输出目录
const distDir = path.join(__dirname, '../dist');

// 递归遍历目录
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.html')) {
      fixHtmlPath(filePath);
    }
  });
}

// 修复HTML文件中的路径
function fixHtmlPath(filePath) {
  console.log(`Fixing paths in ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换静态资源路径
  content = content.replace(/href="\//g, 'href="./');
  content = content.replace(/src="\//g, 'src="./');
  content = content.replace(/action="\//g, 'action="./');
  
  // 特殊处理 manifest.json 和 favicon.ico
  content = content.replace(/href=".\/manifest.json"/g, 'href="manifest.json"');
  content = content.replace(/href=".\/favicon.ico"/g, 'href="favicon.ico"');
  
  // 修复Nuxt.js运行时配置中的baseURL
  content = content.replace(/app:\{baseURL:"\/"/g, 'app:{baseURL:"./"');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// 执行修复
if (fs.existsSync(distDir)) {
  console.log('Fixing paths in dist directory...');
  walkDir(distDir);
  console.log('Path fixing completed!');
} else {
  console.error('Dist directory not found!');
  process.exit(1);
}
