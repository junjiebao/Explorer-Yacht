const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// 添加这些中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加错误处理中间件
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: '服务器错误' });
});

// JWT密钥
const JWT_SECRET = 'your-secret-key';

// 数据库连接配置
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'explorer_yacht',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 确保存储目录存在
const STORAGE_DIR = path.join(__dirname, 'storage', 'surveys');
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const normalizedUser = (username || '').trim().toUpperCase();
    console.log('收到登录请求:', { username: normalizedUser });

    if (!normalizedUser || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM admins WHERE UPPER(username) = ?',
            [normalizedUser]
        );
        connection.release();

        if (rows.length === 0) {
            console.log('用户不存在:', normalizedUser);
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const admin = rows[0];
        const validPassword = await bcrypt.compare(password, admin.password);
        console.log('密码验证结果:', validPassword);

        if (!validPassword) {
            console.log('密码错误');
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('登录成功:', normalizedUser);
        res.json({ token, username: admin.username });
    } catch (error) {
        console.error('登录处理错误:', error);
        res.status(500).json({ error: '服务器错误，请确认数据库是否已启动' });
    }
});

// 验证JWT中间件（支持 Authorization header 和 query ?token=）
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;
    const token = authHeader ? authHeader.split(' ')[1] : queryToken;

    if (!token) {
        return res.status(401).json({ error: '未授权' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: '无效的token' });
    }
};

// 获取调研列表（需要登录）
app.get('/api/admin/surveys', authenticateJWT, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM surveys ORDER BY created_at DESC');
        // 将 data 字段（JSON字符串）展开合并，方便前端直接使用
        const result = rows.map(row => {
            let parsed = {};
            try { parsed = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch {}
            return { ...parsed, ...row };
        });
        res.json(result);
    } catch (error) {
        console.error('获取数据失败：', error);
        res.status(500).json({ error: '获取数据失败' });
    }
});

// 更新调研状态（需要登录）
app.patch('/api/admin/surveys/:id/status', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['new', 'processing', 'contacted', 'completed'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ error: '无效的状态值' });
    }
    try {
        await pool.execute('UPDATE surveys SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (error) {
        console.error('更新状态失败：', error);
        res.status(500).json({ error: '更新状态失败' });
    }
});

// 导出Excel（需要登录，支持 ?token= query 参数）
app.get('/api/admin/export', authenticateJWT, async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('调研数据');

        worksheet.columns = [
            { header: '提交时间',     key: 'submitTime',    width: 22 },
            { header: '称呼/姓名',    key: 'name',          width: 15 },
            { header: '联系方式',     key: 'contact',       width: 20 },
            { header: '电子邮箱',     key: 'email',         width: 26 },
            { header: '所在地区',     key: 'region',        width: 15 },
            { header: '游艇类型',     key: 'yacht_types',   width: 20 },
            { header: '计划航行区域', key: 'areas',         width: 28 },
            { header: '期望长度',     key: 'length',        width: 15 },
            { header: '舱室数量',     key: 'cabins',        width: 12 },
            { header: '预算范围',     key: 'budget',        width: 20 },
            { header: '预计同行人数', key: 'crew',          width: 14 },
            { header: '动力系统',     key: 'power',         width: 15 },
            { header: '特殊设备',     key: 'features',      width: 30 },
            { header: '内饰风格',     key: 'interior',      width: 15 },
            { header: '购置时间',     key: 'timeline',      width: 15 },
            { header: '了解程度',     key: 'experience',    width: 15 },
            { header: '希望获得帮助', key: 'help',          width: 25 },
            { header: '首选联系方式', key: 'reachby',       width: 15 },
            { header: '补充说明',     key: 'notes',         width: 40 },
            { header: '状态',         key: 'status',        width: 12 },
        ];

        // 表头样式
        worksheet.getRow(1).eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        worksheet.getRow(1).height = 26;

        const [rows] = await pool.execute('SELECT * FROM surveys ORDER BY created_at DESC');

        const statusLabel = { new: '待处理', processing: '处理中', contacted: '已联系', completed: '已完成' };
        const joinArr = v => Array.isArray(v) ? v.join('、') : (v || '');

        rows.forEach((row, idx) => {
            let d = {};
            try { d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch {}
            const merged = { ...d, ...row };

            const timeVal = merged.created_at || merged.submitTime || merged.submit_time || '';
            const timeStr = timeVal ? new Date(timeVal).toLocaleString('zh-CN') : '';

            const dataRow = worksheet.addRow({
                submitTime:  timeStr,
                name:        merged.name || '',
                contact:     merged.contact || '',
                email:       merged.email || '',
                region:      merged.region || merged.location || '',
                yacht_types: joinArr(merged.yacht_types || merged.yachtTypes),
                areas:       joinArr(merged.areas || merged.cruising_area),
                length:      merged.length || merged.size_range || '',
                cabins:      merged.cabins || '',
                budget:      merged.budget || '',
                crew:        merged.crew || '',
                power:       merged.power || '',
                features:    joinArr(merged.features || merged.equipment),
                interior:    merged.interior || '',
                timeline:    merged.timeline || '',
                experience:  merged.experience || '',
                help:        joinArr(merged.help),
                reachby:     merged.reachby || '',
                notes:       merged.notes || merged.additional_notes || '',
                status:      statusLabel[merged.status] || '待处理',
            });

            // 交替行背景
            if (idx % 2 === 1) {
                dataRow.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F6FF' } };
                });
            }
            dataRow.alignment = { vertical: 'middle', wrapText: false };
        });

        const date = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''%E8%B0%83%E7%A0%94%E6%95%B0%E6%8D%AE_${date}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('导出失败：', error);
        res.status(500).json({ error: '导出失败' });
    }
});

