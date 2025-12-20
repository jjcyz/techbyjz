import PostCard from '@/components/shared/PostCard';
import type { Post } from '@/types/post';

interface NewsCardProps {
  post: Post;
  featured?: boolean;
}

export default function NewsCard({ post, featured = false }: NewsCardProps) {
  return (
    <PostCard
      post={post}
      variant="horizontal-content"
      theme="electric-blue"
      featured={featured}
      imageWidth={featured ? 400 : 200}
      imageHeight={featured ? 240 : 120}
    />
  );
}

