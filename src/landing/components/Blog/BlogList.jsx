import React from 'react';
import Link from 'next/link';
import BlogItem from './BlogItem';
import { BLOGS } from './data.js';
import styles from './Blog.module.css';
const BlogList = () => {
  return (
    <div className={styles.mainContainer}>
      {BLOGS.map((blog) => (
        <Link key={blog.id} href={`/blog/${blog.id}`} passHref>
          <BlogItem blog={blog} href={`/blog/${blog.id}`}/>
        </Link>
      ))}
    </div>
  );
};
export default BlogList;
