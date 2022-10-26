import { Router, useRouter } from 'next/router';
import BlogDetail from '../../components/Blog/BlogDetail';

const Blog = () => {
    const router = useRouter();
    const {id} = router.query;

    return (
        <BlogDetail id={id} />
    )
}

export default Blog;