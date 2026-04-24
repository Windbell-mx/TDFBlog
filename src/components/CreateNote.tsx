import { useState, useEffect, useRef } from 'react';
import '../styles/CreateNote.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';

interface CreateNoteProps {
  onBack: () => void;
  onSave: (note: { 
    title: string; 
    content: string; 
    tags: string[];
    category: string;
    permission: string
  }) => void;
}

const CreateNote = ({ onBack, onSave }: CreateNoteProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('学习笔记');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [permission, setPermission] = useState('private');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date().toLocaleString());
  const editorRef = useRef<any>(null);

  // 自动保存功能
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (title || content.trim()) {
        setLastSaved(new Date().toLocaleString());
      }
    }, 30000); // 每30秒自动保存

    return () => {
      clearInterval(saveInterval);
    };
  }, [title, content]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }

    if (!content.trim()) {
      alert('请输入内容');
      return;
    }

    setIsSaving(true);

    // 模拟保存操作
    setTimeout(() => {
      onSave({
        title: title.trim(),
        content,
        tags,
        category,
        permission
      });
      setIsSaving(false);
      setLastSaved(new Date().toLocaleString());
    }, 1000);
  };

  const handlePreview = () => {
    // 预览功能实现
    console.log('预览功能');
  };

  const handleEditorChange = (editor: any) => {
    setContent(editor.getHtml());
  };

  const handleEditorCreated = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="create-note-page">
      {/* 顶部导航栏 */}
      <header className="create-note-header">
        <button className="back-button" onClick={onBack}>
          ← 返回首页
        </button>
        <h1>发布笔记</h1>
        <div className="header-actions">
          <div className="public-toggle">
            <label>
              <input
                type="radio"
                name="permission"
                value="public"
                checked={permission === 'public'}
                onChange={() => setPermission('public')}
              />
              公开
            </label>
            <label>
              <input
                type="radio"
                name="permission"
                value="private"
                checked={permission === 'private'}
                onChange={() => setPermission('private')}
              />
              私密
            </label>
          </div>
          <button className="preview-button" onClick={handlePreview}>
            预览
          </button>
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '发布中...' : '发布'}
          </button>
        </div>
      </header>

      {/* 元信息区域 */}
      <div className="note-meta-section">
        <div className="meta-container">
          <div className="meta-section">
            <label htmlFor="title">标题</label>
            <input
              id="title"
              type="text"
              className="title-input"
              placeholder="请输入标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="meta-row">
            <div className="meta-item">
              <label htmlFor="category">分类</label>
              <select
                id="category"
                className="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="学习笔记">学习笔记</option>
                <option value="技术笔记">技术笔记</option>
                <option value="生活笔记">生活笔记</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div className="meta-item tags-item">
              <label>标签</label>
              <div className="tag-input-container">
                <div className="tags">
                  {tags.map((tag, index) => (
                    <div key={index} className="tag">
                      {tag}
                      <button 
                        className="tag-remove" 
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    className="tag-input"
                    placeholder="输入标签后按回车添加"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="editor-wrapper">
        <div className="editor-container">
          {/* wangEditor 工具栏 */}
          <div className="wangeditor-toolbar">
            <Toolbar
              editor={editorRef.current}
              defaultConfig={{
                excludeKeys: ['fullScreen', 'code', 'preview']
              }}
              style={{
                borderBottom: '1px solid #e8e8e8'
              }}
            />
          </div>
          {/* wangEditor 内容区域 */}
          <div className="wangeditor-content">
            <Editor
              defaultConfig={{
                placeholder: '请输入内容...',
                MENU_CONF: {
                  uploadImage: {
                    server: '/api/upload',
                    fieldName: 'file'
                  }
                }
              }}
              style={{
                height: '600px',
                border: '1px solid #e8e8e8',
                borderTop: 'none'
              }}
              onCreated={handleEditorCreated}
              onChange={handleEditorChange}
            />
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <footer className="create-note-footer">
        <div className="footer-info">
          <span>上次保存：{lastSaved}</span>
          <span>权限：{permission === 'public' ? '公开' : '私密'}</span>
        </div>
      </footer>
    </div>
  );
};

export default CreateNote;