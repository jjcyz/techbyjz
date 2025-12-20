import PostCard from '@/components/shared/PostCard';
import type { Post } from '@/types/post';

interface AutomationCardProps {
  post: Post;
  featured?: boolean;
}

export default function AutomationCard({ post, featured = false }: AutomationCardProps) {
  return (
    <PostCard
      post={post}
      variant={featured ? 'overlay-featured' : 'overlay-square'}
      theme="electric-blue"
      featured={featured}
    />
  );
}

