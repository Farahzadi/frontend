import React from 'react';
import Image from 'next/image';
import styles from './Blog.module.css';
const BlogItem = React.forwardRef(function ForwardRefBlogItem({ blog, href}, ref) {
  const { imgUrl, title, excerpt } = blog;
  return (
    <a ref={ref} href={href}>
    <article className={styles.blog}>
      <div>
        <div className={styles.coverImg}>
          <Image src={imgUrl} alt={title} width={2024} height={1012} />
        </div>
        <div className={styles.title}>{blog.title}</div>
        <p className={styles.excerpt}>{blog.excerpt}</p>
        <div className={styles.footer}>{blog.publishDate}</div>
      </div>
    </article>
    </a>
  );
});

export default BlogItem;