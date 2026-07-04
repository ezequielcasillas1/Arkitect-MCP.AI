import type { Review } from "./types";

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function ReviewList({ reviews, isLoading }: ReviewListProps) {
  if (isLoading) {
    return <p className="helper-copy">Loading reviews…</p>;
  }

  if (reviews.length === 0) {
    return (
      <div className="empty-state">
        <strong>No reviews yet</strong>
        <p>Be the first to share feedback about Arkitect.</p>
      </div>
    );
  }

  return (
    <ul className="review-list" aria-label="Visitor reviews">
      {reviews.map((review) => (
        <li key={review.id} className="review-card">
          <div className="review-card-header">
            <strong>{review.name}</strong>
            <span aria-label={`${review.rating} out of 5 stars`}>
              <span aria-hidden="true">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
            </span>
          </div>
          <p>{review.message}</p>
          <span className="review-card-date">{formatDate(review.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
