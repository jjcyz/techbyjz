import PostCard from '@/components/shared/PostCard';
import type { Post } from '@/types/post';

interface CybersecurityCardProps {
  post: Post;
  featured?: boolean;
}

export default function CybersecurityCard({ post, featured = false }: CybersecurityCardProps) {
  return (
    <PostCard
      post={post}
      variant={featured ? 'overlay-featured' : 'overlay-horizontal'}
      theme="red"
      featured={featured}
    />
  );
}

