import PostCard from '@/components/shared/PostCard';
import type { Post } from '@/types/post';

interface AIInfrastructureCardProps {
  post: Post;
}

export default function AIInfrastructureCard({ post }: AIInfrastructureCardProps) {
  return <PostCard post={post} variant="overlay-square" theme="purple" />;
}

