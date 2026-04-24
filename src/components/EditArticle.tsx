import { useState, useEffect, useRef } from 'react';
import '../styles/CreateArticle.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';

interface EditArticleProps {
  onBack: () => void;
  onSave: (article: {
    id: number;
    title: string;
    content: string;
    tags: string[];
    category: string;
    permission: string
  }) => void;
  article: {
    id: number;
    title: string;
    content: string;
    createdAt: string;
  };
}

const EditArticle = ({ onBack, onSave, article }: EditArticleProps) => {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [category, setCategory] = useState('技术文章');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [permission, setPermission] = useState('public');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date().toLocaleString());
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (title || content.trim()) {
        setLastSaved(new Date().toLocaleString());
      }
    }, 30000);

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

    setTimeout(() => {
      onSave({
        id: article.id,
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
    console.log('预览功能');
  };

  const handleEditorChange = (editor: any) => {
    setContent(editor.getHtml());
  };

  const handleEditorCreated = (editor: any) => {
    setEditor(editor);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="create-article-page">
      <header className="create-article-header">
        <button className="back-button" onClick={onBack}>
          ← 返回
        </button>
        <h1>编辑文章</h1>
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
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </header>

      <div className="article-meta-section">
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
                <option value="技术文章">技术文章</option>
                <option value="学习笔记">学习笔记</option>
                <option value="教程">教程</option>
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

      <div className="editor-wrapper">
        <div className="editor-container">
          <Toolbar
            editor={editor}
            mode="default"
          />
          <Editor
            defaultConfig={{
              placeholder: '请输入内容...'
            }}
            style={{
              height: '600px'
            }}
            onCreated={handleEditorCreated}
            onChange={handleEditorChange}
            value={content}
          />
        </div>
      </div>

      <footer className="create-article-footer">
        <div className="footer-info">
          <span>原文发布时间：{formatDate(article.createdAt)}</span>
          <span>上次保存：{lastSaved}</span>
          <span>权限：{permission === 'public' ? '公开' : '私密'}</span>
        </div>
      </footer>
    </div>
  );
};

export default EditArticle;