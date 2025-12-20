import PostCard from '@/components/shared/PostCard';
import type { Post } from '@/types/post';

interface AICardProps {
  post: Post;
}

export default function AICard({ post }: AICardProps) {
  return <PostCard post={post} variant="overlay-square" theme="purple" />;
}

