
import React, { useState } from 'react';
import * as Icons from './Icons';

interface BuildPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: any;
}

type Platform = 'apk' | 'windows' | 'ios';

export const BuildPackageModal: React.FC<BuildPackageModalProps> = ({
  isOpen,
  onClose,
  projectData
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('apk');
  const [buildStatus, setBuildStatus] = useState<'idle' | 'uploading' | 'building' | 'completed' | 'error'>('idle');
  const [buildId, setBuildId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useCurrentProject, setUseCurrentProject] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const platforms = [
    {
      id: 'apk' as Platform,
      name: 'Android APK',
      icon: '🤖',
      description: 'Android应用安装包',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'windows' as Platform,
      name: 'Windows EXE',
      icon: '🪟',
      description: 'Windows可执行文件',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'ios' as Platform,
      name: 'iOS IPA',
      icon: '🍎',
      description: 'iOS应用安装包',
      color: 'from-gray-600 to-gray-800'
    }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setUploadedFile(file);
      setErrorMessage('');
    } else if (file) {
      setErrorMessage('请选择JSON文件');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      setUploadedFile(file);
      setErrorMessage('');
    } else if (file) {
      setErrorMessage('请选择JSON文件');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // 辅助函数：生成 UUID
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // 辅助函数：读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleBuild = async () => {
    if (useCurrentProject && !projectData) {
      setErrorMessage('当前项目数据为空，请上传JSON文件');
      return;
    }

    if (!useCurrentProject && !uploadedFile) {
      setErrorMessage('请先上传JSON文件');
      return;
    }

    setBuildStatus('uploading');
    setErrorMessage('');

    try {
      let rawJsonString = '';
      if (useCurrentProject) {
        rawJsonString = JSON.stringify(projectData);
      } else {
        rawJsonString = await readFileContent(uploadedFile!);
      }

      const base64Data = btoa(unescape(encodeURIComponent(rawJsonString)));
      const newBuildId = generateUUID();

      const payload = {
        build_id: newBuildId,
        project_json: base64Data,
        build_android: selectedPlatform === 'apk' ? 'true' : 'false',
        build_windows: selectedPlatform === 'windows' ? 'true' : 'false',
        build_ios: selectedPlatform === 'ios' ? 'true' : 'false',
        build_web: 'false'
      };

      const response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`请求失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '构建请求被拒绝');
      }

      setBuildId(newBuildId);
      setBuildStatus('building');
      pollBuildStatus(newBuildId);

    } catch (error: any) {
      console.error('Build Error:', error);
      setBuildStatus('error');
      setErrorMessage(error.message || '网络连接失败，请检查后端服务');
    }
  };

  const pollBuildStatus = async (id: string) => {
    const maxAttempts = 120; // 6 mins
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/build/status/${id}`);
        if (!response.ok) {
            throw new Error('Status check failed');
        }
        
        const status = await response.json();
        
        if (status.status === 'completed' && status.conclusion === 'success') {
           setBuildStatus('completed');
           // Prefer ID-based direct download link if available
           if (status.id) {
               setDownloadUrl(`/download/${status.id}`);
           } else if (status.artifacts_url) {
               setDownloadUrl(status.artifacts_url);
           } else {
               // Fallback if backend doesn't return URL
               setDownloadUrl(''); 
           }
        } else if (status.status === 'completed' && status.conclusion === 'failure') {
           setBuildStatus('error');
           setErrorMessage('GitHub 构建失败，请查看日志');
        } else if (attempts < maxAttempts) {
           attempts++;
           setTimeout(poll, 3000);
        } else {
           setBuildStatus('error');
           setErrorMessage('等待超时，请直接去 GitHub 查看');
        }
      } catch (error: any) {
         if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 3000);
         }
      }
    };

    poll(); 
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      window.open('https://github.com/hualingluo/flutterPack/actions', '_blank');
    }
  };

  const handleReset = () => {
    setBuildStatus('idle');
    setBuildId(null);
    setDownloadUrl('');
    setErrorMessage('');
    setUploadedFile(null);
  };

  const handleSourceTypeChange = (useCurrent: boolean) => {
    setUseCurrentProject(useCurrent);
    setUploadedFile(null);
    setErrorMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Icons.Package className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">打包应用</h2>
              <p className="text-xs text-slate-400">选择目标平台并构建</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <Icons.X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {buildStatus === 'idle' && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">选择数据源</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => handleSourceTypeChange(true)} className={`p-4 rounded-xl border-2 transition-all ${useCurrentProject ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                    <div className="flex items-center gap-3">
                      <Icons.FileText className={useCurrentProject ? 'text-purple-400' : 'text-slate-400'} size={24} />
                      <div className="text-left">
                        <div className={`text-sm font-bold mb-1 ${useCurrentProject ? 'text-purple-400' : 'text-slate-300'}`}>当前项目</div>
                        <div className="text-xs text-slate-500">使用编辑器中的项目数据</div>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => handleSourceTypeChange(false)} className={`p-4 rounded-xl border-2 transition-all ${!useCurrentProject ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                    <div className="flex items-center gap-3">
                      <Icons.Upload className={!useCurrentProject ? 'text-purple-400' : 'text-slate-400'} size={24} />
                      <div className="text-left">
                        <div className={`text-sm font-bold mb-1 ${!useCurrentProject ? 'text-purple-400' : 'text-slate-300'}`}>上传文件</div>
                        <div className="text-xs text-slate-500">上传JSON配置文件</div>
                      </div>
                    </div>
                  </button>
                </div>

                {!useCurrentProject && (
                  <div onDrop={handleDrop} onDragOver={handleDragOver} className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${uploadedFile ? 'border-green-500 bg-green-500/10' : 'border-slate-600 bg-slate-800/30 hover:border-purple-500 hover:bg-purple-500/5'}`}>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                    <div className="mb-3">
                      {uploadedFile ? <Icons.CheckCircle className="text-green-500 w-12 h-12 mx-auto" fill="currentColor" /> : <Icons.Upload className="text-slate-400 w-12 h-12 mx-auto" />}
                    </div>
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-medium text-green-400 mb-1">{uploadedFile.name}</p>
                        <button onClick={() => setUploadedFile(null)} className="text-xs text-slate-400 hover:text-red-400 transition-colors">移除文件</button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-400 mb-2">拖放JSON文件到这里，或</p>
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors">选择文件</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">选择目标平台</h3>
                <div className="grid grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <button key={platform.id} onClick={() => setSelectedPlatform(platform.id)} className={`relative p-4 rounded-xl border-2 transition-all ${selectedPlatform === platform.id ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}`}>
                      <div className={`text-3xl mb-2`}>{platform.icon}</div>
                      <div className={`text-sm font-bold mb-1 ${selectedPlatform === platform.id ? 'text-purple-400' : 'text-slate-300'}`}>{platform.name}</div>
                      <div className="text-xs text-slate-500">{platform.description}</div>
                      {selectedPlatform === platform.id && <div className="absolute top-2 right-2"><Icons.CheckCircle className="text-purple-500 w-5 h-5" fill="currentColor" /></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icons.Info className="text-blue-400 w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-400 mb-1">云构建说明</h4>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• {useCurrentProject ? '将使用当前编辑器中的项目数据' : '将使用上传的JSON文件'}进行构建</li>
                      <li>• 使用 GitHub Actions 进行云构建，无需本地 Flutter 环境</li>
                      <li>• 构建过程可能需要 5-15 分钟</li>
                    </ul>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icons.XCircle className="text-red-400 w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-400 break-all">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">取消</button>
                <button onClick={handleBuild} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 flex items-center gap-2">
                  <Icons.Rocket size={16} /> 开始云构建
                </button>
              </div>
            </>
          )}

          {(buildStatus === 'uploading' || buildStatus === 'building') && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-4">
                <div className="animate-spin"><Icons.Loader2 className="text-purple-500 w-10 h-10" /></div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{buildStatus === 'uploading' ? '正在提交任务...' : '云构建已触发'}</h3>
              <p className="text-sm text-slate-400 mb-4">{buildStatus === 'uploading' ? '正在加密上传项目数据...' : 'GitHub Actions 已接收任务，请稍后查看'}</p>
              {buildId && <div className="inline-block bg-slate-800 rounded-lg px-4 py-2 mb-4"><p className="text-xs text-slate-500">Task ID</p><p className="text-sm font-mono text-purple-400">{buildId}</p></div>}
              <div className="bg-slate-800 rounded-lg px-4 py-2 mt-4">
                <p className="text-xs text-slate-500 mb-2">您可以关闭此窗口，稍后在 GitHub 查看进度</p>
                <a href="https://github.com/hualingluo/flutterPack/actions" target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2">
                  <Icons.ExternalLink size={12} /> 前往 GitHub Actions 查看实时日志
                </a>
              </div>
            </div>
          )}

          {buildStatus === 'completed' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4"><Icons.CheckCircle className="text-green-500 w-10 h-10" fill="currentColor" /></div>
              <h3 className="text-lg font-semibold text-white mb-2">构建成功!</h3>
              <p className="text-sm text-slate-400 mb-6">您的应用已准备好下载</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <button onClick={handleDownload} className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-sm font-medium text-white shadow-lg shadow-green-500/25 transition-all hover:scale-105 flex items-center gap-2">
                  <Icons.Download size={16} /> 下载应用
                </button>
                <button onClick={handleReset} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">返回</button>
              </div>
            </div>
          )}

          {buildStatus === 'error' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-4"><Icons.XCircle className="text-red-500 w-10 h-10" fill="currentColor" /></div>
              <h3 className="text-lg font-semibold text-white mb-2">构建失败</h3>
              <p className="text-sm text-red-400 mb-6 max-w-md mx-auto">{errorMessage}</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={handleReset} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2">
                  <Icons.RefreshCw size={16} /> 重试
                </button>
                <button onClick={onClose} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">关闭</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
