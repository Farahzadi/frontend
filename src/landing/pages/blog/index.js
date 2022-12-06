import React from 'react';
import BlogList from '../../components/Blog/BlogList';
import CustomizedHead from '../../components/Head/Head';
const Blog = () => {
  return (
    <>
      <CustomizedHead title='FAQ'></CustomizedHead>
      <section>
        <div>
          <h1>Blog</h1>
        </div>
        <div>
          <BlogList />
        </div>
      </section>
    </>
  );
};
export default Blog;
