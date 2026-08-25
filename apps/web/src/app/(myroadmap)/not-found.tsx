import { NotFoundFallback } from '@/components/NotFoundFallback';
import { ERROR_MESSAGES } from '@/constants/messages';

export default function MyroadmapNotFound() {
  return <NotFoundFallback homeHref="/myroadmap" homeLabel={ERROR_MESSAGES.GO_MY_ROADMAPS} />;
}
