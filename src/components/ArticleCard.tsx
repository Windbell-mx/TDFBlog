import React from 'react';

interface Article {
  id: number;
  title: string;
  content: string;
  date: string;
  category: string;
  readCount: number;
}

interface ArticleCardProps {
  article: Article;
  onClick?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 提取纯文本内容（去除HTML标签）
  const extractPlainText = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    // 限制字数，最多显示100个字符
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  // 处理文章点击事件
  const handleArticleClick = () => {
    // 使用传入的onClick回调函数
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className="article-card" 
      style={{
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={handleArticleClick}
      title="点击查看文章详情"
    >
      <div className="article-header">
        <span className="article-category">{article.category}</span>
        <span className="article-date">{formatDate(article.date)}</span>
      </div>
      <h3 className="article-title">{article.title}</h3>
      <p className="article-content">{extractPlainText(article.content)}</p>
      <div className="article-footer">
        <span className="article-reads">👁 {article.readCount}</span>
      </div>
    </div>
  );
};

export default ArticleCard;