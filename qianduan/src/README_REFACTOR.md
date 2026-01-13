# 前端架构重构说明

## 📁 新的目录结构

```
qianduan/
├── src/                          # 新的源代码目录
│   ├── components/
│   │   └── editor/               # 编辑器相关组件
│   │       ├── Editor.tsx        # 主编辑器容器（重构后）
│   │       ├── canvas/           # 画布组件
│   │       │   ├── StoryCanvas.tsx
│   │       │   ├── NodeRenderer.tsx
│   │       │   └── ConnectionLines.tsx
│   │       └── toolbar/          # 工具栏组件
│   │           └── EditorToolbar.tsx
│   ├── stores/                   # Zustand 状态管理
│   │   ├── useProjectStore.ts    # 项目数据状态
│   │   └── useEditorStore.ts     # 编辑器 UI 状态
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useCanvasOperations.ts
│   │   ├── useNodeOperations.ts
│   │   └── useProjectPersistence.ts
│   ├── types/                    # 类型定义（待迁移）
│   ├── utils/                    # 工具函数（待添加）
│   └── constants/                # 常量配置（待添加）
├── components/                   # 原有组件保持不变
│   ├── Editor.tsx                # 现在是重导出文件
│   ├── Editor.tsx.backup         # 原始文件备份
│   ├── Dashboard.tsx
│   ├── PropertyPanel.tsx
│   ├── StorySidebar.tsx
│   └── ... (其他组件)
└── services/                     # API 服务层（保持不变）
```

## ✅ 已完成的优化

### 1. **状态管理 (Zustand)**
- ✅ `useProjectStore`: 管理项目数据（nodes, characters, metadata）
- ✅ `useEditorStore`: 管理编辑器 UI 状态（viewport, selectedNodeId 等）

**优势**:
- 消除了 props drilling
- 全局状态可从任何组件访问
- 更好的性能（选择性订阅）

### 2. **组件拆分**

#### Canvas 组件
- ✅ `StoryCanvas`: 画布容器，处理背景和变换
- ✅ `NodeRenderer`: 单个节点渲染器
- ✅ `ConnectionLines`: 节点连线 SVG

#### Toolbar 组件
- ✅ `EditorToolbar`: 顶部工具栏，包含所有操作按钮

**优势**:
- Editor.tsx 从 462 行减少到 ~220 行
- 每个组件职责单一，易于测试和维护

### 3. **自定义 Hooks**
- ✅ `useCanvasOperations`: 画布拖拽、缩放逻辑
- ✅ `useNodeOperations`: 节点增删改查
- ✅ `useProjectPersistence`: 项目保存、导出、发布

**优势**:
- 业务逻辑复用
- 组件代码更简洁
- 易于单元测试

### 4. **架构改进**

#### Before (原架构):
```
Editor.tsx (462 lines)
├── 所有状态管理 (useState)
├── 所有业务逻辑
├── 画布渲染
├── 工具栏
└── 属性面板
```

#### After (新架构):
```
Editor.tsx (220 lines)
├── stores/ (全局状态)
├── hooks/ (业务逻辑)
└── components/ (UI 组件)
    ├── canvas/
    ├── toolbar/
    └── modals/
```

## 🚀 使用示例

### 在组件中使用状态管理

```typescript
import { useProjectStore } from './stores/useProjectStore';
import { useEditorStore } from './stores/useEditorStore';

function MyComponent() {
  const { nodes, addNode, updateNode } = useProjectStore();
  const { viewport, selectedNodeId } = useEditorStore();

  // 使用状态和方法
  const handleClick = () => {
    addNode({
      id: 'node_1',
      title: '新节点',
      // ...
    });
  };

  return <div>{nodes.length} 个节点</div>;
}
```

### 使用自定义 Hooks

```typescript
import { useNodeOperations } from './hooks/useNodeOperations';

function NodeEditor() {
  const { handleAddNode, handleUpdateNode } = useNodeOperations();

  return (
    <button onClick={() => handleAddNode('scene')}>
      添加场景节点
    </button>
  );
}
```

## 📊 代码对比

### Before (原 Editor.tsx)
```typescript
// 大量的 useState
const [nodes, setNodes] = useState(...);
const [selectedId, setSelectedId] = useState(null);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
// ... 20+ 个状态

// 复杂的嵌套逻辑
const handleMouseMove = (e) => {
  if (isDraggingCanvas) {
    setPan({ x: e.clientX - dragStart.x, y: ... });
  } else if (dragNodeId) {
    setNodes(prev => ({ ...prev, [dragNodeId]: { ... }}));
  }
};
```

### After (新架构)
```typescript
// 简洁的状态访问
const { nodes, addNode } = useProjectStore();
const { viewport, selectedNodeId } = useEditorStore();

// 清晰的职责分离
const { handleAddNode } = useNodeOperations();
const { handleCanvasMouseMove } = useCanvasOperations();
```

## 🎯 下一步优化建议

### 优先级 2 (短期)
1. **迁移类型定义**: 将 `types.ts` 拆分为多个文件
   - `types/story.types.ts`
   - `types/editor.types.ts`
   - `types/api.types.ts`

2. **添加工具函数**: 创建 `utils/` 目录
   - `utils/helpers.ts`: 通用辅助函数
   - `utils/validators.ts`: 数据验证
   - `utils/formatters.ts`: 格式化函数

3. **改进 PropertyPanel**: 拆分为子组件
   - `BasicInfoSection`
   - `MediaSection`
   - `BranchesSection`
   - `MonetizationSection`

### 优先级 3 (长期)
4. **单元测试**: 为 stores 和 hooks 添加测试
5. **性能优化**: 使用 React.memo 和 useMemo
6. **错误边界**: 添加错误处理组件

## ⚠️ 注意事项

1. **原始文件已备份**: `components/Editor.tsx.backup`
2. **导入路径更新**: `App.tsx` 现在从 `src/components/editor` 导入
3. **向后兼容**: 其他组件的导入路径保持不变

## 🔧 开发指南

### 添加新的状态
在对应的 store 文件中添加：
```typescript
// useProjectStore.ts
interface ProjectState {
  newField: string;
  setNewField: (value: string) => void;
}
```

### 添加新的 Hook
```typescript
// hooks/useMyHook.ts
export const useMyHook = () => {
  const { nodes } = useProjectStore();
  // 自定义逻辑
  return { /* ... */ };
};
```

### 添加新的组件
```
src/components/editor/myFeature/
├── MyFeature.tsx
└── index.ts
```

## 📝 总结

✅ **已完成**:
- ✨ 使用 Zustand 实现全局状态管理
- 🎨 将 Editor.tsx 拆分为多个小组件
- 🔧 提取可复用的自定义 hooks
- 📦 创建清晰的目录结构

✅ **改进效果**:
- 📉 Editor.tsx 从 462 行减少到 ~220 行 (减少 52%)
- 🎯 单一职责原则：每个文件/函数只做一件事
- 🔍 更好的可测试性
- 🚀 更容易扩展新功能

---

**重构日期**: 2026-01-13
**重构者**: Claude Code
**版本**: v2.0
