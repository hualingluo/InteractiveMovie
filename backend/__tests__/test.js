
const util = require('util');



    test('sum 函数应该正确计算 1 + 2 = 3', () => {
const PLATFORM_CONFIG = require('../config/platforms');


    // --- 动态构建 inputs 对象 ---
    const inputs = {
    //   project_json: base64Json,
      build_id: "test"
    };

    const platform = "windows";

console.log(util.inspect(PLATFORM_CONFIG, { showHidden: false, depth: null, colors: true }));


    // 遍历配置表，动态设置开关
    Object.keys(PLATFORM_CONFIG).forEach(key => {
      const config = PLATFORM_CONFIG[key];
      // 如果传入的 platform 匹配当前 key，则为 'true'，否则为 'false'
      inputs[config.inputKey] = (platform === key) ? 'true' : 'false';
      console.log("config: ",JSON.stringify(config));
    });

    // 2. 打印日志（调试用）
  console.log("生成的 Inputs:", JSON.stringify(inputs, null, 2));

  // 3. 编写断言 (这是单元测试的灵魂)
//   expect(inputs.build_windows).toBe('true');
  
  // 验证 windows 应该是 'true' (假设 PLATFORM_CONFIG 中 windows 对应的 inputKey 是 build_windows)
//   const windowsKey = PLATFORM_CONFIG['windows'].inputKey;
//   expect(inputs[windowsKey]).toBe('true');

  // 验证其他平台应该是 'false' (例如 apk)
//   if (PLATFORM_CONFIG['apk']) {
//     const apkKey = PLATFORM_CONFIG['apk'].inputKey;
//     expect(inputs[apkKey]).toBe('false');
//   }
  });