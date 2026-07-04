import { RevealSection } from "../components/RevealSection";
import { ConnectSection } from "../components/ConnectSection";
import { ReviewForm } from "../features/reviews/ReviewForm";
import { ReviewList } from "../features/reviews/ReviewList";
import { useReviews } from "../features/reviews/useReviews";

export function ReviewsPage() {
  const { status, reviews, errorMessage, successMessage, submit } = useReviews();

  return (
    <div className="content-grid reviews-grid">
      <RevealSection className="panel hero-entrance" delay={0}>
        <p className="section-label">Reviews</p>
        <h1>What people are saying</h1>
        <p>Share your experience with Arkitect, or read what other visitors have said.</p>
      </RevealSection>

      <RevealSection className="panel" delay={60} aria-labelledby="review-form-heading">
        <p className="section-label">Leave A Review</p>
        <h2 id="review-form-heading">Share your feedback</h2>
        <ReviewForm
          isSubmitting={status === "submitting"}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onSubmit={submit}
        />
      </RevealSection>

      <RevealSection className="panel panel-card-wide" delay={100} aria-labelledby="review-list-heading">
        <p className="section-label">Community Feedback</p>
        <h2 id="review-list-heading">Recent reviews</h2>
        <ReviewList reviews={reviews} isLoading={status === "loading"} />
      </RevealSection>

      <RevealSection delay={140}>
        <ConnectSection />
      </RevealSection>
    </div>
  );
}
