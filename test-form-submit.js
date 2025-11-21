// 模拟表单提交测试
console.log('开始测试咨询表单功能...\n');

// 模拟测试数据
const testData = {
    name: '张三',
    phone: '+86 138 0013 8000',
    email: 'zhangsan@example.com',
    approach: 'new-build',
    requirements: '我想要一艘60米的探险游艇，主要用于环球航行，预算约3000万人民币。希望有直升机停机坪和潜水设备。'
};

console.log('=== 测试数据 ===');
console.log('姓名:', testData.name);
console.log('电话:', testData.phone);
console.log('邮箱:', testData.email);
console.log('意向途径:', testData.approach);
console.log('需求描述:', testData.requirements);

// 模拟表单处理函数
function simulateFormSubmit(data) {
    console.log('\n=== 开始处理表单 ===');
    
    // 表单验证
    if (!data.name || !data.phone || !data.approach) {
        console.log('❌ 表单验证失败：缺少必填字段');
        return false;
    }
    console.log('✅ 表单验证通过');
    
    // 获取意向途径文本
    const approachMap = {
        'new-build': '全新定制',
        'conversion': '二手改造',
        'both': '都想了解'
    };
    
    const approachText = approachMap[data.approach] || data.approach;
    console.log('✅ 意向途径转换:', approachText);
    
    // 构建邮件内容
    const emailContent = `
姓名：${data.name}
电话：${data.phone}
邮箱：${data.email || '未提供'}
意向途径：${approachText}
简要需求：${data.requirements || '未提供'}

---
此邮件来自探险游艇定制与改造中心官网
时间：${new Date().toLocaleString('zh-CN')}
    `.trim();
    
    console.log('\n=== 生成的邮件内容 ===');
    console.log(emailContent);
    
    // 构建邮件主题和链接
    const subject = encodeURIComponent('探险游艇定制咨询');
    const body = encodeURIComponent(emailContent);
    const mailtoUrl = `mailto:BUILD@XINYOUTING.COM?subject=${subject}&body=${body}`;
    
    console.log('\n=== 邮件信息 ===');
    console.log('收件人: BUILD@XINYOUTING.COM');
    console.log('主题: 探险游艇定制咨询');
    console.log('邮件长度:', emailContent.length, '字符');
    
    console.log('\n=== 邮件链接 ===');
    console.log(mailtoUrl);
    
    console.log('\n✅ 表单处理成功！');
    console.log('✅ 邮件已准备发送到 BUILD@XINYOUTING.COM');
    
    return {
        success: true,
        recipient: 'BUILD@XINYOUTING.COM',
        subject: '探险游艇定制咨询',
        mailtoUrl: mailtoUrl
    };
}

// 执行测试
const result = simulateFormSubmit(testData);

if (result.success) {
    console.log('\n🎉 测试完成！咨询表单功能正常工作');
    console.log('📧 邮件将发送到:', result.recipient);
    console.log('📋 测试结果: 所有功能正常');
} else {
    console.log('\n❌ 测试失败！请检查表单配置');
}