// 引入 Express 框架
const express = require('express');
// 引入 CORS 中间件，用于处理跨域请求
const cors = require('cors');
// 引入 multer 中间件，用于处理文件上传
const multer = require('multer');
// 引入 fs 模块，用于读取文件
const fs = require('fs');
// 引入 path 模块，用于处理文件路径
const path = require('path');

// 创建 Express 应用实例
const app = express();

// 配置 CORS：允许所有来源的跨域请求
// 在生产环境中，应该指定具体的域名，例如：origin: 'http://localhost:3000'
app.use(cors());

// 配置 Express 中间件：解析 JSON 格式的请求体
app.use(express.json());

// 配置 Express 中间件：解析 URL 编码的请求体（表单数据）
app.use(express.urlencoded({ extended: true }));

// 配置 multer：使用内存存储，文件保存在内存中（不保存到磁盘）
// 这样可以避免创建临时文件，所有处理都在内存中完成
const upload = multer({
  storage: multer.memoryStorage(),
  // 限制文件大小：10MB
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  // 文件过滤：只接受文本文件
  fileFilter: (req, file, cb) => {
    // 允许常见的文本文件类型
    const allowedMimeTypes = [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'text/csv',
      'text/xml'
    ];
    
    // 检查文件类型
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // 也允许没有 MIME 类型的文件（某些系统可能不提供）
      // 或者检查文件扩展名
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.txt', '.html', '.css', '.js', '.json', '.csv', '.xml', '.md'];
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('不支持的文件类型，请上传文本文件（.txt, .html, .js, .json, .csv, .xml, .md 等）'));
      }
    }
  }
});

/**
 * POST 接口：将输入的文本转换为大写
 * 路径：/api/uppercase
 * 请求体：{ "text": "要转换的文本" }
 * 响应：{ "result": "转换后的大写文本" }
 */
app.post('/api/uppercase', (req, res) => {
  try {
    // 从请求体中获取文本
    const { text } = req.body;

    // 参数验证：检查 text 是否存在
    if (text === undefined || text === null) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：text'
      });
    }

    // 将文本转换为字符串类型（防止非字符串类型）
    const textString = String(text);

    // 将文本转换为大写
    const uppercaseText = textString.toUpperCase();

    // 返回成功响应
    res.json({
      success: true,
      result: uppercaseText
    });
  } catch (error) {
    // 异常处理：捕获所有可能的错误
    console.error('处理请求时发生错误：', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

/**
 * POST 接口：文件上传并转换为大写
 * 路径：/api/uppercase-file
 * 请求：multipart/form-data，字段名：file
 * 响应：{ "result": "转换后的大写文本", "fileName": "原文件名" }
 */
app.post('/api/uppercase-file', upload.single('file'), (req, res) => {
  try {
    // 检查是否上传了文件
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的文件'
      });
    }

    // 获取文件信息
    const file = req.file;
    const fileName = file.originalname;

    // 读取文件内容
    // multer 使用内存存储时，文件内容在 file.buffer 中
    let fileContent;
    try {
      // 尝试使用 UTF-8 编码读取文件内容
      fileContent = file.buffer.toString('utf8');
    } catch (error) {
      // 如果 UTF-8 解码失败，尝试其他编码或返回错误
      return res.status(400).json({
        success: false,
        error: '文件编码不支持，请确保文件是 UTF-8 编码的文本文件',
        message: error.message
      });
    }

    // 检查文件内容是否为空
    if (!fileContent || fileContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '文件内容为空'
      });
    }

    // 将文件内容转换为大写
    const uppercaseContent = fileContent.toUpperCase();

    // 返回成功响应
    res.json({
      success: true,
      result: uppercaseContent,
      fileName: fileName,
      originalLength: fileContent.length,
      convertedLength: uppercaseContent.length
    });
  } catch (error) {
    // 异常处理：捕获所有可能的错误
    console.error('处理文件上传时发生错误：', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: error.message
    });
  }
});

/**
 * GET 接口：根路径
 * 返回 API 使用说明
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '文本转大写 API 服务',
    endpoints: {
      'POST /api/uppercase': '将文本转换为大写（JSON）',
      'POST /api/uppercase-file': '上传文件并转换为大写',
      'GET /health': '健康检查接口'
    },
    usage: '请使用前端页面（index.html）或直接调用 API 接口'
  });
});

/**
 * GET 接口：健康检查接口
 * 用于测试服务器是否正常运行
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常'
  });
});

/**
 * 404 处理：处理所有未定义的路由
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    message: `路径 ${req.path} 未找到`,
    availableEndpoints: {
      'POST /api/uppercase': '将文本转换为大写（JSON）',
      'POST /api/uppercase-file': '上传文件并转换为大写',
      'GET /health': '健康检查接口',
      'GET /': 'API 使用说明'
    }
  });
});

// 定义服务器端口号
const PORT = 3000;

// 启动服务器，监听指定端口
app.listen(PORT, () => {
  console.log(`后端服务器已启动，运行在 http://localhost:${PORT}`);
  console.log(`健康检查接口：http://localhost:${PORT}/health`);
  console.log(`文本转大写接口：http://localhost:${PORT}/api/uppercase`);
  console.log(`文件上传接口：http://localhost:${PORT}/api/uppercase-file`);
});
