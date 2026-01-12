/**
 * 服务统一导出
 * 提供对所有服务的集中访问点
 */

// ========== 构建服务 ==========
export { runFlutterBuild } from './build/flutterBuilder.js';
export { buildExe } from './build/flutterBuilderNew.js';

// ========== 变现服务 ==========
export { default as AdManager } from './monetization/adManager.js';
export { default as PaymentManager } from './monetization/paymentManager.js';
export { default as UserDataManager } from './monetization/userDataManager.js';
