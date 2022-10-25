import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import {BLOGS} from './data';
import styles from './Blog.module.css';
const BlogDetail = ({id}) => {
    const [blog, setBlog] = useState(null);
    useEffect(() => {
        const blog = BLOGS.find(val => +val.id === +id);
        setBlog(blog);
    }, [id]);
    if (!blog) {
        return null
    }
    return (
    <section className={styles.section}>
        <div className={styles.detailContainer}>
            <h2 className={styles.detailTitle}>{blog.title}</h2>
            <div className={styles.imageContainer}>
                <Image src={blog.imgUrl} width={1280} height={800} alt={blog.title} />

            </div>
            <div className={styles.detailMainContainer}>
                <p className={styles.blogDetail}>{blog.excerpt}</p>
            </div>

        </div>
    </section>
    );
}
export default BlogDetail;