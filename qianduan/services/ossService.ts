/**
 * 模拟 OSS 存储服务
 * 在实际生产环境中，此处应调用阿里云 OSS、腾讯云 COS 或 AWS S3 的 SDK。
 * 流程：客户端选择文件 -> 上传至 OSS -> OSS 返回持久化 CDN 链接 -> 将链接保存至业务数据库 (JSON)。
 */
export const mockUploadToOSS = async (file: File): Promise<string> => {
    // 模拟网络上传延迟，让用户有“正在上传”的感觉
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 在前端模拟环境下，我们使用 URL.createObjectURL 生成一个可访问的临时地址。
    // 在真实场景中，这里会返回类似 "https://douju-assets.oss-cn-hangzhou.aliyuncs.com/v/scene_01.mp4" 的字符串。
    return URL.createObjectURL(file);
};