import PostCard from '@/components/shared/PostCard';
import type { Post } from '@/types/post';

interface FeaturedCardProps {
  post: Post;
}

export default function FeaturedCard({ post }: FeaturedCardProps) {
  return (
    <PostCard
      post={post}
      variant="overlay-featured"
      theme="electric-blue"
      featured
      imageWidth={400}
      imageHeight={250}
    />
  );
}