// 邮件配置（使用环境变量或默认值）
const mailTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.exmail.qq.com',
    port: parseInt(process.env.MAIL_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USER || 'yacht@tanxianyouting.com',
        pass: process.env.MAIL_PASS || ''   // 在生产环境通过 MAIL_PASS 环境变量配置
    }
});

// 格式化调研数据为 HTML 邮件
function buildSurveyEmail(data) {
    const row = (label, value) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return '';
        const val = Array.isArray(value) ? value.join('、') : value;
        return `<tr><td style="padding:8px 12px;background:#f0f6ff;color:#555;width:160px;font-weight:600;border-bottom:1px solid #e2e8f0">${label}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${val}</td></tr>`;
    };

    return `
<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><title>新调研问卷</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a202c;background:#f7fafc;margin:0;padding:20px">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#0F4C81,#1a7fa8);color:#fff;padding:28px 32px">
      <h1 style="margin:0;font-size:1.5rem;font-weight:700">🛥️ 新探险游艇需求调研</h1>
      <p style="margin:8px 0 0;opacity:.85;font-size:.95rem">提交时间：${data.submitted_at}</p>
    </div>
    <div style="padding:28px 32px">
      <h2 style="font-size:1rem;color:#0F4C81;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #ebf4ff">基本信息</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
        ${row('称呼 / 姓名', data.name)}
        ${row('联系方式', data.contact)}
        ${row('电子邮箱', data.email)}
        ${row('所在地区', data.region)}
      </table>

      <h2 style="font-size:1rem;color:#0F4C81;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #ebf4ff">探险目标</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
        ${row('游艇类型', data.yacht_types)}
        ${row('计划航行区域', data.areas)}
      </table>

      <h2 style="font-size:1rem;color:#0F4C81;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #ebf4ff">规格需求</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
        ${row('期望游艇长度', data.length)}
        ${row('舱室数量', data.cabins)}
        ${row('预算范围', data.budget)}
        ${row('预计同行人数', data.crew)}
      </table>

      <h2 style="font-size:1rem;color:#0F4C81;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #ebf4ff">特殊配置</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
        ${row('动力系统', data.power)}
        ${row('特殊设备', data.features)}
        ${row('内饰风格', data.interior)}
      </table>

      <h2 style="font-size:1rem;color:#0F4C81;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #ebf4ff">购置意向</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
        ${row('购置时间', data.timeline)}
        ${row('了解程度', data.experience)}
        ${row('希望获得帮助', data.help)}
        ${row('首选联系方式', data.reachby)}
      </table>

      ${data.notes ? `
      <h2 style="font-size:1rem;color:#0F4C81;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;padding-bottom:8px;border-bottom:2px solid #ebf4ff">补充说明</h2>
      <div style="background:#f7fafc;border-radius:8px;padding:16px 20px;color:#374151;line-height:1.7;margin-bottom:28px">${data.notes}</div>
      ` : ''}
    </div>
    <div style="background:#f0f6ff;padding:16px 32px;text-align:center;font-size:.85rem;color:#718096">
      此邮件由 Explorer Yacht 调研系统自动发送 · <a href="https://www.tanxianyouting.com" style="color:#0F4C81">tanxianyouting.com</a>
    </div>
  </div>
</body>
</html>`;
}




// 提交调研表单
app.post('/api/submit-survey', async (req, res) => {
    try {
        const data = req.body;
        const timestamp = new Date();
        const formattedDate = timestamp.toISOString().split('T')[0];
        data.submitted_at = data.submitted_at || timestamp.toLocaleString('zh-CN');

        // 发送邮件通知
        try {
            await mailTransporter.sendMail({
                from: `"Explorer Yacht 调研系统" <${process.env.MAIL_USER || 'yacht@tanxianyouting.com'}>`,
                to: 'yacht@tanxianyouting.com',
                subject: `【新调研】${data.name || '匿名'} · ${data.region || ''} · ${timestamp.toLocaleDateString('zh-CN')}`,
                html: buildSurveyEmail(data)
            });
            console.log('调研邮件发送成功 →', data.name);
        } catch (mailErr) {
            // 邮件发送失败不影响主流程，只记录错误
            console.error('邮件发送失败：', mailErr.message);
        }

        // 保存到数据库
        await pool.execute(
            'INSERT INTO surveys (data, submit_time) VALUES (?, ?)',
            [JSON.stringify(data), timestamp]
        );

        // 创建或更新当天的Excel文件
        const fileName = `surveys_${formattedDate}.xlsx`;
        const filePath = path.join(STORAGE_DIR, fileName);
        
        let workbook;
        if (fs.existsSync(filePath)) {
            workbook = await new ExcelJS.Workbook().xlsx.readFile(filePath);
        } else {
            workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('调研数据');
            
            // 设置表头
            worksheet.columns = [
                { header: '提交时间', key: 'submitTime', width: 20 },
                { header: '称谓', key: 'title', width: 10 },
                { header: '姓名', key: 'name', width: 15 },
                { header: '联系方式', key: 'contact', width: 20 },
                { header: '所在地区', key: 'location', width: 15 },
                { header: '驾驶经验', key: 'experience', width: 15 },
                { header: '新艇/二手艇', key: 'yacht_condition', width: 15 },
                { header: '尺寸范围', key: 'size_range', width: 15 },
                { header: '预算范围', key: 'budget', width: 20 },
                { header: '使用方式', key: 'usage', width: 30 },
                { header: '航行区域', key: 'cruising_area', width: 30 },
                { header: '年使用时间', key: 'usage_time', width: 15 },
                { header: '特殊设备需求', key: 'equipment', width: 30 },
                { header: '游艇管理服务', key: 'management_service', width: 15 },
                { header: '船员招募服务', key: 'crew_recruitment', width: 15 },
                { header: '其他需求说明', key: 'additional_notes', width: 40 }
            ];
        }

        // 添加新数据
        const worksheet = workbook.getWorksheet('调研数据');
        worksheet.addRow({
            submitTime: timestamp.toLocaleString(),
            ...data,
            usage: Array.isArray(data.usage) ? data.usage.join(', ') : data.usage,
            cruising_area: Array.isArray(data.cruising_area) ? data.cruising_area.join(', ') : data.cruising_area,
            equipment: Array.isArray(data.equipment) ? data.equipment.join(', ') : data.equipment
        });

        // 保存Excel文件
        await workbook.xlsx.writeFile(filePath);

        res.json({ success: true });
    } catch (error) {
        console.error('提交失败：', error);
        res.status(500).json({ error: '提交失败' });
    }
});

// 添加获取Excel文件列表的接口
app.get('/api/admin/survey-files', authenticateJWT, (req, res) => {
    try {
        const files = fs.readdirSync(STORAGE_DIR)
            .filter(file => file.endsWith('.xlsx'))
            .map(file => ({
                name: file,
                path: `/storage/surveys/${file}`,
                date: file.split('_')[1].split('.')[0]
            }))
            .sort((a, b) => b.date.localeCompare(a.date));

        res.json(files);
    } catch (error) {
        console.error('获取文件列表失败：', error);
        res.status(500).json({ error: '获取文件列表失败' });
    }
});

// 添加文件下载接口
app.get('/storage/surveys/:filename', authenticateJWT, (req, res) => {
    const filePath = path.join(STORAGE_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: '文件不存在' });
    }
});

// 初始化管理员账号
async function initializeAdmin() {
    try {
        const connection = await pool.getConnection();

        // 确保 surveys 表存在（含 status 字段）
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS surveys (
                id INT AUTO_INCREMENT PRIMARY KEY,
                data JSON,
                submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(32) DEFAULT 'new'
            )
        `);
        // 若旧表缺少 status 列则补加（幂等）
        await connection.execute(`
            ALTER TABLE surveys ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'new'
        `).catch(() => {}); // 若数据库不支持 IF NOT EXISTS 则静默忽略

        // 检查admins表是否存在
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 检查是否已存在管理员账号
        const [rows] = await connection.execute(
            'SELECT * FROM admins WHERE username = ?',
            ['JOEY.BAO@tanxianyouting.com']
        );

        if (rows.length === 0) {
            // 创建新管理员账号
            const hashedPassword = await bcrypt.hash('Joey@8837', 10);
            await connection.execute(
                'INSERT INTO admins (username, password) VALUES (?, ?)',
                ['JOEY.BAO@tanxianyouting.com', hashedPassword]
            );
            console.log('管理员账号创建成功');
        } else {
            // 更新现有账号的密码
            const hashedPassword = await bcrypt.hash('Joey@8837', 10);
            await connection.execute(
                'UPDATE admins SET password = ? WHERE username = ?',
                [hashedPassword, 'JOEY.BAO@tanxianyouting.com']
            );
            console.log('管理员账号密码已更新');
        }

        connection.release();
    } catch (error) {
        console.error('初始化管理员账号失败：', error);
    }
}

// 在服务器启动时初始化管理员账号
app.listen(3000, () => {
    console.log('Server running on port 3000');
    initializeAdmin();
}); 